import type { Metadata } from "next";

import { AboutTeaser } from "@/components/home/about-teaser";
import { CollectionsShowcase } from "@/components/home/collections-showcase";
import { CtaBand } from "@/components/home/cta-band";
import { FeatureBar } from "@/components/home/feature-bar";
import { Hero } from "@/components/home/hero";
import { IndustriesServe } from "@/components/home/industries-serve";
import { PremiumHighlights } from "@/components/home/premium-highlights";
import { StatsBand } from "@/components/home/stats-band";
import { DistributorSection } from "@/components/DistributorSection";
import { SITE } from "@/lib/constants";
import { getCategoryShowcase } from "@/lib/queries/catalogue";
import { getHighlightProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
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

export default async function HomePage() {
  const [highlights, categories] = await Promise.all([
    getHighlightProducts(10),
    getCategoryShowcase(),
  ]);

  return (
    <>
      {/* Hero Banner */}
      <Hero />

      {/* 4 Feature Cards */}
      <FeatureBar />

      {/* About NPPL Section */}
      <AboutTeaser />

      {/* Our Products Section */}
      <CollectionsShowcase categories={categories} />

      {/* Premium & Limited Edition Rail */}
      <PremiumHighlights products={highlights} />

      {/* Impact Stats Banner */}
      <StatsBand />

      {/* Industries We Serve Section */}
      <IndustriesServe />

      {/* Partner with National Plasto / Become a Distributor Section */}
      <DistributorSection />

      {/* Call to Action Section */}
      <CtaBand />
    </>
  );
}
