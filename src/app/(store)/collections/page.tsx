import type { Metadata } from "next";

import { BrandsShowcase } from "@/components/home/brands-showcase";
import { CollectionsShowcase } from "@/components/home/collections-showcase";
import { PageHeader } from "@/components/layout/page-header";
import { getBrandShowcase, getCategoryShowcase } from "@/lib/queries/catalogue";

export const metadata: Metadata = {
  title: "Our Businesses",
  description:
    "The four National Plasto brands — NEXT, NATIONAL, NATIONAL SAPPHIRE and CAPTAIN — each with its own range and price position, all built to the same manufacturing standard.",
  alternates: { canonical: "/collections" },
};

// Rendered per request, not prerendered at build.
//
// Railway's build container cannot reach the database, and safeRead turns that
// into an empty result rather than a failed build — so every deploy used to
// bake an empty catalogue into this page, and it only came right once ISR
// regenerated it minutes later. Rendering on demand costs one round trip to a
// database that sits on the same private network at runtime, and the page is
// never wrong.
export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const [brands, categories] = await Promise.all([
    getBrandShowcase(),
    getCategoryShowcase(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Our businesses"
        title="Four brands, one factory"
        description="Every National Plasto product belongs to one of four brands. Each has its own design language and price position — and every one is held to the same manufacturing standard."
        crumbs={[{ label: "Our Businesses" }]}
      />

      <BrandsShowcase brands={brands} />

      {/* What the four brands make between them, by type rather than by brand. */}
      <CollectionsShowcase categories={categories} />
    </>
  );
}
