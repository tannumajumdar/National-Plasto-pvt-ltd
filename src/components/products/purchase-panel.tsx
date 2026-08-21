"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PriceTag } from "@/components/products/price-tag";
import { useCart } from "@/hooks/use-cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn, formatINR } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import type { ProductDetailDTO } from "@/types";

export function PurchasePanel({ product }: { product: ProductDetailDTO }) {
  const router = useRouter();
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const add = useCart((s) => s.add);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const wishlisted = useWishlist((s) => s.ids.includes(product.id));
  const openCart = useCartDrawer((s) => s.setOpen);

  const outOfStock = product.trackStock && product.stock <= 0;
  const unpriced = product.price === null;
  const maxQty = product.trackStock ? Math.max(1, Math.min(product.stock, 99)) : 99;
  const lowStock = product.trackStock && product.stock > 0 && product.stock <= 5;

  function addToCart(): boolean {
    if (unpriced) {
      toast.info("Price not published yet", {
        description: "Contact our team for pricing and availability.",
      });
      return false;
    }
    if (outOfStock) {
      toast.error("Out of stock", { description: "This product is currently unavailable." });
      return false;
    }
    add(product.id, qty);
    return true;
  }

  function handleAdd() {
    if (!addToCart()) return;
    setAdded(true);
    toast.success("Added to cart", { description: `${qty} × ${product.name}` });
    // Show the consequence of the click straight away.
    openCart(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!addToCart()) return;
    router.push("/checkout");
  }

  return (
    <div className="space-y-6">
      <div>
        <PriceTag price={product.price} discountPrice={product.discountPrice} size="lg" />
        {unpriced && (
          <p className="mt-2 text-sm text-muted-foreground">
            Pricing for this product has not been published yet. Send us an enquiry and our
            team will get back to you.
          </p>
        )}
      </div>

      {/* Stock */}
      <div className="flex items-center gap-2 text-sm">
        <span className={cn("size-2 rounded-full", outOfStock ? "bg-rose-500" : "bg-emerald-500")} />
        <span
          className={
            outOfStock
              ? "font-medium text-rose-600 dark:text-rose-400"
              : "font-medium text-emerald-600 dark:text-emerald-400"
          }
        >
          {outOfStock
            ? "Out of stock"
            : lowStock
              ? `Only ${product.stock} left in stock`
              : product.trackStock
                ? `In stock — ${product.stock} available`
                : "In stock"}
        </span>
      </div>

      <Separator />

      {/* Quantity + actions */}
      {!outOfStock && !unpriced && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center rounded-full border border-border">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-12 text-center font-semibold tabular-nums">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              className="grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          variant="accent"
          className="flex-1 overflow-hidden"
          onClick={handleAdd}
          disabled={outOfStock}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2"
              >
                <Check className="size-5" />
                Added to cart
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2"
              >
                <ShoppingBag className="size-5" />
                {unpriced ? "Send Enquiry" : "Add to Cart"}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {!unpriced && (
          <Button size="lg" className="flex-1" onClick={handleBuyNow} disabled={outOfStock}>
            Buy Now
          </Button>
        )}

        <Button
          size="lg"
          variant="outline"
          className="sm:w-auto"
          aria-pressed={wishlisted}
          onClick={() => {
            const saved = toggleWishlist(product.id);
            toast[saved ? "success" : "message"](
              saved ? "Saved to wishlist" : "Removed from wishlist",
              { description: product.name },
            );
          }}
        >
          <Heart className={cn("size-5", wishlisted && "fill-rose-500 text-rose-500")} />
          <span className="sm:hidden">{wishlisted ? "Saved" : "Save"}</span>
        </Button>
      </div>

      {/* Assurances */}
      <div className="grid gap-3 rounded-2xl border border-border bg-secondary/40 p-5 sm:grid-cols-2">
        <div className="flex gap-3">
          <Truck className="size-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">Free delivery</p>
            <p className="text-xs text-muted-foreground">
              On orders above {formatINR(FREE_SHIPPING_THRESHOLD)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <ShieldCheck className="size-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">Quality checked</p>
            <p className="text-xs text-muted-foreground">Inspected before dispatch</p>
          </div>
        </div>
      </div>
    </div>
  );
}
