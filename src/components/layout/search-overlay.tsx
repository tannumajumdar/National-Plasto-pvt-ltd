"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/products/price-tag";
import { ProductVisual } from "@/components/products/product-visual";
import { EASE } from "@/components/animations/motion-primitives";
import { useDebounce } from "@/hooks/use-debounce";
import { COLLECTION_LIST } from "@/lib/constants";
import type { ProductCardDTO } from "@/types";

export function SearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<ProductCardDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const debounced = useDebounce(term, 250);

  // Focus the field once the entrance animation has settled.
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open]);

  // Reset when closed so the next open starts clean.
  React.useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setTerm("");
      setResults([]);
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    const query = debounced.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => setResults(data.products ?? []))
      .catch((err) => {
        if (err?.name !== "AbortError") setResults([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debounced]);

  // Escape closes from anywhere in the overlay.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = term.trim();
    if (!query) return;
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex justify-center px-4 pt-[10vh] sm:pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 cursor-default bg-primary/50 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            className="relative z-10 flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-float"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <form onSubmit={submit} className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search by product, collection or SKU…"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                autoComplete="off"
                spellCheck={false}
              />
              {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </form>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {term.trim().length < 2 ? (
                <div className="p-4">
                  <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Browse collections
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {COLLECTION_LIST.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/collections/${c.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="group rounded-2xl border border-border p-4 transition-colors hover:border-accent/40 hover:bg-secondary"
                      >
                        <span className={`text-sm font-bold ${c.text}`}>{c.name}</span>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {c.tagline}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary">
                    <Search className="size-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-semibold">No products found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nothing matched “{term.trim()}”. Try a different name or SKU.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {results.map((p, i) => (
                    <motion.li
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: i * 0.03, ease: EASE }}
                    >
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-4 rounded-2xl p-2.5 transition-colors hover:bg-secondary"
                      >
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                          <ProductVisual
                            name={p.name}
                            accent={p.collection.accent}
                            src={p.images[0]?.url ?? null}
                            sizes="56px"
                            rounded="rounded-xl"
                          />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">{p.name}</span>
                            <Badge variant="muted" className="shrink-0 text-[10px]">
                              {p.collection.name}
                            </Badge>
                          </span>
                          <span className="mt-0.5 block">
                            <PriceTag price={p.price} discountPrice={p.discountPrice} size="sm" />
                          </span>
                        </span>

                        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {term.trim().length >= 2 && results.length > 0 && (
              <button
                onClick={submit}
                className="flex items-center justify-center gap-2 border-t border-border py-3.5 text-sm font-semibold text-accent transition-colors hover:bg-secondary"
              >
                View all results for “{term.trim()}”
                <ArrowRight className="size-4" />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
