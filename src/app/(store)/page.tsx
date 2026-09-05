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
import { getHighlightProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

export default async function HomePage() {
  const highlights = await getHighlightProducts(10);

  return (
    <>
      {/* Hero Banner */}
      <Hero />

      {/* 4 Feature Cards */}
      <FeatureBar />

      {/* About NPPL Section */}
      <AboutTeaser />

      {/* Our Products Section */}
      <CollectionsShowcase />

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
