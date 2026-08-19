"use client";

import { motion } from "framer-motion";

import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { EASE, Reveal } from "@/components/animations/motion-primitives";
import type { WhyChooseUsContent } from "@/types";

export function WhyChooseUs({ content }: { content: WhyChooseUsContent }) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/4 -z-10 size-[30rem] rounded-full bg-accent/8 blur-[100px]"
      />

      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Why choose us
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {content.heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {content.subheading}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.1, ease: EASE }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-shadow duration-300 hover:shadow-lift"
            >
              {/* Accent wash that reveals on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              />

              <span className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-accent/18 to-accent/5 text-accent transition-transform duration-300 group-hover:scale-110">
                <DynamicIcon name={item.icon} className="size-6" />
              </span>

              <h3 className="relative mt-5 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="relative mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
