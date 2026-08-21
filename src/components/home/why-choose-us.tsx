"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { EASE, Reveal } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { WhyChooseUsContent } from "@/types";

/**
 * Numbered editorial rows rather than a grid of icon cards.
 *
 * Each row is a large index, a title and a body. Hovering (or focusing) a row
 * lifts its number into the brand gradient, slides the icon in and reveals the
 * body — so the section rewards exploration instead of dumping four paragraphs
 * at once. On touch, where there is no hover, every row renders in its open
 * state; that is what `md:` gating on the collapsed styles achieves.
 */
export function WhyChooseUs({ content }: { content: WhyChooseUsContent }) {
  const [active, setActive] = React.useState<number | null>(0);

  return (
    <section className="section-soft relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="rule-fade absolute inset-x-0 top-0" />

      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* ---------------- heading rail ---------------- */}
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow">
              <span aria-hidden className="h-px w-6 bg-accent" />
              Why choose us
            </span>
            <h2 className="display-2 mt-5 text-foreground">{content.heading}</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              {content.subheading}
            </p>
          </Reveal>

          {/* ---------------- numbered rows ---------------- */}
          <ul className="relative">
            {content.items.map((item, i) => {
              const open = active === i;
              return (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group relative border-t border-border last:border-b"
                >
                  <div className="flex items-start gap-5 py-7 sm:gap-8 sm:py-8">
                    {/* Index */}
                    <span
                      aria-hidden
                      className={cn(
                        "shrink-0 font-display text-3xl font-extrabold tabular-nums transition-all duration-500 sm:text-4xl",
                        open
                          ? "text-gradient-brand scale-105"
                          : "text-muted-foreground/35",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={cn(
                          "flex items-center gap-3 text-lg font-bold tracking-[-0.02em] transition-colors duration-300 sm:text-xl",
                          open ? "text-accent" : "text-foreground",
                        )}
                      >
                        {item.title}
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-full transition-all duration-500",
                            open
                              ? "translate-x-0 bg-accent/12 text-accent opacity-100"
                              : "-translate-x-2 text-muted-foreground opacity-0 md:opacity-0",
                          )}
                        >
                          <DynamicIcon name={item.icon} className="size-4" />
                        </span>
                      </h3>

                      {/* Collapsed only where hover exists; always open on touch. */}
                      <p
                        className={cn(
                          "text-sm leading-relaxed text-muted-foreground transition-all duration-500",
                          "mt-3 max-h-40 opacity-100",
                          "md:mt-0 md:max-h-0 md:overflow-hidden md:opacity-0",
                          open && "md:mt-3 md:max-h-40 md:opacity-100",
                        )}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>

                  {/* Progress rule that fills across the active row. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-px origin-left bg-linear-to-r from-accent to-cyan transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      open ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
