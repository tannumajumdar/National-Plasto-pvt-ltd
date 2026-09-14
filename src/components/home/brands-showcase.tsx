import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { themeForAccent } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BrandShowcaseDTO } from "@/types";

/**
 * The four brands, each with a product of its own and the groups it makes.
 *
 * This is what "Our Businesses" means here: NEXT, NATIONAL, NATIONAL SAPPHIRE
 * and CAPTAIN are separate ranges with their own price position, not marketing
 * labels on one catalogue. Every figure comes from the database, so a brand
 * that gains products says so without anyone editing this file.
 *
 * A server component — nothing here is interactive.
 */
export function BrandsShowcase({ brands = [] }: { brands?: BrandShowcaseDTO[] }) {
  if (brands.length === 0) return null;

  return (
    <div className="container-page flex flex-col gap-6 py-10 lg:py-14">
      {brands.map((brand) => {
        const theme = themeForAccent(brand.accent);

        return (
          <article
            key={brand.slug}
            className="grid gap-6 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8 sm:p-6 lg:grid-cols-[minmax(0,18rem)_1fr]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary">
              {brand.image ? (
                <Image
                  src={brand.image}
                  alt={brand.imageAlt ?? brand.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 18rem"
                  className="object-contain p-3"
                />
              ) : (
                <span className="grid h-full place-items-center px-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Photography coming soon
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2
                  className={cn(
                    "text-xl font-extrabold uppercase tracking-tight sm:text-2xl",
                    theme.text,
                  )}
                >
                  {brand.name}
                </h2>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {brand.productCount} products · {brand.categoryCount} categories
                </span>
              </div>

              {brand.tagline && (
                <p className="font-serif text-base italic text-accent sm:text-lg">
                  {brand.tagline}
                </p>
              )}

              {brand.description && (
                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {brand.description}
                </p>
              )}

              {brand.groups.length > 0 && (
                <ul className="flex flex-wrap gap-2 pt-1">
                  {brand.groups.map((group) => (
                    <li
                      key={group}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                        theme.bgSoft,
                        theme.text,
                      )}
                    >
                      {group}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
                <Link
                  href={`/collections/${brand.slug}`}
                  className={cn(
                    "group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em]",
                    theme.text,
                  )}
                >
                  Explore {brand.name}
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href={`/products?collection=${brand.slug}`}
                  className="inline-flex items-center text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  See all {brand.productCount}
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
