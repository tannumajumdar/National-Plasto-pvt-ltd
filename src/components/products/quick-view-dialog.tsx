"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductVisual } from "@/components/products/product-visual";
import { RatingStars } from "@/components/products/rating-stars";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";

export function QuickViewDialog({
  product,
  open,
  onOpenChange,
}: {
  product: ProductCardDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toggleWishlist = useWishlist((s) => s.toggle);
  const wishlisted = useWishlist((s) => (product ? s.ids.includes(product.id) : false));

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 sm:p-0">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>

        <div className="grid gap-0 sm:grid-cols-2">
          <div className="relative aspect-square bg-muted sm:rounded-l-2xl">
            <ProductVisual
              name={product.name}
              accent={product.collection.accent}
              src={product.images[0]?.url ?? null}
              alt={product.images[0]?.alt}
              sizes="(min-width: 640px) 24rem, 100vw"
              rounded="rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
            />
            <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
              <Badge variant={product.collection.accent as "next" | "national" | "sapphire"}>
                {product.collection.name}
              </Badge>
              {product.isNew && <Badge variant="accent">New</Badge>}
            </div>
          </div>

          <div className="flex flex-col p-6">
            <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <RatingStars value={product.ratingAvg} count={product.reviewCount} size="sm" />
              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
            </div>

            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {product.shortDescription ??
                `${product.name} is part of the ${product.collection.name} collection from National Plasto. Contact us for specifications and volume quotes.`}
            </p>

            <div className="mt-auto space-y-3 pt-6">
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  className="flex-1 bg-[#c8102e] hover:bg-[#a80b24] text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md py-3"
                >
                  <Link href={`/contact?product=${encodeURIComponent(product.name)}`} className="flex items-center justify-center gap-1.5">
                    <span>GET A QUOTE</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shrink-0"
                  aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  aria-pressed={wishlisted}
                  onClick={() => {
                    const nowSaved = toggleWishlist(product.id);
                    toast[nowSaved ? "success" : "message"](
                      nowSaved ? "Saved to wishlist" : "Removed from wishlist",
                      { description: product.name },
                    );
                  }}
                >
                  <Heart className={cn("size-4", wishlisted && "fill-rose-500 text-rose-500")} />
                </Button>
              </div>

              <Button asChild variant="ghost" className="w-full">
                <Link href={`/products/${product.slug}`} onClick={() => onOpenChange(false)}>
                  View full details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
