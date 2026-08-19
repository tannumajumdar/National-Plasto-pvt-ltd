"use client";

import { motion } from "framer-motion";

import { EASE, Reveal } from "@/components/animations/motion-primitives";
import type { JourneyContent } from "@/types";

/**
 * Company timeline.
 *
 * Milestone years are admin-editable and start empty — no founding dates or
 * launch years were supplied, and inventing them would misrepresent the
 * company's history. A milestone with no year still renders, marked pending.
 */
export function JourneyTimeline({ content }: { content: JourneyContent }) {
  if (content.milestones.length === 0) return null;

  return (
    <section className="container-page py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Company journey
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {content.heading}
        </h2>
        {content.subheading && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {content.subheading}
          </p>
        )}
      </Reveal>

      <ol className="relative mx-auto mt-16 max-w-2xl">
        {/* Spine runs through the centre of every node */}
        <span
          aria-hidden
          className="absolute left-4 top-2 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-gradient-to-b from-accent via-border to-transparent"
        />

        {content.milestones.map((milestone, i) => (
          <motion.li
            key={`${milestone.title}-${i}`}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
            className="relative mb-8 pl-14 last:mb-0"
          >
            {/* Node, centred on the spine */}
            <span
              aria-hidden
              className="absolute left-4 top-5 grid size-8 -translate-x-1/2 place-items-center rounded-full border-2 border-accent bg-background"
            >
              <span className="size-2.5 rounded-full bg-accent" />
            </span>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow duration-300 hover:shadow-lift">
              {milestone.year ? (
                <span className="text-sm font-bold text-accent">{milestone.year}</span>
              ) : (
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Year to be added
                </span>
              )}
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{milestone.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {milestone.body}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
