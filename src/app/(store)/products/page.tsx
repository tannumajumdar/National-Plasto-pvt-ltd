import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/products/pagination";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { SortSelect } from "@/components/products/sort-select";
import { parseProductFilters, type SearchParamsInput } from "@/lib/filters";
import { getCategories, getCollections } from "@/lib/queries/catalogue";
import { getPriceBounds, getProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse the complete National Plasto catalogue — plastic furniture and household products across the NEXT, NATIONAL and NATIONAL SAPPHIRE collections.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const sp = await searchParams;
  const filters = parseProductFilters(sp);

  const [result, collections, categories, priceBounds] = await Promise.all([
    getProducts(filters),
    getCollections(),
    getCategories(),
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
        description="Every product National Plasto makes, across all three collections. Filter by collection, category, price and availability."
        crumbs={[{ label: "Products" }]}
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
