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
    <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-texture opacity-[0.07]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-0 size-96 rounded-full bg-accent/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-sapphire/20 blur-[100px]"
      />

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

                <p className="mt-2 text-sm font-medium uppercase tracking-wider text-primary-foreground/65">
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
