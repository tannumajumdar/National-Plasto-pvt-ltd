"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Factory, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EASE, Reveal } from "@/components/animations/motion-primitives";
import type { AboutContent } from "@/types";

export function AboutTeaser({ content }: { content: AboutContent }) {
  const pillars = [
    { icon: Factory, label: "Manufacturing", body: content.quality },
    { icon: Compass, label: "Our vision", body: content.vision },
    { icon: Target, label: "Our mission", body: content.mission },
  ];

  return (
    <section className="container-page py-20 sm:py-28">
      <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            About National Plasto
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {content.heading}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{content.intro}</p>

          <Button asChild variant="outline" size="lg" className="group mt-8">
            <Link href="/about">
              Read our story
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>

        <div className="space-y-4">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className="group flex gap-5 rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-accent/18 to-accent/5 text-accent transition-transform duration-300 group-hover:scale-110">
                <pillar.icon className="size-6" />
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {pillar.label}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-foreground/85">
                  {pillar.body}
                </span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
