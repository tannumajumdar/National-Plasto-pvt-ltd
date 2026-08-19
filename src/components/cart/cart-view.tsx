"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductVisual } from "@/components/products/product-visual";
import { EASE } from "@/components/animations/motion-primitives";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";
import type { CartLineDTO, CartTotals } from "@/types";

export function CartView({ signedIn }: { signedIn: boolean }) {
  const ready = useCart((s) => s.ready);
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeLine = useCart((s) => s.remove);
  const addToWishlist = useWishlist((s) => s.add);

  const [resolved, setResolved] = React.useState<CartLineDTO[]>([]);
  const [totals, setTotals] = React.useState<CartTotals | null>(null);
  const [loading, setLoading] = React.useState(true);

  // A signature of the cart contents — refetch only when it actually changes.
  const signature = React.useMemo(
    () =>
      lines
        .map((l) => `${l.productId}:${l.quantity}`)
        .sort()
        .join("|"),
    [lines],
  );

  React.useEffect(() => {
    if (!ready) return;

    if (lines.length === 0) {
      setResolved([]);
      setTotals(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch("/api/cart/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("resolve failed"))))
      .then((data) => {
        setResolved(data.lines ?? []);
        setTotals(data.totals ?? null);

        // Reconcile: the server drops unpublished products and clamps
        // quantities to available stock.
        const serverIds = new Set<string>((data.lines ?? []).map((l: CartLineDTO) => l.productId));
        const dropped = lines.filter((l) => !serverIds.has(l.productId));
        if (dropped.length > 0) {
          dropped.forEach((l) => removeLine(l.productId));
          toast.info(
            dropped.length === 1
              ? "An item is no longer available and was removed."
              : `${dropped.length} items are no longer available and were removed.`,
          );
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          toast.error("Could not load your cart", { description: "Please refresh the page." });
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature]);

  /** Keeps the server copy in step for signed-in users. */
  const persist = React.useCallback(
    (next: { productId: string; quantity: number }[]) => {
      if (!signedIn) return;
      fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: next }),
      }).catch(() => {
        /* best-effort; local state remains the source of truth */
      });
    },
    [signedIn],
  );

  function changeQty(productId: string, quantity: number) {
    setQuantity(productId, quantity);
    persist(
      useCart
        .getState()
        .lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    );
  }

  function remove(line: CartLineDTO) {
    removeLine(line.productId);
    persist(useCart.getState().lines);
    toast.message("Removed from cart", { description: line.name });
  }

  function moveToWishlist(line: CartLineDTO) {
    addToWishlist(line.productId);
    removeLine(line.productId);
    persist(useCart.getState().lines);
    toast.success("Moved to wishlist", { description: line.name });
  }

  if (!ready || (loading && resolved.length === 0 && lines.length > 0)) {
    return <CartSkeleton />;
  }

  if (resolved.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="You haven't added anything yet. Browse the catalogue and add products you'd like to order."
        action={{ label: "Browse products", href: "/products" }}
        secondaryAction={{ label: "View collections", href: "/collections" }}
      />
    );
  }

  const unpriced = resolved.filter((l) => l.unitPrice === null);
  const shortfall = totals ? FREE_SHIPPING_THRESHOLD - totals.subtotal : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] xl:gap-14">
      {/* Lines */}
      <div>
        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {resolved.map((line) => (
              <motion.li
                key={line.productId}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft sm:gap-5 sm:p-5"
              >
                <Link
                  href={`/products/${line.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28"
                >
                  <ProductVisual
                    name={line.name}
                    accent={line.accent}
                    src={line.image}
                    sizes="112px"
                    rounded="rounded-xl"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${line.slug}`}
                        className="line-clamp-1 font-semibold tracking-tight transition-colors hover:text-accent"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {line.collectionName} · {line.sku}
                      </p>
                    </div>

                    <button
                      onClick={() => remove(line)}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${line.name} from cart`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {line.unitPrice === null ? (
                    <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                      Price on request — cannot be checked out
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatINR(line.unitPrice)} each
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex items-center rounded-full border border-border">
                      <button
                        onClick={() => changeQty(line.productId, line.quantity - 1)}
                        className="grid size-9 place-items-center rounded-full transition-colors hover:bg-secondary"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => changeQty(line.productId, line.quantity + 1)}
                        disabled={line.trackStock && line.quantity >= line.stock}
                        className="grid size-9 place-items-center rounded-full transition-colors hover:bg-secondary disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => moveToWishlist(line)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-accent"
                      >
                        <Heart className="size-3.5" />
                        Save for later
                      </button>

                      {line.unitPrice !== null && (
                        <span className="text-base font-bold tabular-nums">
                          {formatINR(line.unitPrice * line.quantity)}
                        </span>
                      )}
                    </div>
                  </div>

                  {line.trackStock && line.quantity >= line.stock && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      Only {line.stock} in stock
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <Button asChild variant="ghost" className="mt-6">
          <Link href="/products">← Continue shopping</Link>
        </Button>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-bold tracking-tight">Order summary</h2>

          {totals && (
            <>
              <dl className="mt-6 space-y-3 text-sm">
                <Row label="Subtotal" value={formatINR(totals.subtotal)} />
                {totals.discount > 0 && (
                  <Row
                    label="Discount"
                    value={`− ${formatINR(totals.discount)}`}
                    valueClass="text-emerald-600 dark:text-emerald-400"
                  />
                )}
                <Row
                  label="Shipping"
                  value={totals.shipping === 0 ? "Free" : formatINR(totals.shipping)}
                  valueClass={totals.shipping === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}
                />
              </dl>

              <Separator className="my-5" />

              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-extrabold tabular-nums">
                  {formatINR(totals.total)}
                </span>
              </div>

              {/* Free-shipping progress */}
              {totals.subtotal > 0 && shortfall > 0 && (
                <div className="mt-5 rounded-xl bg-secondary/60 p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="size-3.5 shrink-0 text-accent" />
                    Add {formatINR(shortfall)} more for free delivery
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      }}
                      transition={{ duration: 0.7, ease: EASE }}
                    />
                  </div>
                </div>
              )}

              {totals.shipping === 0 && totals.subtotal > 0 && (
                <p className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Tag className="size-3.5" />
                  Free delivery applied
                </p>
              )}
            </>
          )}

          {unpriced.length > 0 && (
            <div className="mt-5 flex gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/8 p-4">
              <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {unpriced.length === 1 ? "One item has" : `${unpriced.length} items have`} no
                published price and cannot be ordered online. Remove{" "}
                {unpriced.length === 1 ? "it" : "them"} to check out, or{" "}
                <Link href="/contact" className="font-semibold text-foreground underline">
                  send an enquiry
                </Link>
                .
              </p>
            </div>
          )}

          <Button
            asChild={totals !== null && totals.total > 0 && unpriced.length === 0}
            variant="accent"
            size="lg"
            className="mt-6 w-full"
            disabled={!totals || totals.total === 0 || unpriced.length > 0}
          >
            {totals && totals.total > 0 && unpriced.length === 0 ? (
              <Link href="/checkout">
                Proceed to checkout
                <ArrowRight />
              </Link>
            ) : (
              <span>Proceed to checkout</span>
            )}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Taxes calculated at checkout where applicable.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium tabular-nums", valueClass)}>{value}</dd>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] xl:gap-14">
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-5 rounded-2xl border border-border bg-card p-5">
            <Skeleton className="size-28 shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-5 w-32" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
