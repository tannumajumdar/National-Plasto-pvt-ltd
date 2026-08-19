import type { ProductFilters } from "@/types";
import { SORT_OPTIONS } from "@/lib/constants";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function list(v: string | string[] | undefined): string[] | undefined {
  const raw = one(v);
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

function flag(v: string | string[] | undefined): boolean | undefined {
  const raw = one(v);
  return raw === "1" || raw === "true" ? true : undefined;
}

function int(v: string | string[] | undefined): number | undefined {
  const raw = one(v);
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((o) => o.value));

/**
 * Translates raw URL search params into a validated filter object.
 * Unknown or malformed values are dropped rather than passed to the database.
 */
export function parseProductFilters(sp: SearchParamsInput): ProductFilters {
  const sort = one(sp.sort);

  return {
    q: one(sp.q)?.trim() || undefined,
    collection: list(sp.collection),
    category: list(sp.category),
    minPrice: int(sp.minPrice),
    maxPrice: int(sp.maxPrice),
    inStock: flag(sp.inStock),
    featured: flag(sp.featured),
    isNew: flag(sp.isNew),
    bestSeller: flag(sp.bestSeller),
    sort: sort && VALID_SORTS.has(sort) ? sort : undefined,
    page: Math.max(1, int(sp.page) ?? 1),
  };
}

/** Human-readable summary of what is currently filtered, for the results header. */
export function describeFilters(f: ProductFilters): string[] {
  const parts: string[] = [];
  if (f.q) parts.push(`“${f.q}”`);
  if (f.collection?.length) parts.push(f.collection.join(", ").toUpperCase());
  if (f.inStock) parts.push("In stock");
  if (f.featured) parts.push("Featured");
  if (f.isNew) parts.push("New arrivals");
  if (f.bestSeller) parts.push("Best sellers");
  return parts;
}
