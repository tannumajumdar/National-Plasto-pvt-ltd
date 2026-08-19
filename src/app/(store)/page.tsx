import type { Metadata } from "next";

import { AboutTeaser } from "@/components/home/about-teaser";
import { CollectionsShowcase } from "@/components/home/collections-showcase";
import { CtaBand } from "@/components/home/cta-band";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { StatsBand } from "@/components/home/stats-band";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { SITE } from "@/lib/constants";
import { getCollections } from "@/lib/queries/catalogue";
import {
  getAbout,
  getContact,
  getHero,
  getStats,
  getWhyChooseUs,
} from "@/lib/queries/content";
import {
  getBestSellers,
  getFeaturedProducts,
  getNewArrivals,
  getShowcaseProducts,
} from "@/lib/queries/products";
import prisma from "@/lib/db/prisma";
import type { ProductCardDTO } from "@/types";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

// Content and catalogue change rarely; revalidate hourly.
export const revalidate = 3600;

export default async function HomePage() {
  const [
    hero,
    about,
    why,
    contact,
    stats,
    collections,
    featured,
    newArrivals,
    bestSellers,
    showcase,
    productCount,
  ] = await Promise.all([
    getHero(),
    getAbout(),
    getWhyChooseUs(),
    getContact(),
    getStats(),
    getCollections(),
    getFeaturedProducts(10),
    getNewArrivals(10),
    getBestSellers(10),
    getShowcaseProducts(12),
    prisma.product.count({ where: { isPublished: true } }),
  ]);

  // On a freshly seeded catalogue nothing is flagged yet. Rather than render
  // empty rails, fall back to a stable sample of the catalogue.
  const featuredRail = featured.length > 0 ? featured : showcase.slice(0, 10);
  const heroCards = (featured.length > 0 ? featured : showcase).slice(0, 3);

  // One representative product per collection for the showcase artwork.
  const previews: Record<string, ProductCardDTO | undefined> = {};
  for (const c of collections) {
    previews[c.slug] = showcase.find((p) => p.collection.slug === c.slug);
  }

  return (
    <>
      <Hero content={hero} showcase={heroCards} productCount={productCount} />

      <CollectionsShowcase collections={collections} previews={previews} />

      <ProductRail
        eyebrow="Handpicked"
        title="Featured products"
        description="A selection from across the NEXT, NATIONAL and NATIONAL SAPPHIRE collections."
        products={featuredRail}
        viewAllHref="/products?featured=1"
      />

      <StatsBand stats={stats} />

      {newArrivals.length > 0 && (
        <ProductRail
          eyebrow="Just added"
          title="New arrivals"
          description="The latest additions to the National Plasto catalogue."
          products={newArrivals}
          viewAllHref="/products?isNew=1"
        />
      )}

      <WhyChooseUs content={why} />

      {bestSellers.length > 0 && (
        <ProductRail
          eyebrow="Customer favourites"
          title="Best sellers"
          description="The products our customers come back for."
          products={bestSellers}
          viewAllHref="/products?bestSeller=1"
        />
      )}

      <AboutTeaser content={about} />

      <CtaBand phone={contact.phonePrimary} />
    </>
  );
}
