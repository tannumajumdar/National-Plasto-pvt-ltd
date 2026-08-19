"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PriceTag } from "@/components/products/price-tag";
import { ProductVisual } from "@/components/products/product-visual";
import { RatingStars } from "@/components/products/rating-stars";
import { useCart } from "@/hooks/use-cart";
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
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const add = useCart((s) => s.add);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const wishlisted = useWishlist((s) => (product ? s.ids.includes(product.id) : false));

  // Reset transient state each time a different product opens.
  React.useEffect(() => {
    if (open) {
      setQty(1);
      setAdded(false);
    }
  }, [open, product?.id]);

  if (!product) return null;

  const outOfStock = product.trackStock && product.stock <= 0;
  const unpriced = product.price === null;
  const maxQty = product.trackStock ? Math.max(1, Math.min(product.stock, 99)) : 99;

  function handleAdd() {
    if (!product) return;
    if (unpriced) {
      toast.info("Price not published yet", {
        description: `Contact us for pricing on ${product.name}.`,
      });
      return;
    }
    add(product.id, qty);
    setAdded(true);
    toast.success("Added to cart", { description: `${qty} × ${product.name}` });
    setTimeout(() => setAdded(false), 1800);
  }

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

            <div className="mt-5">
              <PriceTag price={product.price} discountPrice={product.discountPrice} size="lg" />
            </div>

            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {product.shortDescription ??
                `${product.name} is part of the ${product.collection.name} collection from National Plasto. Full details are being added — contact us for specifications.`}
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-2 rounded-full",
                  outOfStock ? "bg-rose-500" : "bg-emerald-500",
                )}
              />
              <span className={outOfStock ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                {outOfStock
                  ? "Out of stock"
                  : product.trackStock
                    ? `In stock — ${product.stock} available`
                    : "In stock"}
              </span>
            </div>

            <div className="mt-auto space-y-3 pt-6">
              {!unpriced && !outOfStock && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="grid size-9 place-items-center rounded-full transition-colors hover:bg-secondary disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      disabled={qty >= maxQty}
                      className="grid size-9 place-items-center rounded-full transition-colors hover:bg-secondary disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="accent"
                  className="flex-1 overflow-hidden"
                  onClick={handleAdd}
                  disabled={outOfStock}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {added ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="size-4" />
                        Added
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingBag className="size-4" />
                        {unpriced ? "Enquire" : "Add to Cart"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
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
