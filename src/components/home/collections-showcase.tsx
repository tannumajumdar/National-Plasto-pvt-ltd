"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { ProductVisual } from "@/components/products/product-visual";
import { EASE, Reveal } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { CollectionDTO, ProductCardDTO } from "@/types";

/**
 * Editorial collection cards in an asymmetric grid.
 *
 * The first collection gets a tall feature card and the rest stack beside it,
 * so the section has a clear focal point instead of three equal boxes. Below
 * `lg` it collapses to a single column and every card takes the same shape —
 * asymmetry only reads as deliberate when there is room for it.
 */
const ACCENT_STYLES: Record<string, { grad: string; ring: string; glow: string }> = {
  next: {
    grad: "from-next-deep via-next to-next/60",
    ring: "group-hover:ring-next/40",
    glow: "group-hover:shadow-[0_28px_70px_-18px_hsl(var(--next)/0.5)]",
  },
  national: {
    grad: "from-national-deep via-national to-national/60",
    ring: "group-hover:ring-national/40",
    glow: "group-hover:shadow-[0_28px_70px_-18px_hsl(var(--national)/0.5)]",
  },
  sapphire: {
    grad: "from-sapphire-deep via-sapphire to-sapphire/60",
    ring: "group-hover:ring-sapphire/40",
    glow: "group-hover:shadow-[0_28px_70px_-18px_hsl(var(--sapphire)/0.5)]",
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
  if (collections.length === 0) return null;

  const [feature, ...rest] = collections;

  return (
    <section className="section-soft relative py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <span className="eyebrow">
              <span aria-hidden className="h-px w-6 bg-accent" />
              Our collections
            </span>
            <h2 className="display-2 mt-5">Three ranges, one standard.</h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            NEXT, NATIONAL and NATIONAL SAPPHIRE — each with its own character,
            all built to the same quality.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Feature card spans both rows on large screens. */}
          <CollectionCard
            collection={feature}
            preview={previews[feature.slug]}
            index={0}
            featured
            className="lg:row-span-2"
          />

          {rest.map((collection, i) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              preview={previews[collection.slug]}
              index={i + 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionCard({
  collection,
  preview,
  index,
  featured = false,
  className,
}: {
  collection: CollectionDTO;
  preview: ProductCardDTO | undefined;
  index: number;
  featured?: boolean;
  className?: string;
}) {
  const accent = ACCENT_STYLES[collection.accent] ?? ACCENT_STYLES.national;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.65, delay: index * 0.1, ease: EASE }}
      className={cn("group relative", className)}
    >
      <Link
        href={`/collections/${collection.slug}`}
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border/70",
          "shadow-soft transition-[box-shadow,transform,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:-translate-y-2",
          accent.ring,
          accent.glow,
        )}
      >
        {/* ---------------- artwork ---------------- */}
        <span
          className={cn(
            "relative block overflow-hidden",
            featured ? "aspect-[4/3] lg:aspect-[4/5]" : "aspect-[16/10]",
          )}
        >
          <span
            aria-hidden
            className={cn("absolute inset-0 bg-linear-to-br opacity-90", accent.grad)}
          />
          <span aria-hidden className="absolute inset-0 grid-texture opacity-20" />

          {preview && (
            <span className="absolute inset-0 grid place-items-center p-10">
              <span
                className={cn(
                  "relative block w-full overflow-hidden rounded-2xl shadow-float",
                  "transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]",
                  featured ? "max-w-xs" : "max-w-[13rem]",
                )}
              >
                <span className="relative block aspect-square">
                  <ProductVisual
                    name={preview.name}
                    accent={preview.collection.accent}
                    src={preview.images[0]?.url ?? null}
                    sizes="(max-width: 1024px) 60vw, 30vw"
                    rounded="rounded-2xl"
                  />
                </span>
              </span>
            </span>
          )}

          {/* Scrim deepens on hover so the copy below stays anchored. */}
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-primary/55 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100"
          />

          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
            {collection.productCount} products
          </span>
        </span>

        {/* ---------------- copy ---------------- */}
        <span className="relative flex flex-1 flex-col p-6 sm:p-7">
          {/* Text nudges up as the button fades in. */}
          <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
            <h3
              className={cn(
                "font-display font-extrabold tracking-[-0.03em]",
                featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
              )}
            >
              {collection.name}
            </h3>
            {collection.tagline && (
              <p className="mt-1.5 text-sm font-medium text-accent">{collection.tagline}</p>
            )}
            {collection.description && (
              <p
                className={cn(
                  "mt-3 text-sm leading-relaxed text-muted-foreground",
                  featured ? "line-clamp-3" : "line-clamp-2",
                )}
              >
                {collection.description}
              </p>
            )}
          </span>

          <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="relative">
              Explore collection
              <span
                aria-hidden
                className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100"
              />
            </span>
            <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </span>
      </Link>
    </motion.article>
  );
}
