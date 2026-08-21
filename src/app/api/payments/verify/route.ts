import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PaymentError, verifyRazorpaySignature } from "@/lib/payments";
import { clientIp, fail, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";

export const runtime = "nodejs";

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Confirms a Razorpay payment.
 *
 * This endpoint is the only thing in the app that can mark an order PAID, and
 * it does so on exactly one piece of evidence: an HMAC over
 * `${razorpayOrderId}|${razorpayPaymentId}` that matches our secret. The
 * browser calls this after its checkout callback, but its say-so counts for
 * nothing — the payload is public and anyone could post it.
 *
 * Three further guards close the obvious holes:
 *  - the order must belong to the signed-in user;
 *  - the razorpayOrderId must match the one WE created for that order, so a
 *    valid signature from a different (cheaper) order cannot be replayed here;
 *  - an already-paid order is left untouched.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.", 401);

  const limit = rateLimit(`verify:${user.id}:${clientIp(request)}`, {
    limit: 20,
    windowMs: 300_000,
  });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, verifySchema);
  if (error) return error;

  const order = await prisma.order.findFirst({
    where: { id: data.orderId, userId: user.id },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      paymentMethod: true,
      razorpayOrderId: true,
    },
  });
  if (!order) return fail("Order not found.", 404);

  if (order.paymentStatus === "PAID") {
    return ok({ alreadyPaid: true, orderNumber: order.orderNumber });
  }
  if (order.paymentMethod !== "RAZORPAY") {
    return fail("This order was not placed for online payment.", 400);
  }

  // Bind the signature to the order we actually opened with Razorpay.
  if (!order.razorpayOrderId || order.razorpayOrderId !== data.razorpayOrderId) {
    return fail("This payment does not belong to that order.", 400);
  }

  let valid: boolean;
  try {
    valid = await verifyRazorpaySignature({
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      signature: data.signature,
    });
  } catch (err) {
    if (err instanceof PaymentError) return fail(err.message, 503);
    throw err;
  }

  if (!valid) {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          note: "Online payment failed signature verification. Not marked paid.",
        },
      }),
    ]);
    return fail("Payment could not be verified. You have not been charged by us.", 400);
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId: data.razorpayPaymentId,
        status: "CONFIRMED",
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: "CONFIRMED",
        note: `Online payment verified (${data.razorpayPaymentId}).`,
      },
    }),
  ]);

  return ok({ paid: true, orderNumber: order.orderNumber });
}
