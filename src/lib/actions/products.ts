"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { pricingFields } from "@/lib/pricing";
import { deleteStoredImage } from "@/lib/storage/local";
import { adminProductSchema } from "@/lib/validations";
import { fieldErrors } from "@/lib/api";

export interface ActionResult {
  ok: boolean;
  message?: string;
  fields?: Record<string, string>;
  id?: string;
}

/** Refreshes every surface a catalogue change can affect. */
function revalidateCatalogue(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/collections");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/products/${slug}`);
}

/**
 * A product is "complete" once an admin has supplied the things the source
 * product list never had: a price, a description and at least one image.
 * The needsReview flag drives the admin's outstanding-work queue.
 */
function computeNeedsReview(input: {
  price: number | null;
  description?: string | null;
  images: string[];
}): boolean {
  return input.price === null || !input.description?.trim() || input.images.length === 0;
}

export async function createProduct(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const clash = await prisma.product.findFirst({
    where: { OR: [{ slug: data.slug }, { sku: data.sku }] },
    select: { slug: true, sku: true },
  });
  if (clash) {
    return {
      ok: false,
      message: "A product with that slug or SKU already exists.",
      fields:
        clash.slug === data.slug
          ? { slug: "This slug is already in use." }
          : { sku: "This SKU is already in use." },
    };
  }

  const pricing = pricingFields(data.price, data.discountPrice);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      collectionId: data.collectionId,
      categoryId: data.categoryId || null,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      price: data.price,
      discountPrice: data.discountPrice,
      ...pricing,
      stock: data.stock,
      trackStock: data.trackStock,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      isBestSeller: data.isBestSeller,
      isPublished: data.isPublished,
      needsReview: computeNeedsReview({
        price: data.price,
        description: data.description,
        images: data.images,
      }),
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      images: {
        create: data.images.map((url, i) => ({ url, alt: data.name, sortOrder: i })),
      },
      features: {
        create: data.features.map((label, i) => ({ label, sortOrder: i })),
      },
      specifications: {
        create: data.specifications.map((s, i) => ({ name: s.name, value: s.value, sortOrder: i })),
      },
    },
    select: { id: true, slug: true },
  });

  revalidateCatalogue(product.slug);
  return { ok: true, message: "Product created.", id: product.id };
}

export async function updateProduct(id: string, raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = adminProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true, images: { select: { url: true } } },
  });
  if (!existing) return { ok: false, message: "Product not found." };

  const clash = await prisma.product.findFirst({
    where: { id: { not: id }, OR: [{ slug: data.slug }, { sku: data.sku }] },
    select: { slug: true, sku: true },
  });
  if (clash) {
    return {
      ok: false,
      message: "Another product already uses that slug or SKU.",
      fields:
        clash.slug === data.slug
          ? { slug: "This slug is already in use." }
          : { sku: "This SKU is already in use." },
    };
  }

  const pricing = pricingFields(data.price, data.discountPrice);

  await prisma.$transaction([
    // Child rows are replaced wholesale — simpler and safer than diffing,
    // and these lists are small.
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productFeature.deleteMany({ where: { productId: id } }),
    prisma.productSpec.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        collectionId: data.collectionId,
        categoryId: data.categoryId || null,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        price: data.price,
        discountPrice: data.discountPrice,
        ...pricing,
        stock: data.stock,
        trackStock: data.trackStock,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
        isBestSeller: data.isBestSeller,
        isPublished: data.isPublished,
        needsReview: computeNeedsReview({
          price: data.price,
          description: data.description,
          images: data.images,
        }),
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        images: {
          create: data.images.map((url, i) => ({ url, alt: data.name, sortOrder: i })),
        },
        features: {
          create: data.features.map((label, i) => ({ label, sortOrder: i })),
        },
        specifications: {
          create: data.specifications.map((s, i) => ({
            name: s.name,
            value: s.value,
            sortOrder: i,
          })),
        },
      },
    }),
  ]);

  // Remove upload files that are no longer referenced anywhere.
  const removed = existing.images
    .map((i) => i.url)
    .filter((url) => !data.images.includes(url));
  await Promise.all(removed.map((url) => deleteStoredImage(url)));

  revalidateCatalogue(data.slug);
  if (existing.slug !== data.slug) revalidatePath(`/products/${existing.slug}`);

  return { ok: true, message: "Product updated.", id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, name: true, images: { select: { url: true } } },
  });
  if (!product) return { ok: false, message: "Product not found." };

  await prisma.product.delete({ where: { id } });
  await Promise.all(product.images.map((i) => deleteStoredImage(i.url)));

  revalidateCatalogue(product.slug);
  return { ok: true, message: `${product.name} deleted.` };
}

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum([
    "publish",
    "unpublish",
    "feature",
    "unfeature",
    "markNew",
    "unmarkNew",
    "markBestSeller",
    "unmarkBestSeller",
    "delete",
  ]),
});

export async function bulkUpdateProducts(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = bulkSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Invalid bulk request." };

  const { ids, action } = parsed.data;

  if (action === "delete") {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { images: { select: { url: true } } },
    });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await Promise.all(
      products.flatMap((p) => p.images.map((i) => deleteStoredImage(i.url))),
    );
    revalidateCatalogue();
    return { ok: true, message: `${ids.length} products deleted.` };
  }

  const FLAG_UPDATES = {
    publish: { isPublished: true },
    unpublish: { isPublished: false },
    feature: { isFeatured: true },
    unfeature: { isFeatured: false },
    markNew: { isNew: true },
    unmarkNew: { isNew: false },
    markBestSeller: { isBestSeller: true },
    unmarkBestSeller: { isBestSeller: false },
  } satisfies Record<string, Prisma.ProductUpdateManyMutationInput>;

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: FLAG_UPDATES[action],
  });

  revalidateCatalogue();
  return { ok: true, message: `${ids.length} products updated.` };
}

/** Inline stock edit from the products table. */
export async function updateStock(id: string, stock: number): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isFinite(stock) || stock < 0 || stock > 1_000_000) {
    return { ok: false, message: "Enter a stock value between 0 and 1,000,000." };
  }

  const product = await prisma.product.update({
    where: { id },
    data: { stock: Math.floor(stock) },
    select: { slug: true },
  });

  revalidateCatalogue(product.slug);
  return { ok: true, message: "Stock updated." };
}
