"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Layers } from "lucide-react";

import { EASE } from "@/components/animations/motion-primitives";
import { Button } from "@/components/ui/button";
import { themeForAccent } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BrandCatalogueDTO } from "@/types";

/**
 * The catalogue as the brand sheets present it: brand, then the groups its
 * products fall into, then the headings beneath each group.
 *
 * Every heading links into the filtered grid on the same route, so browsing
 * and filtering are one URL space — `/products?collection=next&category=…`.
 */
export function CatalogueBrowser({ catalogue }: { catalogue: BrandCatalogueDTO[] }) {
  const [active, setActive] = React.useState(catalogue[0]?.brand.slug ?? "");
  const current = catalogue.find((b) => b.brand.slug === active) ?? catalogue[0];

  if (!current) return null;

  const total = catalogue.reduce((n, b) => n + b.brand.productCount, 0);

  return (
    <div>
      {/* Brand switcher — the first thing the sheets show, so the first choice here */}
      <div
        className="flex flex-wrap items-center gap-2 border-b border-border pb-5"
        role="tablist"
        aria-label="Brands"
      >
        {catalogue.map((entry) => {
          const theme = themeForAccent(entry.brand.accent);
          const isActive = entry.brand.slug === current.brand.slug;

          return (
            <button
              key={entry.brand.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(entry.brand.slug)}
              className={cn(
                "relative rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors sm:px-5 sm:text-xs",
                isActive
                  ? "text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="catalogue-brand-pill"
                  className={cn(
                    "absolute inset-0 -z-10 rounded-full bg-gradient-to-r",
                    theme.gradient,
                  )}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {entry.brand.name}
              <span className={cn("ml-2 tabular-nums", isActive ? "text-white/70" : "opacity-60")}>
                {entry.brand.productCount}
              </span>
            </button>
          );
        })}

        <Button asChild variant="ghost" size="sm" className="ml-auto group">
          <Link href="/products?view=all">
            All {total} products
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <BrandSheet key={current.brand.slug} entry={current} />
    </div>
  );
}

function BrandSheet({ entry }: { entry: BrandCatalogueDTO }) {
  const theme = themeForAccent(entry.brand.accent);
  const headingCount = entry.groups.reduce(
    (n, g) => n + Math.max(g.children.length, g.directCount > 0 ? 1 : 0),
    0,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className={cn("text-2xl font-extrabold tracking-tight sm:text-3xl", theme.text)}>
            {entry.brand.name}
          </h2>
          {entry.brand.tagline && (
            <p className="mt-1.5 text-sm text-muted-foreground">{entry.brand.tagline}</p>
          )}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {entry.brand.productCount} products · {headingCount} categories
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {entry.groups.map((group, i) => (
          <motion.section
            key={group.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05, ease: EASE }}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-foreground">
                  {group.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {group.productCount} products
                </p>
              </div>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  theme.bgSoft,
                  theme.text,
                )}
                aria-hidden
              >
                <Layers className="size-4" />
              </span>
            </div>

            <ul className="mt-4 space-y-0.5">
              {/* A group can hold products directly where a brand sheet gives no
                  finer split — SAPPHIRE simply lists STOOLS. */}
              {group.directCount > 0 && (
                <SubcategoryLink
                  brand={entry.brand.slug}
                  category={group.slug}
                  label={`All ${group.name}`}
                  count={group.directCount}
                />
              )}
              {group.children.map((child) => (
                <SubcategoryLink
                  key={child.slug}
                  brand={entry.brand.slug}
                  category={child.slug}
                  label={child.name}
                  count={child.productCount}
                />
              ))}
            </ul>

            <Link
              href={`/products?collection=${entry.brand.slug}&category=${group.slug}`}
              className={cn(
                "group mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                theme.text,
              )}
            >
              View all {group.name}
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.section>
        ))}
      </div>
    </motion.div>
  );
}

function SubcategoryLink({
  brand,
  category,
  label,
  count,
}: {
  brand: string;
  category: string;
  label: string;
  count: number;
}) {
  return (
    <li>
      <Link
        href={`/products?collection=${brand}&category=${category}`}
        className="group flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-secondary"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
          <span className="truncate text-foreground">{label}</span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
      </Link>
    </li>
  );
}
