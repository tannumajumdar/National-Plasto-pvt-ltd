"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { QuickViewDialog } from "@/components/products/quick-view-dialog";
import { EASE } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";

/**
 * A self-scrolling shelf of products.
 *
 * The same duplicated-track trick as MarqueeBand: the row is rendered twice
 * and translated -50%, so the loop is seamless and no JavaScript touches a
 * transform per frame. Hovering pauses it, which is also what makes the cards
 * clickable; touch has no hover, so a swipe pauses it too.
 *
 * `reverse` runs the rail the other way. A page stacking several of these
 * alternates them, so the block reads as movement rather than one long
 * conveyor belt all sliding the same direction.
 */
export function ProductMarquee({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  products,
  viewAllHref,
  reverse = false,
  speed = "fast",
  titleClassName,
  className,
}: {
  eyebrow: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  description?: string;
  products: ProductCardDTO[];
  viewAllHref: string;
  reverse?: boolean;
  speed?: "fast" | "normal" | "slow";
  /** Lets a brand rail paint its heading in the brand's own colour. */
  titleClassName?: string;
  className?: string;
}) {
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
    <section className={cn("overflow-hidden py-10 lg:py-14", className)}>
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-wrap items-end justify-between gap-5"
        >
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c8102e]">
              {eyebrowIcon}
              {eyebrow}
            </span>
            <h2
              className={cn(
                "mt-2 text-2xl font-extrabold tracking-tight text-[#0b2545] dark:text-slate-100 sm:text-3xl",
                titleClassName,
              )}
            >
              {title}
            </h2>
            {description && (
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>

          <Button asChild variant="ghost" size="sm" className="group">
            <Link href={viewAllHref}>
              View all
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Full-bleed: the track runs edge to edge and both ends dissolve. */}
      <div
        className={cn(
          "marquee marquee-cards mask-fade-x mt-7 pb-4",
          speed === "fast" && "marquee-fast",
          speed === "slow" && "marquee-slow",
          reverse && "marquee-reverse",
        )}
        data-paused={paused ? "true" : undefined}
        onScroll={holdStill}
        onPointerDown={holdStill}
        onTouchStart={holdStill}
        role="region"
        aria-label={title}
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
