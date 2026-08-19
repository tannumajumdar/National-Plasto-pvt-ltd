"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { adminCollectionSchema } from "@/lib/validations";
import { fieldErrors } from "@/lib/api";
import type { ActionResult } from "@/lib/actions/products";

function revalidateCollections(slug?: string) {
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/admin/collections");
  if (slug) revalidatePath(`/collections/${slug}`);
}

export async function saveCollection(
  id: string | null,
  raw: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const clash = await prisma.collection.findFirst({
    where: {
      ...(id ? { id: { not: id } } : {}),
      OR: [{ slug: data.slug }, { name: data.name }],
    },
    select: { slug: true },
  });
  if (clash) {
    return {
      ok: false,
      message: "Another collection already uses that name or slug.",
      fields: { slug: "This name or slug is already in use." },
    };
  }

  const payload = {
    name: data.name,
    slug: data.slug,
    tagline: data.tagline || null,
    description: data.description || null,
    bannerImage: data.bannerImage || null,
    accent: data.accent,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };

  const collection = id
    ? await prisma.collection.update({ where: { id }, data: payload, select: { id: true, slug: true } })
    : await prisma.collection.create({ data: payload, select: { id: true, slug: true } });

  revalidateCollections(collection.slug);
  return { ok: true, message: id ? "Collection updated." : "Collection created.", id: collection.id };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin();

  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { name: true, slug: true, _count: { select: { products: true } } },
  });
  if (!collection) return { ok: false, message: "Collection not found." };

  // Products reference their collection as a required relation, so a
  // non-empty collection cannot be deleted without orphaning them.
  if (collection._count.products > 0) {
    return {
      ok: false,
      message: `${collection.name} still has ${collection._count.products} products. Move or delete them first, or deactivate the collection instead.`,
    };
  }

  await prisma.collection.delete({ where: { id } });

  revalidateCollections(collection.slug);
  return { ok: true, message: `${collection.name} deleted.` };
}

export async function toggleCollectionActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  const collection = await prisma.collection.update({
    where: { id },
    data: { isActive },
    select: { name: true, slug: true },
  });

  revalidateCollections(collection.slug);
  return {
    ok: true,
    message: `${collection.name} ${isActive ? "activated" : "deactivated"}.`,
  };
}
