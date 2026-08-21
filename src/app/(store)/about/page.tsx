import type { Metadata } from "next";
import { Building2, Compass, Factory, MapPin, ShieldCheck, Target } from "lucide-react";

import { JourneyTimeline } from "@/components/home/journey-timeline";
import { StatsBand } from "@/components/home/stats-band";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { CtaBand } from "@/components/home/cta-band";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/animations/motion-primitives";
import { SITE } from "@/lib/constants";
import {
  getAbout,
  getContact,
  getJourney,
  getStats,
  getWhyChooseUs,
} from "@/lib/queries/content";
import { getCollections } from "@/lib/queries/catalogue";

export const metadata: Metadata = {
  title: "About Us",
  description: `${SITE.legalName} is a plastic furniture and household products manufacturer based in Kolkata, West Bengal, producing across the NEXT, NATIONAL and NATIONAL SAPPHIRE collections.`,
  alternates: { canonical: "/about" },
};

export const revalidate = 3600;

export default async function AboutPage() {
  const [about, why, journey, stats, contact, collections] = await Promise.all([
    getAbout(),
    getWhyChooseUs(),
    getJourney(),
    getStats(),
    getContact(),
    getCollections(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title={about.heading}
        description={about.intro}
        crumbs={[{ label: "About" }]}
      />

      {/* Vision / Mission / Quality */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Compass, label: "Our vision", body: about.vision },
            { icon: Target, label: "Our mission", body: about.mission },
            { icon: ShieldCheck, label: "Quality", body: about.quality },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 0.1}>
              <article className="group h-full rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-accent/18 to-accent/5 text-accent transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="size-6" />
                </span>
                <h2 className="mt-5 text-lg font-semibold tracking-tight">{item.label}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <StatsBand stats={stats} />

      {/* Manufacturing focus */}
      <section className="container-page py-20 sm:py-24">
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              What we make
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three collections, one manufacturing standard
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Our catalogue is organised into three brand lines. Each targets a different
              need and price position, but all are produced and inspected to the same
              benchmark before dispatch.
            </p>

            <div className="mt-8 space-y-3">
              {collections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4"
                >
                  <div>
                    <p className="font-bold tracking-tight">{c.name}</p>
                    {c.tagline && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{c.tagline}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {c.productCount}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="space-y-4">
              {[
                {
                  icon: Building2,
                  title: SITE.legalName,
                  body: "A private limited company manufacturing plastic furniture and household products.",
                },
                {
                  icon: MapPin,
                  title: `${SITE.city}, ${SITE.state}`,
                  body: "Our base of operations, serving customers across eastern India and beyond.",
                },
                {
                  icon: Factory,
                  title: "Manufacturing focus",
                  body: about.quality,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-5 rounded-2xl border border-border bg-secondary/40 p-6"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-background text-accent shadow-soft">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold tracking-tight">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <JourneyTimeline content={journey} />

      <WhyChooseUs content={why} />

      <CtaBand phone={contact.phonePrimary} />
    </>
  );
}
