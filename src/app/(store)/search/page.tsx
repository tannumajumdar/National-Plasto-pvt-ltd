import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/products/pagination";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { SortSelect } from "@/components/products/sort-select";
import { parseProductFilters, type SearchParamsInput } from "@/lib/filters";
import { getCategoryTree, getCollections } from "@/lib/queries/catalogue";
import { getPriceBounds, getProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the National Plasto catalogue by product name, collection or SKU.",
  // Search result pages carry no unique content worth indexing.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const sp = await searchParams;
  const filters = parseProductFilters(sp);
  const query = filters.q ?? "";

  if (!query) {
    return (
      <>
        <PageHeader
          eyebrow="Search"
          title="Search products"
          crumbs={[{ label: "Search" }]}
        />
        <EmptyState
          icon={SearchX}
          title="What are you looking for?"
          description="Search the full National Plasto catalogue by product name, collection or SKU."
          action={{ label: "Browse all products", href: "/products" }}
        />
      </>
    );
  }

  const [result, collections, categories, priceBounds] = await Promise.all([
    getProducts(filters),
    getCollections(),
    getCategoryTree(),
    getPriceBounds(),
  ]);

  const { items, total, page, totalPages } = result;

  return (
    <>
      <PageHeader
        eyebrow="Search results"
        title={`Results for “${query}”`}
        description={
          total === 0
            ? "No products matched your search."
            : `Found ${total} ${total === 1 ? "product" : "products"} matching your search.`
        }
        crumbs={[{ label: "Search" }]}
      />

      <div className="container-page py-10 lg:py-14">
        {total === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`Nothing matched “${query}”`}
            description="Check the spelling, try a shorter term, or browse the collections instead."
            action={{ label: "Browse all products", href: "/products" }}
            secondaryAction={{ label: "View collections", href: "/collections" }}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:gap-12">
            <ProductFilters facets={{ collections, categories, priceBounds }} />

            <div className="min-w-0">
              <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{total}</span>{" "}
                  {total === 1 ? "result" : "results"}
                </p>
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
                  <SortSelect />
                </div>
              </div>

              <ProductGrid
                products={items}
                emptyTitle="No results with those filters"
                emptyDescription="Try clearing a filter to widen your search."
              />

              <Pagination page={page} totalPages={totalPages} className="mt-14" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
