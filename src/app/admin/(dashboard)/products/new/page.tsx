import type { Metadata } from "next";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ProductForm } from "@/components/admin/product-form";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Add Product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const [collections, categories] = await Promise.all([
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <AdminTopbar
        title="Add product"
        description="Create a new product in the catalogue"
        crumbs={[{ label: "Products", href: "/admin/products" }, { label: "New" }]}
        menuSlot={<AdminMenuButton />}
      />
      <div className="p-5 sm:p-8">
        <ProductForm collections={collections} categories={categories} />
      </div>
    </>
  );
}
