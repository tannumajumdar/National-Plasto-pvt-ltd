"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/products/product-visual";
import { formatINR } from "@/lib/utils";
import type { HeroContent, ProductCardDTO } from "@/types";

/**
 * Cinematic hero.
 *
 * Deliberately the only ink-dark block above the fold: it sets the brand tone
 * and gives the transparent navbar something to sit on, then the page drops
 * into soft white for the catalogue. Everything animated here moves on
 * `transform` or `opacity` only, so it stays on the compositor.
 */
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

  // Layered parallax: the glow field drifts slowest, the copy fastest, so the
  // scene separates in depth as the page scrolls away.
  const glowY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const copyFade = useTransform(scrollYProgress, [0, 0.72], [1, 0]);
  const artY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  // The last two words carry the gradient, so the headline has a focal point
  // without needing the client to mark anything up.
  const words = content.headline.trim().split(/\s+/);
  const splitAt = Math.max(1, words.length - 2);
  const head = words.slice(0, splitAt).join(" ");
  const tail = words.slice(splitAt).join(" ");

  const hero = showcase[0];
  const side = showcase.slice(1, 3);

  return (
    <section
      ref={ref}
      className="section-ink relative isolate -mt-20 overflow-hidden pb-24 pt-32 sm:pb-28 sm:pt-36 lg:pb-36 lg:pt-40"
    >
      {/* ---------------- background layers ---------------- */}
      <motion.div
        aria-hidden
        style={reduced ? undefined : { y: glowY }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 dot-grid opacity-60 mask-fade-b" />
        <div className="absolute -left-40 -top-32 size-[42rem] rounded-full bg-accent/25 blur-[130px] animate-aurora" />
        <div className="absolute -right-40 top-24 size-[34rem] rounded-full bg-cyan/20 blur-[130px] animate-aurora [animation-delay:-6s]" />
        <div className="absolute -bottom-40 left-1/3 size-[32rem] rounded-full bg-gold/12 blur-[130px] animate-aurora [animation-delay:-11s]" />
      </motion.div>

      {/* A few slow motes. Six, not sixty — enough to feel alive. */}
      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-cyan/50"
              style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
              animate={{ y: [0, -26, 0], opacity: [0.15, 0.65, 0.15] }}
              transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            />
          ))}
        </div>
      )}

      {/* Hairline that reads as the boundary with the navbar above. */}
      <div aria-hidden className="rule-fade-bright absolute inset-x-0 top-20 opacity-40" />

      <div className="container-page">
        <div className="grid items-center gap-16 lg:grid-cols-[1.06fr_1fr] lg:gap-12">
          {/* ---------------- copy ---------------- */}
          <motion.div
            style={reduced ? undefined : { y: copyY, opacity: copyFade }}
            className="relative z-10 text-center lg:text-left"
          >
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-cyan backdrop-blur-md"
            >
              <Sparkles className="size-3.5" />
              {content.eyebrow || "National Plasto"}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="display-1 mt-7 text-white"
            >
              {head}{" "}
              <span className="text-gradient-brand">{tail}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg lg:mx-0"
            >
              {content.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Button asChild variant="accent" size="xl" className="w-full sm:w-auto">
                <Link href={content.primaryCta.href || "/collections"}>
                  {content.primaryCta.label || "Explore Collection"}
                  <ArrowRight className="cta-arrow" />
                </Link>
              </Button>
              <Button asChild variant="onDark" size="xl" className="w-full sm:w-auto">
                <Link href={content.secondaryCta.href || "/products"}>
                  {content.secondaryCta.label || "View Products"}
                </Link>
              </Button>
            </motion.div>

            {/* Facts, not marketing claims: both come from the database. */}
            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.42 }}
              className="mt-12 flex items-center justify-center gap-8 lg:justify-start"
            >
              <div className="text-center lg:text-left">
                <dt className="text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
                  {productCount}+
                </dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-white/45">
                  Products
                </dd>
              </div>
              <div aria-hidden className="h-10 w-px bg-white/12" />
              <div className="text-center lg:text-left">
                <dt className="text-2xl font-extrabold tabular-nums text-white sm:text-3xl">3</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-white/45">
                  Collections
                </dd>
              </div>
              <div aria-hidden className="h-10 w-px bg-white/12" />
              <div className="text-center lg:text-left">
                <dt className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
                  <MapPin className="size-4 text-gold" />
                  Kolkata
                </dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-white/45">
                  West Bengal
                </dd>
              </div>
            </motion.dl>
          </motion.div>

          {/* ---------------- product art ---------------- */}
          <motion.div
            style={reduced ? undefined : { y: artY }}
            className="relative z-10 mx-auto w-full max-w-lg lg:max-w-none"
          >
            {hero ? (
              <div className="relative">
                {/* Glow puddle beneath the floating card. */}
                <div
                  aria-hidden
                  className="absolute inset-x-8 bottom-2 h-24 rounded-[50%] bg-accent/30 blur-3xl"
                />

                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <motion.div
                    animate={reduced ? undefined : { y: [0, -14, 0], scale: [1, 1.015, 1] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="glass-dark relative overflow-hidden rounded-[1.75rem] p-3 shadow-float"
                  >
                    <Link href={`/products/${hero.slug}`} className="block">
                      <span className="relative block aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-white/5">
                        <ProductVisual
                          name={hero.name}
                          accent={hero.collection.accent}
                          src={hero.images[0]?.url ?? null}
                          sizes="(max-width: 1024px) 90vw, 40vw"
                          rounded="rounded-[1.35rem]"
                        />
                      </span>
                      <span className="flex items-center justify-between gap-4 px-3 pb-1 pt-4">
                        <span className="min-w-0">
                          <span className="block text-[0.625rem] font-bold uppercase tracking-[0.16em] text-cyan">
                            {hero.collection.name}
                          </span>
                          <span className="mt-1 block truncate text-base font-semibold text-white">
                            {hero.name}
                          </span>
                        </span>
                        {hero.price !== null && (
                          <span className="shrink-0 text-base font-bold tabular-nums text-white">
                            {formatINR(hero.discountPrice ?? hero.price)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Two smaller cards, offset, drifting on their own clocks. */}
                {side.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 28, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.45 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className={
                      i === 0
                        ? "absolute -left-6 -bottom-10 hidden w-36 sm:block lg:-left-14 lg:w-44"
                        : "absolute -right-4 -top-10 hidden w-32 sm:block lg:-right-10 lg:w-40"
                    }
                  >
                    <motion.div
                      animate={reduced ? undefined : { y: [0, i === 0 ? 12 : -12, 0] }}
                      transition={{
                        duration: 6 + i * 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.8,
                      }}
                      className="glass-dark overflow-hidden rounded-2xl p-2 shadow-lift"
                    >
                      <Link href={`/products/${p.slug}`} className="block">
                        <span className="relative block aspect-square overflow-hidden rounded-xl bg-white/5">
                          <ProductVisual
                            name={p.name}
                            accent={p.collection.accent}
                            src={p.images[0]?.url ?? null}
                            sizes="180px"
                            rounded="rounded-xl"
                          />
                        </span>
                        <span className="block truncate px-1 pb-0.5 pt-2 text-xs font-medium text-white/80">
                          {p.name}
                        </span>
                      </Link>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-[1.75rem] border border-white/10 bg-white/[0.04]" />
            )}
          </motion.div>
        </div>

        {/* ---------------- scroll indicator ---------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-20 hidden justify-center lg:flex"
        >
          <span className="flex flex-col items-center gap-3 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-white/35">
            Scroll
            <span className="relative grid h-10 w-6 place-items-start justify-center rounded-full border border-white/20 pt-1.5">
              <motion.span
                className="size-1.5 rounded-full bg-cyan"
                animate={reduced ? undefined : { y: [0, 14, 0], opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/** Fixed positions — random values would differ between server and client. */
const PARTICLES = [
  { left: "12%", top: "22%", size: 4, duration: 7, delay: 0 },
  { left: "78%", top: "18%", size: 3, duration: 9, delay: 1.2 },
  { left: "34%", top: "72%", size: 5, duration: 8, delay: 0.6 },
  { left: "88%", top: "62%", size: 3, duration: 10, delay: 2.1 },
  { left: "58%", top: "12%", size: 4, duration: 8.5, delay: 1.7 },
  { left: "22%", top: "52%", size: 3, duration: 11, delay: 0.3 },
] as const;
