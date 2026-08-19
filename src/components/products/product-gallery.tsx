"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ZoomIn } from "lucide-react";

import { ProductVisual } from "@/components/products/product-visual";
import { EASE } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { AccentToken } from "@/lib/placeholder";
import type { ProductImageDTO } from "@/types";

/**
 * Product imagery with thumbnail navigation and hover-to-zoom.
 *
 * Zoom is only offered when a real photograph exists — magnifying a generated
 * placeholder would be meaningless.
 */
export function ProductGallery({
  name,
  accent,
  images,
}: {
  name: string;
  accent: AccentToken;
  images: ProductImageDTO[];
}) {
  const [index, setIndex] = React.useState(0);
  const [zooming, setZooming] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 50, y: 50 });
  const frameRef = React.useRef<HTMLDivElement>(null);

  const active = images[index];
  const hasPhotos = images.length > 0;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 lg:max-h-[34rem] lg:flex-col lg:overflow-y-auto lg:pb-0 no-scrollbar">
          {images.map((image, i) => (
            <button
              key={image.id}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition-all",
                i === index
                  ? "border-accent shadow-soft"
                  : "border-transparent opacity-65 hover:opacity-100",
              )}
            >
              <ProductVisual
                name={name}
                accent={accent}
                src={image.url}
                alt={image.alt}
                sizes="80px"
                rounded="rounded-lg"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main frame */}
      <div
        ref={frameRef}
        className="relative aspect-square flex-1 overflow-hidden rounded-3xl border border-border bg-muted"
        onMouseEnter={() => hasPhotos && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMove}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active?.id ?? "placeholder"}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={
                zooming
                  ? {
                      transform: "scale(1.9)",
                      transformOrigin: `${origin.x}% ${origin.y}%`,
                    }
                  : undefined
              }
            >
              <ProductVisual
                name={name}
                accent={accent}
                src={active?.url ?? null}
                alt={active?.alt ?? name}
                priority
                sizes="(min-width: 1024px) 42vw, 100vw"
                rounded="rounded-none"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {hasPhotos && (
          <span
            className={cn(
              "pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur transition-opacity",
              zooming ? "opacity-0" : "opacity-100",
            )}
          >
            <ZoomIn className="size-3.5" />
            Hover to zoom
          </span>
        )}

        {images.length > 1 && (
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/85 px-3 py-1 text-xs font-medium tabular-nums shadow-soft backdrop-blur">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}
