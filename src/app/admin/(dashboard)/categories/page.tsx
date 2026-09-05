import type { Metadata } from "next";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CategoriesManager, type AdminCategory } from "@/components/admin/categories-manager";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      parent: { select: { name: true } },
    },
  });

  const categories: AdminCategory[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
    parentId: c.parentId,
    parentName: c.parent?.name ?? null,
  }));

  return (
    <>
      <AdminTopbar
        title="Categories"
        description="Groups and the headings beneath them — Chairs › Deluxe Arm Chairs — shared across every brand"
        crumbs={[{ label: "Categories" }]}
        menuSlot={<AdminMenuButton />}
      />
      <div className="p-5 sm:p-8">
        <CategoriesManager categories={categories} />
      </div>
    </>
  );
}
