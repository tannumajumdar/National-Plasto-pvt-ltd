"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { QuickViewDialog } from "@/components/products/quick-view-dialog";
import { EASE } from "@/components/animations/motion-primitives";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import type { ProductCardDTO } from "@/types";

export function WishlistView() {
  const ready = useWishlist((s) => s.ready);
  const ids = useWishlist((s) => s.ids);
  const clear = useWishlist((s) => s.clear);
  const addToCart = useCart((s) => s.add);

  const [products, setProducts] = React.useState<ProductCardDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [quickView, setQuickView] = React.useState<ProductCardDTO | null>(null);

  const signature = React.useMemo(() => [...ids].sort().join("|"), [ids]);

  React.useEffect(() => {
    if (!ready) return;

    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch("/api/products/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => setProducts(data.products ?? []))
      .catch((err) => {
        if (err?.name !== "AbortError") setProducts([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature]);

  function addAllInStock() {
    const eligible = products.filter(
      (p) => p.price !== null && (!p.trackStock || p.stock > 0),
    );
    if (eligible.length === 0) {
      toast.info("Nothing to add", {
        description: "Saved items are either unpriced or out of stock.",
      });
      return;
    }
    eligible.forEach((p) => addToCart(p.id, 1));
    toast.success(`Added ${eligible.length} ${eligible.length === 1 ? "item" : "items"} to cart`);
  }

  if (!ready || loading) return <ProductGridSkeleton count={4} />;

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        action={{ label: "Browse products", href: "/products" }}
        secondaryAction={{ label: "View collections", href: "/collections" }}
      />
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{products.length}</span>{" "}
          {products.length === 1 ? "item" : "items"} saved
        </p>
        <div className="flex gap-2">
          <Button variant="accent" size="sm" onClick={addAllInStock}>
            <ShoppingBag />
            Add all to cart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clear();
              toast.message("Wishlist cleared");
            }}
          >
            <Trash2 />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35, delay: Math.min(i, 7) * 0.04, ease: EASE }}
            >
              <ProductCard product={product} onQuickView={setQuickView} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <QuickViewDialog
        product={quickView}
        open={quickView !== null}
        onOpenChange={(open) => !open && setQuickView(null)}
      />
    </>
  );
}
