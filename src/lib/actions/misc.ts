"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/products";

/* ---------------- Reviews ---------------- */

const reviewActionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "unapprove", "delete"]),
});

/** Approving or removing a review recomputes the product's cached rating. */
export async function moderateReview(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = reviewActionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { id, action } = parsed.data;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!review) return { ok: false, message: "Review not found." };

  if (action === "delete") {
    await prisma.review.delete({ where: { id } });
  } else {
    await prisma.review.update({
      where: { id },
      data: { isApproved: action === "approve" },
    });
  }

  await recomputeProductRating(review.productId);

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return { ok: true, message: `Review ${action}d.` };
}

async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)),
      reviewCount: agg._count._all,
    },
    select: { slug: true },
  });

  revalidatePath(`/products/${product.slug}`);
}

/* ---------------- Customers ---------------- */

const customerStatusSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

export async function setCustomerActive(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = customerStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { id, isActive } = parsed.data;

  // An admin must not be able to lock themselves out.
  if (id === admin.id) {
    return { ok: false, message: "You cannot deactivate your own account." };
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return { ok: false, message: "Customer not found." };
  if (target.role === "ADMIN") {
    return { ok: false, message: "Administrator accounts cannot be deactivated here." };
  }

  await prisma.user.update({ where: { id }, data: { isActive } });

  revalidatePath("/admin/customers");
  return { ok: true, message: isActive ? "Customer reactivated." : "Customer deactivated." };
}

/* ---------------- Contact messages ---------------- */

export async function markMessageRead(id: string, isRead = true): Promise<ActionResult> {
  await requireAdmin();

  await prisma.contactMessage.update({ where: { id }, data: { isRead } });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true, message: isRead ? "Marked as read." : "Marked as unread." };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.contactMessage.delete({ where: { id } });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true, message: "Message deleted." };
}
