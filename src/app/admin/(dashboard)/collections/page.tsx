import type { Metadata } from "next";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CollectionsManager, type AdminCollection } from "@/components/admin/collections-manager";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Collections",
  robots: { index: false, follow: false },
};

export default async function AdminCollectionsPage() {
  const rows = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const collections: AdminCollection[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    tagline: c.tagline,
    description: c.description,
    bannerImage: c.bannerImage,
    accent: c.accent,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
  }));

  return (
    <>
      <AdminTopbar
        title="Collections"
        description="Manage the NEXT, NATIONAL and NATIONAL SAPPHIRE brand lines"
        crumbs={[{ label: "Collections" }]}
        menuSlot={<AdminMenuButton />}
      />
      <div className="p-5 sm:p-8">
        <CollectionsManager collections={collections} />
      </div>
    </>
  );
}
