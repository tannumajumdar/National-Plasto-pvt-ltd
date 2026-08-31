import type { Metadata } from "next";

import { AboutTeaser } from "@/components/home/about-teaser";
import { CollectionsShowcase } from "@/components/home/collections-showcase";
import { CtaBand } from "@/components/home/cta-band";
import { FeatureBar } from "@/components/home/feature-bar";
import { Hero } from "@/components/home/hero";
import { IndustriesServe } from "@/components/home/industries-serve";
import { StatsBand } from "@/components/home/stats-band";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

export default function HomePage() {
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

      {/* Impact Stats Banner */}
      <StatsBand />

      {/* Industries We Serve Section */}
      <IndustriesServe />

      {/* Call to Action Section */}
      <CtaBand />
    </>
  );
}
