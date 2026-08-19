"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { QuickViewDialog } from "@/components/products/quick-view-dialog";
import { EASE } from "@/components/animations/motion-primitives";
import type { ProductCardDTO } from "@/types";

/**
 * Horizontally scrollable product rail with snap points.
 * On desktop it behaves like a carousel; on mobile it is a native swipe list.
 */
export function ProductRail({
  eyebrow,
  title,
  description,
  products,
  viewAllHref,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  products: ProductCardDTO[];
  viewAllHref: string;
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [quickView, setQuickView] = React.useState<ProductCardDTO | null>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const updateArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, products.length]);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.85, 720), behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            {description && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => scrollBy(-1)}
                disabled={!canLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => scrollBy(1)}
                disabled={!canRight}
                aria-label="Scroll right"
              >
                <ChevronRight />
              </Button>
            </div>
            <Button asChild variant="ghost" size="sm" className="group">
              <Link href={viewAllHref}>
                View all
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-4 md:px-8 xl:px-10"
      >
        {/* Keeps the first card aligned with the page gutter on wide screens */}
        <div className="hidden shrink-0 xl:block xl:w-[max(0px,calc((100vw-82rem)/2))]" aria-hidden />

        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06, ease: EASE }}
            className="w-[76vw] shrink-0 snap-start sm:w-[46vw] md:w-[34vw] lg:w-[27vw] xl:w-[19.5rem]"
          >
            <ProductCard product={product} onQuickView={setQuickView} />
          </motion.div>
        ))}

        <div className="w-1 shrink-0 xl:w-[max(0px,calc((100vw-82rem)/2))]" aria-hidden />
      </div>

      <QuickViewDialog
        product={quickView}
        open={quickView !== null}
        onOpenChange={(open) => !open && setQuickView(null)}
      />
    </section>
  );
}
