import type { Metadata } from "next";

import { AboutTeaser } from "@/components/home/about-teaser";
import { CollectionsShowcase } from "@/components/home/collections-showcase";
import { CtaBand } from "@/components/home/cta-band";
import { FeatureBar } from "@/components/home/feature-bar";
import { Hero } from "@/components/home/hero";
import { IndustriesServe } from "@/components/home/industries-serve";
import { PremiumHighlights } from "@/components/home/premium-highlights";
import { ProductMarquee } from "@/components/home/product-marquee";
import { StatsBand } from "@/components/home/stats-band";
import { DistributorSection } from "@/components/DistributorSection";
import { SITE, themeForAccent } from "@/lib/constants";
import { getCategoryShowcase } from "@/lib/queries/catalogue";
import { getBrandRails, getHighlightProducts } from "@/lib/queries/products";

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
  const [highlights, categories, rails] = await Promise.all([
    getHighlightProducts(10),
    getCategoryShowcase(),
    getBrandRails(14),
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

      {/* One self-scrolling shelf per brand, alternating direction so the
          stack reads as movement rather than one long conveyor. Every brand
          in the catalogue gets one, so the whole range is on the homepage. */}
      {rails.map((rail, i) => (
        <ProductMarquee
          key={rail.slug}
          eyebrow={rail.name}
          title={`The ${rail.name} range`}
          description={`${rail.productCount} products — moulded, finished and packed in Kolkata.`}
          products={rail.products}
          viewAllHref={`/products?collection=${rail.slug}`}
          reverse={i % 2 === 1}
          titleClassName={themeForAccent(rail.accent).text}
          className={i % 2 === 1 ? "bg-slate-50 dark:bg-slate-900/60" : undefined}
        />
      ))}

      {/* Industries We Serve Section */}
      <IndustriesServe />

      {/* Partner with National Plasto / Become a Distributor Section */}
      <DistributorSection />

      {/* Call to Action Section */}
      <CtaBand />
    </>
  );
}
