"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { ProductVisual } from "@/components/products/product-visual";
import { EASE, Reveal } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { CollectionDTO, ProductCardDTO } from "@/types";

const ACCENT_STYLES: Record<string, { grad: string; text: string; glow: string }> = {
  next: {
    grad: "from-next-deep via-next to-next/70",
    text: "text-next",
    glow: "group-hover:shadow-[0_24px_64px_-16px_hsl(var(--next)/0.45)]",
  },
  national: {
    grad: "from-national-deep via-national to-national/70",
    text: "text-national-deep dark:text-national",
    glow: "group-hover:shadow-[0_24px_64px_-16px_hsl(var(--national)/0.45)]",
  },
  sapphire: {
    grad: "from-sapphire-deep via-sapphire to-sapphire/70",
    text: "text-sapphire",
    glow: "group-hover:shadow-[0_24px_64px_-16px_hsl(var(--sapphire)/0.45)]",
  },
};

export function CollectionsShowcase({
  collections,
  previews,
}: {
  collections: CollectionDTO[];
  /** One representative product per collection slug, for the card artwork. */
  previews: Record<string, ProductCardDTO | undefined>;
}) {
  return (
    <section className="container-page py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Our collections
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]">
          Three ranges, one standard
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Every National Plasto product belongs to one of three collections — each with its
          own character, all built to the same quality benchmark.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {collections.map((collection, i) => {
          const style = ACCENT_STYLES[collection.accent] ?? ACCENT_STYLES.national;
          const preview = previews[collection.slug];

          return (
            <motion.article
              key={collection.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className="group"
            >
              <Link
                href={`/collections/${collection.slug}`}
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-500",
                  "hover:-translate-y-2",
                  style.glow,
                )}
              >
                {/* Artwork */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div className={cn("absolute inset-0 bg-gradient-to-br", style.grad)} />

                  {preview && (
                    <div className="absolute inset-0 scale-90 opacity-90 transition-transform duration-700 group-hover:scale-100">
                      <ProductVisual
                        name={preview.name}
                        accent={collection.accent}
                        src={preview.images[0]?.url ?? null}
                        sizes="(min-width: 1024px) 30vw, 90vw"
                        rounded="rounded-none"
                      />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                  <div className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        {collection.name}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/80">
                        {collection.productCount} products
                      </p>
                    </div>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/95 text-primary transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="size-5" />
                    </span>
                  </div>
                </div>

                {/* Copy */}
                <div className="flex flex-1 flex-col p-6">
                  {collection.tagline && (
                    <p className={cn("text-sm font-semibold", style.text)}>{collection.tagline}</p>
                  )}
                  {collection.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    Explore {collection.name}
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
