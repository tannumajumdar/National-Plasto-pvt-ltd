import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Package, Sparkles, Star } from "lucide-react";

import { Pagination } from "@/components/products/pagination";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { SortSelect } from "@/components/products/sort-select";
import { Reveal } from "@/components/animations/motion-primitives";
import { SITE } from "@/lib/constants";
import { parseProductFilters, type SearchParamsInput } from "@/lib/filters";
import { getCategoryTree, getCollectionBySlug, getCollections } from "@/lib/queries/catalogue";
import { getPriceBounds, getProducts } from "@/lib/queries/products";
import { cn } from "@/lib/utils";

// Five minutes, not an hour. These pages are prerendered, so their data is a
// snapshot: an admin edit refreshes them at once through revalidatePath, but a
// change made straight against the database — a seed, a bulk import — bypasses
// that, and an hour of stale catalogue is too long to wait on.
export const revalidate = 300;

export async function generateStaticParams() {
  // Prerender each collection when the database is reachable. If it is not
  // (a CI build without a DB, for example), fall back to rendering these
  // routes on demand rather than failing the whole build.
  try {
    const collections = await getCollections();
    return collections.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return { title: "Collection not found", robots: { index: false, follow: false } };
  }

  const description =
    collection.description ??
    `Explore the ${collection.name} collection from ${SITE.name}, Kolkata.`;

  return {
    title: `${collection.name} Collection`,
    description,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.name} Collection | ${SITE.shortName}`,
      description,
    },
  };
}

/** Each collection keeps the shared identity but leads with its own hue. */
const BANNER: Record<string, { gradient: string; ring: string }> = {
  next: { gradient: "from-next-deep via-next to-next/60", ring: "ring-next/30" },
  national: { gradient: "from-national-deep via-national to-accent", ring: "ring-national/30" },
  sapphire: { gradient: "from-sapphire-deep via-sapphire to-sapphire/60", ring: "ring-sapphire/30" },
};

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);

  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  // The collection is fixed by the route; any collection filter in the URL
  // is ignored so a customer cannot end up on a page showing another brand.
  const filters = { ...parseProductFilters(sp), collection: [collection.slug] };

  const [result, categories, priceBounds] = await Promise.all([
    getProducts(filters),
    getCategoryTree(),
    getPriceBounds(),
  ]);

  const theme = BANNER[collection.accent] ?? BANNER.national;
  const { items, total, page, totalPages } = result;

  return (
    <>
      {/* Collection hero banner */}
      <section
        className={cn(
          "relative isolate overflow-hidden bg-linear-to-br py-16 sm:py-24",
          theme.gradient,
        )}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-texture opacity-[0.12]" />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-20 size-[28rem] rounded-full bg-black/15 blur-3xl"
        />

        <div className="container-page relative">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
              Collection
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {collection.name}
            </h1>
            {collection.tagline && (
              <p className="mt-4 max-w-2xl text-lg font-medium text-white/90">
                {collection.tagline}
              </p>
            )}
            {collection.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
                {collection.description}
              </p>
            )}

            <dl className="mt-9 flex flex-wrap gap-3">
              <Stat icon={Package} label="Products" value={String(collection.productCount)} />
              <Stat icon={Sparkles} label="Brand" value={collection.name} />
              <Stat icon={Star} label="Made in" value={SITE.city} />
            </dl>
          </Reveal>
        </div>
      </section>

      <div className="container-page py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:gap-12">
          <ProductFilters
            facets={{ collections: [], categories, priceBounds }}
            hideCollections
          />

          <div className="min-w-0">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{total}</span>{" "}
                {total === 1 ? "product" : "products"} in {collection.name}
              </p>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
                <SortSelect />
              </div>
            </div>

            <ProductGrid
              products={items}
              emptyTitle={`No ${collection.name} products match those filters`}
              emptyDescription="Try clearing a filter to see the full collection."
            />

            <Pagination page={page} totalPages={totalPages} className="mt-14" />
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm">
      <Icon className="size-4 shrink-0 text-white/80" />
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/65">
          {label}
        </dt>
        <dd className="text-sm font-bold text-white">{value}</dd>
      </div>
    </div>
  );
}
