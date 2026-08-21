"use client";

import { motion } from "framer-motion";

import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { AnimatedCounter, EASE } from "@/components/animations/motion-primitives";
import type { StatDTO } from "@/types";

/**
 * Animated counters.
 *
 * Only stats an admin has published (or that resolve live from the catalogue)
 * reach this component — no placeholder figures are invented for display.
 */
export function StatsBand({ stats }: { stats: StatDTO[] }) {
  if (stats.length === 0) return null;

  return (
    <section className="section-ink relative overflow-hidden py-18 sm:py-24">
      <div aria-hidden className="rule-fade-bright absolute inset-x-0 top-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0 dot-grid opacity-40" />

      <div className="container-page relative">
        <div
          className="grid gap-8 sm:gap-10"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 13rem), 1fr))`,
          }}
        >
          {stats.map((stat, i) => {
            const numeric = Number(stat.value.replace(/[^\d.]/g, ""));
            const isNumeric = Number.isFinite(numeric) && stat.value.trim() !== "";

            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
                className="text-center"
              >
                {stat.icon && (
                  <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white/10 text-accent backdrop-blur">
                    <DynamicIcon name={stat.icon} className="size-6" />
                  </span>
                )}

                <p className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {isNumeric ? (
                    <AnimatedCounter value={numeric} suffix={stat.suffix ?? ""} />
                  ) : (
                    <>
                      {stat.value}
                      {stat.suffix}
                    </>
                  )}
                </p>

                <p className="mt-2 text-sm font-medium uppercase tracking-wider text-brand-foreground/65">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
