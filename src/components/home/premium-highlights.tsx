"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { QuickViewDialog } from "@/components/products/quick-view-dialog";
import { EASE } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";

/**
 * The homepage shelf for the upper tier of the catalogue: limited-edition
 * pieces an admin has picked by hand, then premium products drawn from the
 * PREMIUM / DELUXE / HEAVY GUARANTEE headings on the brand sheets.
 *
 * It runs as a marquee — the same duplicated-track trick as MarqueeBand, so
 * the loop is seamless and no JavaScript touches a transform per frame.
 * Hovering pauses it, which is also what makes the cards clickable.
 */
export function PremiumHighlights({ products }: { products: ProductCardDTO[] }) {
  const [quickView, setQuickView] = React.useState<ProductCardDTO | null>(null);

  // Hover pausing is CSS, which covers the mouse. Touch has no hover, so a
  // swipe would fight the animation; this holds it still while the reader is
  // scrolling and for a moment after they stop.
  const [paused, setPaused] = React.useState(false);
  const resumeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const holdStill = React.useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 2500);
  }, []);

  React.useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  if (products.length === 0) return null;

  const half = (duplicate: boolean) => (
    <div
      // The second copy exists only to close the loop, so it is hidden from
      // assistive tech and taken out of the tab order.
      className={cn("flex shrink-0 items-stretch gap-5 pr-5", duplicate && "marquee-dup")}
      aria-hidden={duplicate || undefined}
      inert={duplicate || undefined}
    >
      {products.map((product) => (
        <div
          key={`${product.id}${duplicate ? "-dup" : ""}`}
          className="w-[76vw] shrink-0 sm:w-[46vw] md:w-[34vw] lg:w-[27vw] xl:w-[19.5rem]"
        >
          <ProductCard product={product} onQuickView={setQuickView} />
        </div>
      ))}
    </div>
  );

  return (
    <section className="overflow-hidden py-14 lg:py-20">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c8102e]">
              <Crown className="size-4" />
              Premium &amp; Limited Edition
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0b2545] dark:text-slate-100 sm:text-4xl">
              Our Finest Pieces
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              The premium and deluxe lines from across NEXT, NATIONAL, NATIONAL
              SAPPHIRE and CAPTAIN — plus the short-run pieces we make only a
              limited number of.
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="group">
            <Link href="/products?premium=1">
              View all
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Full-bleed: the track runs edge to edge and both ends dissolve. */}
      <div
        className="marquee marquee-fast marquee-cards mask-fade-x mt-9 pb-4"
        data-paused={paused ? "true" : undefined}
        onScroll={holdStill}
        onPointerDown={holdStill}
        onTouchStart={holdStill}
        role="region"
        aria-label="Premium and limited edition products"
      >
        <div className="marquee-track">
          {half(false)}
          {half(true)}
        </div>
      </div>

      <QuickViewDialog
        product={quickView}
        open={quickView !== null}
        onOpenChange={(open) => !open && setQuickView(null)}
      />
    </section>
  );
}
