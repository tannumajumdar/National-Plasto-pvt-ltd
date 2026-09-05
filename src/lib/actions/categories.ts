"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { adminCategorySchema } from "@/lib/validations";
import { fieldErrors } from "@/lib/api";
import type { ActionResult } from "@/lib/actions/products";

function revalidateCategories() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

export async function saveCategory(
  id: string | null,
  raw: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  // Both name and slug are unique in the schema, so check them separately to
  // point the error at the field the admin actually needs to change.
  const clash = await prisma.category.findFirst({
    where: {
      ...(id ? { id: { not: id } } : {}),
      OR: [{ slug: data.slug }, { name: data.name }],
    },
    select: { name: true, slug: true },
  });
  if (clash) {
    return {
      ok: false,
      message: "Another category already uses that name or slug.",
      fields:
        clash.slug === data.slug
          ? { slug: "This slug is already in use." }
          : { name: "This name is already in use." },
    };
  }

  // The tree is deliberately two levels deep, matching the brand sheets: a
  // group holds headings, and a heading holds products. Allowing a heading to
  // become a parent would produce depths the storefront does not render.
  const parentId = data.parentId || null;
  if (parentId) {
    if (parentId === id) {
      return {
        ok: false,
        message: "A category cannot sit inside itself.",
        fields: { parentId: "Pick a different parent." },
      };
    }

    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });
    if (!parent) {
      return {
        ok: false,
        message: "That parent category no longer exists.",
        fields: { parentId: "Pick a different parent." },
      };
    }
    if (parent.parentId) {
      return {
        ok: false,
        message: "Categories only nest one level deep.",
        fields: { parentId: "Pick a top-level category." },
      };
    }

    if (id) {
      const childCount = await prisma.category.count({ where: { parentId: id } });
      if (childCount > 0) {
        return {
          ok: false,
          message: `This category has ${childCount} sub-categories, so it cannot be nested itself.`,
          fields: { parentId: "Move its sub-categories out first." },
        };
      }
    }
  }

  const payload = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    image: data.image || null,
    parentId,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };

  const category = id
    ? await prisma.category.update({ where: { id }, data: payload, select: { id: true } })
    : await prisma.category.create({ data: payload, select: { id: true } });

  revalidateCategories();
  return { ok: true, message: id ? "Category updated." : "Category created.", id: category.id };
}

/**
 * Deletes a category.
 *
 * Unlike a collection, a product's category is optional (`onDelete: SetNull`),
 * so deleting one does not orphan anything — its products simply become
 * uncategorised. That is destructive but recoverable only by hand, so the
 * count is returned to the caller and surfaced in the confirmation dialog.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();

  const category = await prisma.category.findUnique({
    where: { id },
    select: { name: true, _count: { select: { products: true } } },
  });
  if (!category) return { ok: false, message: "Category not found." };

  await prisma.category.delete({ where: { id } });

  revalidateCategories();
  return {
    ok: true,
    message:
      category._count.products > 0
        ? `${category.name} deleted. ${category._count.products} products are now uncategorised.`
        : `${category.name} deleted.`,
  };
}

export async function toggleCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  const category = await prisma.category.update({
    where: { id },
    data: { isActive },
    select: { name: true },
  });

  revalidateCategories();
  return {
    ok: true,
    message: `${category.name} ${isActive ? "activated" : "deactivated"}.`,
  };
}
