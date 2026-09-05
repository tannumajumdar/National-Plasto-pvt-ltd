"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn, formatINR } from "@/lib/utils";
import type { CategoryNodeDTO, CollectionDTO } from "@/types";

export interface FilterFacets {
  collections: CollectionDTO[];
  /** Top-level groups with their sub-categories, as the catalogue is organised. */
  categories: CategoryNodeDTO[];
  priceBounds: { min: number; max: number };
}

/**
 * URL is the single source of truth for filter state, so results are
 * shareable, bookmarkable and survive a refresh or a back-navigation.
 */
export function ProductFilters({
  facets,
  className,
  hideCollections = false,
}: {
  facets: FilterFacets;
  className?: string;
  /** Hidden on a collection page, where the collection is already fixed. */
  hideCollections?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeCount = useActiveFilterCount(hideCollections);

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Button variant="outline" onClick={() => setMobileOpen(true)} className="w-full">
          <SlidersHorizontal />
          Filters
          {activeCount > 0 && (
            <Badge variant="accent" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[92%] max-w-sm overflow-y-auto p-0">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            <FilterPanel facets={facets} hideCollections={hideCollections} onApply={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:block", className)}>
        <div className="sticky top-24">
          <FilterPanel facets={facets} hideCollections={hideCollections} />
        </div>
      </aside>
    </>
  );
}

function useActiveFilterCount(hideCollections: boolean) {
  const params = useSearchParams();
  let n = 0;
  if (!hideCollections && params.get("collection")) n += params.get("collection")!.split(",").length;
  if (params.get("category")) n += params.get("category")!.split(",").length;
  if (params.get("minPrice") || params.get("maxPrice")) n += 1;
  if (params.get("inStock")) n += 1;
  if (params.get("featured")) n += 1;
  if (params.get("isNew")) n += 1;
  if (params.get("bestSeller")) n += 1;
  if (params.get("premium")) n += 1;
  if (params.get("limitedEdition")) n += 1;
  return n;
}

function FilterPanel({
  facets,
  hideCollections,
  onApply,
}: {
  facets: FilterFacets;
  hideCollections: boolean;
  onApply?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const { min, max } = facets.priceBounds;
  const hasPricedProducts = max > min;

  const [range, setRange] = React.useState<[number, number]>([
    Number(params.get("minPrice") ?? min),
    Number(params.get("maxPrice") ?? max),
  ]);

  // Keep the slider aligned when the URL changes from elsewhere.
  React.useEffect(() => {
    setRange([Number(params.get("minPrice") ?? min), Number(params.get("maxPrice") ?? max)]);
  }, [params, min, max]);

  const update = React.useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(params.toString());
      mutate(sp);
      sp.delete("page"); // any filter change resets pagination
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const toggleMulti = (key: string, value: string) =>
    update((sp) => {
      const current = new Set(sp.get(key)?.split(",").filter(Boolean) ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      if (current.size) {
        sp.set(key, [...current].join(","));
      } else {
        sp.delete(key);
      }
    });

  const toggleFlag = (key: string) =>
    update((sp) => (sp.get(key) ? sp.delete(key) : sp.set(key, "1")));

  const isChecked = (key: string, value: string) =>
    (params.get(key)?.split(",") ?? []).includes(value);

  const clearAll = () =>
    update((sp) => {
      [
        "collection", "category", "minPrice", "maxPrice", "inStock",
        "featured", "isNew", "bestSeller", "premium", "limitedEdition",
      ].forEach((k) => sp.delete(k));
    });

  const activeCount = useActiveFilterCount(hideCollections);

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider">Filters</h2>
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              <X className="size-3" />
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {!hideCollections && facets.collections.length > 0 && (
        <FilterGroup title="Collection">
          {facets.collections.map((c) => (
            <CheckRow
              key={c.slug}
              id={`col-${c.slug}`}
              checked={isChecked("collection", c.slug)}
              onChange={() => toggleMulti("collection", c.slug)}
              label={c.name}
              count={c.productCount}
            />
          ))}
        </FilterGroup>
      )}

      {facets.categories.length > 0 && (
        <>
          <Separator />
          <FilterGroup title="Category">
            {facets.categories.map((group) => (
              <div key={group.slug} className="space-y-2.5">
                {/* Checking a group includes everything filed beneath it. */}
                <CheckRow
                  id={`cat-${group.slug}`}
                  checked={isChecked("category", group.slug)}
                  onChange={() => toggleMulti("category", group.slug)}
                  label={group.name}
                  count={group.productCount}
                  strong
                />
                {group.children.length > 0 && (
                  <div className="ml-6 space-y-2.5 border-l border-border pl-3">
                    {group.children.map((child) => (
                      <CheckRow
                        key={child.slug}
                        id={`cat-${child.slug}`}
                        checked={isChecked("category", child.slug)}
                        onChange={() => toggleMulti("category", child.slug)}
                        label={child.name}
                        count={child.productCount}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </FilterGroup>
        </>
      )}

      {hasPricedProducts && (
        <>
          <Separator />
          <FilterGroup title="Price">
            <Slider
              value={range}
              min={min}
              max={max}
              step={Math.max(100, Math.round((max - min) / 100))}
              onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
              onValueCommit={(v) =>
                update((sp) => {
                  if (v[0] > min) {
                    sp.set("minPrice", String(v[0]));
                  } else {
                    sp.delete("minPrice");
                  }
                  if (v[1] < max) {
                    sp.set("maxPrice", String(v[1]));
                  } else {
                    sp.delete("maxPrice");
                  }
                })
              }
              className="mt-3"
              aria-label="Price range"
            />
            <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{formatINR(range[0])}</span>
              <span>{formatINR(range[1])}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/75">
              Products without a published price are excluded when a price filter is active.
            </p>
          </FilterGroup>
        </>
      )}

      <Separator />

      <FilterGroup title="Availability">
        <CheckRow
          id="in-stock"
          checked={Boolean(params.get("inStock"))}
          onChange={() => toggleFlag("inStock")}
          label="In stock only"
        />
      </FilterGroup>

      <Separator />

      <FilterGroup title="Highlights">
        <CheckRow
          id="featured"
          checked={Boolean(params.get("featured"))}
          onChange={() => toggleFlag("featured")}
          label="Featured"
        />
        <CheckRow
          id="new"
          checked={Boolean(params.get("isNew"))}
          onChange={() => toggleFlag("isNew")}
          label="New arrivals"
        />
        <CheckRow
          id="best"
          checked={Boolean(params.get("bestSeller"))}
          onChange={() => toggleFlag("bestSeller")}
          label="Best sellers"
        />
        <CheckRow
          id="premium"
          checked={Boolean(params.get("premium"))}
          onChange={() => toggleFlag("premium")}
          label="Premium"
        />
        <CheckRow
          id="limited"
          checked={Boolean(params.get("limitedEdition"))}
          onChange={() => toggleFlag("limitedEdition")}
          label="Limited edition"
        />
      </FilterGroup>

      {onApply && (
        <Button variant="accent" className="w-full" onClick={onApply}>
          Show results
        </Button>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  label,
  count,
  strong = false,
}: {
  id: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
  /** Top-level groups read as headings, so they carry more weight. */
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label
        htmlFor={id}
        className={cn(
          "flex flex-1 cursor-pointer items-center justify-between text-sm",
          strong ? "font-semibold" : "font-normal",
        )}
      >
        <span>{label}</span>
        {count !== undefined && (
          <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
        )}
      </Label>
    </div>
  );
}
