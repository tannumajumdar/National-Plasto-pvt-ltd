"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/products/product-visual";
import { EASE } from "@/components/animations/motion-primitives";
import { useCart } from "@/hooks/use-cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";
import type { CartLineDTO, CartTotals } from "@/types";

/**
 * Slide-over cart.
 *
 * Prices are never computed here: the drawer posts the line ids to
 * /api/cart/resolve and renders whatever the server says, exactly like the
 * full cart page. That keeps one source of truth for money and means a
 * tampered localStorage cannot change a total.
 *
 * /cart still exists and still works — this is a faster path to the same
 * place, not a replacement.
 */
export function CartDrawer() {
  const open = useCartDrawer((s) => s.open);
  const setOpen = useCartDrawer((s) => s.setOpen);

  const ready = useCart((s) => s.ready);
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeLine = useCart((s) => s.remove);

  const [resolved, setResolved] = React.useState<CartLineDTO[]>([]);
  const [totals, setTotals] = React.useState<CartTotals | null>(null);
  const [loading, setLoading] = React.useState(false);

  const signature = React.useMemo(
    () => lines.map((l) => `${l.productId}:${l.quantity}`).sort().join("|"),
    [lines],
  );

  // Only talk to the server while the drawer is actually open.
  React.useEffect(() => {
    if (!open || !ready) return;
    if (lines.length === 0) {
      setResolved([]);
      setTotals(null);
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
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setResolved([]);
          setTotals(null);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ready, signature]);

  // Escape closes, and the page behind must not scroll.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const remaining = totals ? FREE_SHIPPING_THRESHOLD - totals.subtotal : 0;
  const qualifies = totals !== null && remaining <= 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default bg-primary/45 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-background shadow-float"
          >
            {/* ---------------- header ---------------- */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-base font-bold tracking-tight">
                <ShoppingBag className="size-5 text-accent" />
                Your cart
                {resolved.length > 0 && (
                  <span className="rounded-full bg-accent/12 px-2 py-0.5 text-xs font-bold text-accent">
                    {resolved.reduce((n, l) => n + l.quantity, 0)}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* ---------------- lines ---------------- */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              {!ready || loading ? (
                <ul className="space-y-4 py-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="shimmer size-20 shrink-0 rounded-2xl" />
                      <span className="flex-1 space-y-2 py-1">
                        <span className="shimmer block h-4 w-3/4 rounded" />
                        <span className="shimmer block h-3 w-1/3 rounded" />
                        <span className="shimmer block h-4 w-1/4 rounded" />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : resolved.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <span className="relative">
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-br from-accent/25 to-cyan/20 blur-2xl"
                    />
                    <span className="grid size-16 place-items-center rounded-3xl bg-card ring-1 ring-border/70 shadow-lift">
                      <ShoppingBag className="size-7 text-accent" />
                    </span>
                  </span>
                  <p className="mt-6 text-base font-bold">Your cart is empty</p>
                  <p className="mt-1.5 max-w-[16rem] text-sm text-muted-foreground">
                    Browse the catalogue and add something you like.
                  </p>
                  <Button asChild variant="accent" className="mt-6" onClick={() => setOpen(false)}>
                    <Link href="/products">
                      Browse products
                      <ArrowRight className="cta-arrow" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {resolved.map((line) => (
                      <motion.li
                        key={line.productId}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.28, ease: EASE }}
                        className="flex gap-4 py-4"
                      >
                        <Link
                          href={`/products/${line.slug}`}
                          onClick={() => setOpen(false)}
                          className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-border/70"
                        >
                          <ProductVisual
                            name={line.name}
                            accent={line.accent}
                            src={line.image}
                            sizes="80px"
                            rounded="rounded-2xl"
                          />
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              href={`/products/${line.slug}`}
                              onClick={() => setOpen(false)}
                              className="min-w-0"
                            >
                              <p className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-accent">
                                {line.name}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {line.collectionName}
                              </p>
                            </Link>
                            <button
                              onClick={() => removeLine(line.productId)}
                              aria-label={`Remove ${line.name} from cart`}
                              className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                            <span className="inline-flex items-center rounded-full ring-1 ring-border">
                              <button
                                onClick={() => setQuantity(line.productId, line.quantity - 1)}
                                aria-label={`Decrease quantity of ${line.name}`}
                                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                onClick={() => setQuantity(line.productId, line.quantity + 1)}
                                disabled={line.trackStock && line.quantity >= line.stock}
                                aria-label={`Increase quantity of ${line.name}`}
                                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </span>

                            <span className="text-sm font-bold tabular-nums">
                              {line.unitPrice === null
                                ? "On request"
                                : formatINR(line.unitPrice * line.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* ---------------- footer ---------------- */}
            {resolved.length > 0 && totals && (
              <div className="border-t border-border bg-card/60 px-5 py-5">
                {/* Free-shipping nudge, driven by the server's own threshold. */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className={cn(qualifies ? "text-success" : "text-muted-foreground")}>
                      {qualifies
                        ? "Free shipping unlocked"
                        : `${formatINR(remaining)} away from free shipping`}
                    </span>
                  </div>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-secondary">
                    <motion.span
                      className="block h-full rounded-full bg-linear-to-r from-accent to-cyan"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      }}
                      transition={{ duration: 0.6, ease: EASE }}
                    />
                  </span>
                </div>

                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-semibold tabular-nums">{formatINR(totals.subtotal)}</dd>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="font-semibold tabular-nums text-success">
                        − {formatINR(totals.discount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd className="font-semibold tabular-nums">
                      {totals.shipping === 0 ? "Free" : formatINR(totals.shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2.5 text-base">
                    <dt className="font-bold">Total</dt>
                    <dd className="font-extrabold tabular-nums">{formatINR(totals.total)}</dd>
                  </div>
                </dl>

                <div className="mt-5 grid gap-2">
                  <Button asChild variant="accent" size="lg" onClick={() => setOpen(false)}>
                    <Link href="/checkout">
                      Checkout
                      <ArrowRight className="cta-arrow" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link href="/cart">View full cart</Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
