"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { orderStatusSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/products";

/** Raised when reinstating a cancelled order would need stock that is gone. */
class InsufficientStockError extends Error {
  constructor(public productName: string, public available: number, public needed: number) {
    super(`Insufficient stock for ${productName}`);
  }
}

/**
 * Updates an order's status and appends a timeline event.
 *
 * Cancelling an order returns its stock, so inventory stays truthful. The
 * restock only happens on the transition INTO cancelled, never on repeat
 * saves of an already-cancelled order.
 *
 * Two rules keep the stock ledger honest, and both mirror what checkout does:
 *
 *  - Products with `trackStock: false` are skipped in BOTH directions.
 *    Checkout never decremented them, so cancelling must not increment them —
 *    otherwise every cancelled order invents inventory out of nothing.
 *  - Reinstating a cancelled order is refused unless every tracked line can
 *    still be covered. A conditional updateMany does the check and the write
 *    in one statement, so a concurrent order cannot slip in between them.
 */
export async function updateOrderStatus(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = orderStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Invalid status update." };

  const { orderId, status, note } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          name: true,
          product: { select: { trackStock: true, stock: true } },
        },
      },
    },
  });
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status === status) return { ok: true, message: "Status unchanged." };

  const isCancelling = status === "CANCELLED" && order.status !== "CANCELLED";
  const isUncancelling = order.status === "CANCELLED" && status !== "CANCELLED";

  // Lines whose product still exists and is stock-tracked. Deleted products
  // (productId null) and untracked ones carry no inventory to move.
  const stockLines = order.items.filter((i) => i.productId && i.product?.trackStock);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          // Delivered COD orders are paid by definition.
          ...(status === "DELIVERED" ? { paymentStatus: "PAID" as const } : {}),
        },
      });

      await tx.orderEvent.create({
        data: { orderId, status, note: note || null },
      });

      for (const item of stockLines) {
        if (isCancelling) {
          await tx.product.update({
            where: { id: item.productId! },
            data: { stock: { increment: item.quantity } },
          });
        } else if (isUncancelling) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId!, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new InsufficientStockError(
              item.name,
              item.product?.stock ?? 0,
              item.quantity,
            );
          }
        }
      }
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return {
        ok: false,
        message:
          `Cannot reinstate this order: ${err.productName} needs ${err.needed} in stock ` +
          `but only ${err.available} remain. Restock it first, then change the status.`,
      };
    }
    throw err;
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/account/orders");

  return { ok: true, message: `Order ${order.orderNumber} marked as ${status.toLowerCase()}.` };
}
