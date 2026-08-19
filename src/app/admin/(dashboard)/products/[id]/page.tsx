import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ProductForm, type ProductFormInitial } from "@/components/admin/product-form";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, collections, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
        features: { orderBy: { sortOrder: "asc" }, select: { label: true } },
        specifications: { orderBy: { sortOrder: "asc" }, select: { name: true, value: true } },
      },
    }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  const initial: ProductFormInitial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    collectionId: product.collectionId,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    discountPrice: product.discountPrice,
    stock: product.stock,
    trackStock: product.trackStock,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    isPublished: product.isPublished,
    needsReview: product.needsReview,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    images: product.images.map((i) => i.url),
    features: product.features.map((f) => f.label),
    specifications: product.specifications.map((s) => ({ name: s.name, value: s.value })),
  };

  return (
    <>
      <AdminTopbar
        title={product.name}
        description={`SKU ${product.sku}`}
        crumbs={[{ label: "Products", href: "/admin/products" }, { label: product.name }]}
        menuSlot={<AdminMenuButton />}
      />
      <div className="p-5 sm:p-8">
        <ProductForm initial={initial} collections={collections} categories={categories} />
      </div>
    </>
  );
}
