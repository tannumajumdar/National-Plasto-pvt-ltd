"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { orderStatusSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/products";

/**
 * Updates an order's status and appends a timeline event.
 *
 * Cancelling an order returns its stock, so inventory stays truthful. The
 * restock only happens on the transition INTO cancelled, never on repeat
 * saves of an already-cancelled order.
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
      items: { select: { productId: true, quantity: true } },
    },
  });
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status === status) return { ok: true, message: "Status unchanged." };

  const isCancelling = status === "CANCELLED" && order.status !== "CANCELLED";
  const isUncancelling = order.status === "CANCELLED" && status !== "CANCELLED";

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

    for (const item of order.items) {
      if (!item.productId) continue;
      if (isCancelling) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      } else if (isUncancelling) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/account/orders");

  return { ok: true, message: `Order ${order.orderNumber} marked as ${status.toLowerCase()}.` };
}
