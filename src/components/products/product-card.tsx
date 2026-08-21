"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/products/price-tag";
import { ProductVisual } from "@/components/products/product-visual";
import { RatingStars } from "@/components/products/rating-stars";
import { useCart } from "@/hooks/use-cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { EASE } from "@/components/animations/motion-primitives";
import type { ProductCardDTO } from "@/types";

const BADGE_VARIANT: Record<string, "next" | "national" | "sapphire"> = {
  next: "next",
  national: "national",
  sapphire: "sapphire",
};

export function ProductCard({
  product,
  onQuickView,
  priority = false,
  className,
}: {
  product: ProductCardDTO;
  onQuickView?: (product: ProductCardDTO) => void;
  priority?: boolean;
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const openCart = useCartDrawer((s) => s.setOpen);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const wishlisted = useWishlist((s) => s.ids.includes(product.id));

  const outOfStock = product.trackStock && product.stock <= 0;
  const unpriced = product.price === null;
  const primary = product.images[0]?.url ?? null;
  const secondary = product.images[1]?.url ?? null;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (unpriced) {
      toast.info("Price not published yet", {
        description: `Contact us for pricing on ${product.name}.`,
      });
      return;
    }
    if (outOfStock) {
      toast.error("Out of stock", { description: `${product.name} is currently unavailable.` });
      return;
    }

    add(product.id, 1);
    toast.success("Added to cart", { description: product.name });
    openCart(true);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product.id);
    toast[added ? "success" : "message"](
      added ? "Saved to wishlist" : "Removed from wishlist",
      { description: product.name },
    );
  }

  return (
    <motion.article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card",
        "ring-1 ring-border/70 transition-[box-shadow,ring-color] duration-500",
        "shadow-soft hover:shadow-float hover:ring-accent/25",
        className,
      )}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-muted"
        aria-label={product.name}
      >
        {/* Base image zooms gently on hover */}
        <div className="absolute inset-0 transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]">
          <ProductVisual
            name={product.name}
            accent={product.collection.accent}
            src={primary}
            alt={product.images[0]?.alt}
            priority={priority}
            rounded="rounded-none"
          />
        </div>

        {/* Second photograph, when one exists, cross-fades in */}
        {secondary && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <ProductVisual
              name={product.name}
              accent={product.collection.accent}
              src={secondary}
              alt={product.images[1]?.alt}
              rounded="rounded-none"
            />
          </div>
        )}

        {/* Scrim: fades in with the hover actions so their labels stay legible
            over a light product photo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/70 via-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Status flags */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <Badge variant={BADGE_VARIANT[product.collection.accent] ?? "national"}>
            {product.collection.name}
          </Badge>
          {product.isNew && <Badge variant="accent">New</Badge>}
          {product.isBestSeller && <Badge variant="default">Best Seller</Badge>}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-background">
              Out of stock
            </span>
          </div>
        )}

        {/* Hover actions — slide up from the bottom edge */}
        <div
          className={cn(
            "absolute inset-x-3 bottom-3 flex translate-y-3 items-center gap-2 opacity-0 transition-all duration-300",
            "group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100",
          )}
        >
          <Button
            size="sm"
            variant="accent"
            className="flex-1 shadow-lift"
            onClick={handleAdd}
            disabled={outOfStock}
          >
            <ShoppingBag />
            {unpriced ? "Enquire" : "Add to Cart"}
          </Button>

          {onQuickView && (
            <Button
              size="icon-sm"
              variant="glass"
              aria-label={`Quick view ${product.name}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
            >
              <Eye />
            </Button>
          )}
        </div>

        {/* Wishlist — always reachable, animates on toggle */}
        <motion.button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          whileTap={{ scale: 0.82 }}
          className={cn(
            "absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110",
            wishlisted
              ? "bg-rose-500 text-white"
              : "bg-background/75 text-foreground hover:bg-background",
          )}
        >
          <motion.span
            key={String(wishlisted)}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 16 }}
          >
            <Heart className={cn("size-4", wishlisted && "fill-current")} />
          </motion.span>
        </motion.button>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <Link href={`/products/${product.slug}`} className="group/title">
          <h3 className="line-clamp-1 text-[0.9375rem] font-semibold tracking-[-0.015em] transition-colors group-hover/title:text-accent">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/70">{product.sku}</p>
        )}

        <RatingStars value={product.ratingAvg} count={product.reviewCount} size="xs" />

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <PriceTag price={product.price} discountPrice={product.discountPrice} />
        </div>
      </div>
    </motion.article>
  );
}
