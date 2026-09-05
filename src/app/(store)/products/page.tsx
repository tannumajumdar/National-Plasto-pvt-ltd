import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { CatalogueBrowser } from "@/components/products/catalogue-browser";
import { Pagination } from "@/components/products/pagination";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { SortSelect } from "@/components/products/sort-select";
import { parseProductFilters, type SearchParamsInput } from "@/lib/filters";
import { getCatalogue, getCategoryTree, getCollections } from "@/lib/queries/catalogue";
import { getPriceBounds, getProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse the complete National Plasto catalogue by brand and category — NEXT, NATIONAL, NATIONAL SAPPHIRE and CAPTAIN.",
  alternates: { canonical: "/products" },
};

/**
 * One route, two views. With no filters in the URL this is the catalogue:
 * brand, then category, then sub-category, the way the brand sheets read.
 * The moment a filter, search or sort is applied — including from the
 * catalogue's own links — it becomes the filtered grid.
 */
const FILTER_KEYS = [
  "q", "collection", "category", "minPrice", "maxPrice", "inStock",
  "featured", "isNew", "bestSeller", "premium", "limitedEdition",
  "sort", "page", "view",
] as const;

function isBrowsing(sp: SearchParamsInput): boolean {
  return !FILTER_KEYS.some((k) => {
    const v = sp[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const sp = await searchParams;

  if (isBrowsing(sp)) {
    const catalogue = await getCatalogue();

    return (
      <>
        <PageHeader
          eyebrow="Catalogue"
          title="Our Products"
          description="Four brands, grouped by category and sub-category. Pick a brand to see everything it makes."
          crumbs={[{ label: "Products" }]}
        />

        <div className="container-page py-10 lg:py-14">
          <CatalogueBrowser catalogue={catalogue} />
        </div>
      </>
    );
  }

  const filters = parseProductFilters(sp);

  const [result, collections, categories, priceBounds] = await Promise.all([
    getProducts(filters),
    getCollections(),
    getCategoryTree(),
    getPriceBounds(),
  ]);

  const { items, total, page, totalPages } = result;
  const from = total === 0 ? 0 : (page - 1) * result.pageSize + 1;
  const to = Math.min(page * result.pageSize, total);

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="All Products"
        description="Every product National Plasto makes, across all four brands. Filter by brand, category, price and availability."
        crumbs={[{ label: "Products", href: "/products" }, { label: "Browse" }]}
      />

      <div className="container-page py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:gap-12">
          <ProductFilters facets={{ collections, categories, priceBounds }} />

          <div className="min-w-0">
            {/* Results toolbar */}
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {total === 0 ? (
                  "No products found"
                ) : (
                  <>
                    Showing <span className="font-semibold text-foreground">{from}–{to}</span> of{" "}
                    <span className="font-semibold text-foreground">{total}</span> products
                  </>
                )}
              </p>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
                <SortSelect />
              </div>
            </div>

            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={items} />
            </Suspense>

            <Pagination page={page} totalPages={totalPages} className="mt-14" />
          </div>
        </div>
      </div>
    </>
  );
}
