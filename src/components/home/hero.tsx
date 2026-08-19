"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Layers, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/products/product-visual";
import { EASE } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { HeroContent, ProductCardDTO } from "@/types";

export function Hero({
  content,
  showcase,
  productCount,
}: {
  content: HeroContent;
  showcase: ProductCardDTO[];
  productCount: number;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Layered parallax — background drifts slowest, cards fastest.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "42%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const cardsY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);

  // Split the headline so the closing phrase can carry the brand gradient.
  const words = content.headline.trim().split(" ");
  const head = words.slice(0, Math.max(1, words.length - 2)).join(" ");
  const tail = words.slice(Math.max(1, words.length - 2)).join(" ");

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-background pb-20 pt-12 sm:pb-28 sm:pt-16 lg:pb-36 lg:pt-20"
    >
      {/* ---------- Background ---------- */}
      <motion.div style={reduced ? undefined : { y: bgY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-texture opacity-[0.55] mask-fade-b" />
        <div className="absolute -left-40 -top-40 size-[38rem] rounded-full bg-accent/20 blur-[110px] animate-aurora" />
        <div className="absolute -right-32 top-10 size-[32rem] rounded-full bg-sapphire/18 blur-[110px] animate-aurora [animation-delay:-6s]" />
        <div className="absolute bottom-0 left-1/3 size-[30rem] rounded-full bg-next/14 blur-[110px] animate-aurora [animation-delay:-11s]" />
      </motion.div>

      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* ---------- Copy ---------- */}
          <motion.div
            style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
            className="relative z-10 text-center lg:text-left"
          >
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground shadow-soft backdrop-blur"
            >
              <MapPin className="size-3.5 text-accent" />
              {content.eyebrow}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.65rem]"
            >
              {head}{" "}
              <span className="text-gradient-brand">{tail}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
            >
              {content.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
              className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Button asChild size="lg" variant="accent" className="group">
                <Link href={content.primaryCta.href}>
                  {content.primaryCta.label}
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={content.secondaryCta.href}>
                  <Layers />
                  {content.secondaryCta.label}
                </Link>
              </Button>
            </motion.div>

            {/* Only facts we can stand behind: real catalogue counts. */}
            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.36 }}
              className="mt-12 flex items-center justify-center gap-8 lg:justify-start"
            >
              <div>
                <dt className="text-2xl font-bold tracking-tight sm:text-3xl">{productCount}</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Products
                </dd>
              </div>
              <span className="h-10 w-px bg-border" />
              <div>
                <dt className="text-2xl font-bold tracking-tight sm:text-3xl">3</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Collections
                </dd>
              </div>
              <span className="h-10 w-px bg-border" />
              <div>
                <dt className="text-2xl font-bold tracking-tight sm:text-3xl">Kolkata</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Made in
                </dd>
              </div>
            </motion.dl>
          </motion.div>

          {/* ---------- Floating product collage ---------- */}
          <motion.div
            style={reduced ? undefined : { y: cardsY }}
            className="relative mx-auto h-[380px] w-full max-w-md sm:h-[460px] lg:h-[540px] lg:max-w-none"
          >
            <FloatingCard product={showcase[0]} className="left-0 top-6 w-[56%]" delay={0.15} depth={0} priority />
            <FloatingCard product={showcase[1]} className="right-0 top-0 w-[46%]" delay={0.3} depth={1} />
            <FloatingCard product={showcase[2]} className="bottom-0 left-[16%] w-[52%]" delay={0.45} depth={2} />

            {/* Trust chip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
              className="absolute bottom-[22%] right-[2%] z-20 flex items-center gap-2.5 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-float backdrop-blur-md"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-accent/15">
                <Sparkles className="size-4 text-accent" />
              </span>
              <span className="text-left">
                <span className="block text-xs font-bold leading-tight">Three collections</span>
                <span className="block text-[11px] text-muted-foreground">
                  NEXT · NATIONAL · SAPPHIRE
                </span>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  product,
  className,
  delay,
  depth,
  priority = false,
}: {
  product?: ProductCardDTO;
  className?: string;
  delay: number;
  depth: number;
  priority?: boolean;
}) {
  const reduced = useReducedMotion();
  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: depth % 2 === 0 ? -5 : 4 }}
      animate={{ opacity: 1, y: 0, rotate: depth % 2 === 0 ? -3 : 2.5 }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 7 + depth * 1.4, repeat: Infinity, ease: "easeInOut", delay: depth * 0.5 }}
        whileHover={{ scale: 1.04, rotate: 0 }}
        className="overflow-hidden rounded-3xl border border-border bg-card shadow-float"
      >
        <Link href={`/products/${product.slug}`} className="block">
          <span className="relative block aspect-square overflow-hidden bg-muted">
            <ProductVisual
              name={product.name}
              accent={product.collection.accent}
              src={product.images[0]?.url ?? null}
              priority={priority}
              sizes="(min-width: 1024px) 22vw, 45vw"
              rounded="rounded-none"
            />
          </span>
          <span className="block px-4 py-3">
            <span className="block truncate text-sm font-semibold">{product.name}</span>
            <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {product.collection.name}
            </span>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
