import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ProductsTable, type AdminProductRow } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/products/pagination";
import prisma from "@/lib/db/prisma";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import type { SearchParamsInput } from "@/lib/filters";
import type { AccentToken } from "@/lib/placeholder";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim();
  const collectionSlug = one(sp.collection);
  const status = one(sp.status);
  const needsReview = one(sp.needsReview) === "1";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.ProductWhereInput = {};
  const AND: Prisma.ProductWhereInput[] = [];

  if (q) AND.push({ OR: [{ name: { contains: q } }, { sku: { contains: q } }] });
  if (collectionSlug && collectionSlug !== "all") {
    AND.push({ collection: { slug: collectionSlug } });
  }
  if (needsReview) AND.push({ needsReview: true });

  switch (status) {
    case "published": AND.push({ isPublished: true }); break;
    case "draft": AND.push({ isPublished: false }); break;
    case "featured": AND.push({ isFeatured: true }); break;
    case "outofstock": AND.push({ trackStock: true, stock: { lte: 0 } }); break;
  }

  if (AND.length) where.AND = AND;

  const [rows, total, collections] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ needsReview: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true, name: true, slug: true, sku: true,
        price: true, discountPrice: true, stock: true, trackStock: true,
        isPublished: true, isFeatured: true, isNew: true, isBestSeller: true,
        needsReview: true,
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        collection: { select: { name: true, accent: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.collection.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const products: AdminProductRow[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    trackStock: p.trackStock,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    needsReview: p.needsReview,
    image: p.images[0]?.url ?? null,
    collection: { name: p.collection.name, accent: p.collection.accent as AccentToken },
    category: p.category?.name ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <>
      <AdminTopbar
        title="Products"
        description={`${total} ${total === 1 ? "product" : "products"} in the catalogue`}
        crumbs={[{ label: "Products" }]}
        menuSlot={<AdminMenuButton />}
        actions={
          <Button asChild variant="accent" size="sm">
            <Link href="/admin/products/new">
              <Plus />
              <span className="hidden sm:inline">Add product</span>
            </Link>
          </Button>
        }
      />

      <div className="p-5 sm:p-8">
        <ProductsTable products={products} collections={collections} />
        <Pagination page={page} totalPages={totalPages} className="mt-8" />
      </div>
    </>
  );
}
