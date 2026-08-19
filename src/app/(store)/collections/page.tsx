import type { Metadata } from "next";

import { CollectionsShowcase } from "@/components/home/collections-showcase";
import { PageHeader } from "@/components/layout/page-header";
import { getCollections } from "@/lib/queries/catalogue";
import { getShowcaseProducts } from "@/lib/queries/products";
import type { ProductCardDTO } from "@/types";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore the three National Plasto collections — NEXT, NATIONAL and NATIONAL SAPPHIRE — each with its own character, all built to the same quality standard.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 3600;

export default async function CollectionsPage() {
  const [collections, showcase] = await Promise.all([
    getCollections(),
    getShowcaseProducts(60),
  ]);

  const previews: Record<string, ProductCardDTO | undefined> = {};
  for (const c of collections) {
    previews[c.slug] = showcase.find((p) => p.collection.slug === c.slug);
  }

  return (
    <>
      <PageHeader
        eyebrow="Our range"
        title="Collections"
        description="Every National Plasto product belongs to one of three collections. Each has its own design language and price position — and every one is held to the same manufacturing standard."
        crumbs={[{ label: "Collections" }]}
      />

      <CollectionsShowcase collections={collections} previews={previews} />
    </>
  );
}
