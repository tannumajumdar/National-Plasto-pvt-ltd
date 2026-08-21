import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveCart } from "@/lib/cart";
import { assertMethodAllowed, createRazorpayOrder, PaymentError } from "@/lib/payments";
import { checkoutSchema, cartLineSchema } from "@/lib/validations";
import { clientIp, fail, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";
import { absoluteUrl, generateOrderNumber } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";

const bodySchema = checkoutSchema.extend({
  lines: z.array(cartLineSchema).min(1, "Your cart is empty."),
  saveAddress: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in to place an order.", 401);

  const limit = rateLimit(`order:${user.id}:${clientIp(request)}`, {
    limit: 10,
    windowMs: 300_000,
  });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const methodCheck = assertMethodAllowed(data.paymentMethod);
  if (!methodCheck.allowed) return fail(methodCheck.reason!, 400);

  // Re-resolve from the database: prices, stock and availability are never
  // taken from the client.
  const { lines, totals } = await resolveCart(data.lines);

  if (lines.length === 0) {
    return fail("None of the items in your cart are still available.", 409);
  }
  if (totals.unpricedCount > 0) {
    return fail(
      "Your cart contains items with no published price. Remove them or send an enquiry instead.",
      409,
    );
  }
  if (totals.total <= 0) {
    return fail("Order total must be greater than zero.", 409);
  }

  // Compare against what the customer was shown, so a price change between
  // rendering the page and submitting is surfaced rather than silently applied.
  const requested = new Map(data.lines.map((l) => [l.productId, l.quantity]));
  const adjusted = lines.filter((l) => requested.get(l.productId) !== l.quantity);
  if (adjusted.length > 0) {
    return fail(
      "Stock changed while you were checking out. Please review your cart and try again.",
      409,
      { adjusted: adjusted.map((l) => ({ productId: l.productId, available: l.stock })) },
    );
  }

  const orderNumber = generateOrderNumber();

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock conditionally — the updateMany count tells us whether
      // another order took the last unit between resolve and commit.
      for (const line of lines) {
        if (!line.trackStock) continue;
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new OutOfStockError(line.name);
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shipLine1: data.line1,
          shipLine2: data.line2 || null,
          shipCity: data.city,
          shipState: data.state,
          shipPincode: data.pincode,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          total: totals.total,
          status: "PENDING",
          // COD orders are unpaid until delivery. Online orders stay PENDING
          // until a payment is actually verified — never marked PAID here.
          paymentStatus: data.paymentMethod === "COD" ? "UNPAID" : "PENDING",
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              name: line.name,
              slug: line.slug,
              collectionName: line.collectionName,
              image: line.image,
              unitPrice: line.unitPrice!,
              quantity: line.quantity,
              lineTotal: line.unitPrice! * line.quantity,
            })),
          },
          events: {
            create: {
              status: "PENDING",
              note: `Order placed (${data.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment"}).`,
            },
          },
        },
        select: { id: true, orderNumber: true, total: true },
      });

      // Clear the stored cart now that it has become an order.
      const cart = await tx.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (data.saveAddress) {
        await tx.address.create({
          data: {
            userId: user.id,
            label: "Shipping",
            fullName: data.customerName,
            phone: data.customerPhone,
            line1: data.line1,
            line2: data.line2 || null,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          },
        });
      }

      return created;
    });

    // For online payment, open a Razorpay order so the browser has something
    // real to pay against. Deliberately AFTER the local order exists: if this
    // fails, the customer still has a recorded order our team can chase, and
    // the response says plainly that payment could not be started.
    let razorpay: { orderId: string; amount: number; keyId: string } | null = null;
    let paymentError: string | null = null;

    if (data.paymentMethod === "RAZORPAY") {
      try {
        const rp = await createRazorpayOrder(totals.total, order.orderNumber);
        await prisma.order.update({
          where: { id: order.id },
          data: { razorpayOrderId: rp.id },
        });
        razorpay = {
          orderId: rp.id,
          amount: rp.amount,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        };
      } catch (err) {
        paymentError =
          err instanceof PaymentError
            ? err.message
            : "Could not start the payment. Your order has been recorded as unpaid.";
        console.error("[orders] razorpay order creation failed:", err);
      }
    }

    // Confirmation email. Never awaited into the failure path: a bounced
    // email must not cost the customer an order that is already committed.
    void sendEmail(
      orderConfirmationEmail({
        to: data.customerEmail,
        customerName: data.customerName,
        orderNumber: order.orderNumber,
        items: lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice!,
          lineTotal: l.unitPrice! * l.quantity,
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        paymentMethod: data.paymentMethod,
        // Nothing is paid at this point, for either method.
        paid: false,
        address: [
          data.customerName,
          data.line1,
          data.line2 || null,
          `${data.city}, ${data.state} ${data.pincode}`,
          data.customerPhone,
        ]
          .filter(Boolean)
          .join("\n"),
        orderUrl: absoluteUrl(`/order-confirmation/${order.orderNumber}`),
      }),
    ).catch((err) => console.error("[orders] confirmation email failed:", err));

    return ok(
      {
        order,
        // No payment has been taken. For COD this is the final state; for
        // online payment the client must still complete a real transaction.
        requiresPayment: data.paymentMethod !== "COD",
        razorpay,
        paymentError,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OutOfStockError) {
      return fail(`${err.productName} sold out while you were checking out.`, 409);
    }
    console.error("[orders] failed to create order:", err);
    return fail("Could not place your order. Please try again.", 500);
  }
}

class OutOfStockError extends Error {
  constructor(public productName: string) {
    super(`Out of stock: ${productName}`);
  }
}
