import "server-only";

import type { Prisma } from "@prisma/client";
import { cache } from "react";

import prisma from "@/lib/db/prisma";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { safeRead } from "@/lib/db/safe";
import type { AccentToken } from "@/lib/placeholder";
import type {
  Paginated,
  ProductCardDTO,
  ProductDetailDTO,
  ProductFilters,
  ReviewDTO,
} from "@/types";

/* ------------------------------------------------------------------
   Selection shapes
   ------------------------------------------------------------------ */

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  shortDescription: true,
  price: true,
  discountPrice: true,
  stock: true,
  trackStock: true,
  isFeatured: true,
  isNew: true,
  isBestSeller: true,
  isPremium: true,
  isLimitedEdition: true,
  ratingAvg: true,
  reviewCount: true,
  needsReview: true,
  images: {
    select: { id: true, url: true, alt: true },
    orderBy: { sortOrder: "asc" },
    take: 2,
  },
  collection: { select: { name: true, slug: true, accent: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function mapProductCard(p: CardRow): ProductCardDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    shortDescription: p.shortDescription,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    trackStock: p.trackStock,
    images: p.images,
    collection: {
      name: p.collection.name,
      slug: p.collection.slug,
      accent: p.collection.accent as AccentToken,
    },
    category: p.category,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    isPremium: p.isPremium,
    isLimitedEdition: p.isLimitedEdition,
    ratingAvg: p.ratingAvg,
    reviewCount: p.reviewCount,
    needsReview: p.needsReview,
  };
}

/* ------------------------------------------------------------------
   Filtering
   ------------------------------------------------------------------ */

function buildWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isPublished: true };
  const AND: Prisma.ProductWhereInput[] = [];

  if (f.q?.trim()) {
    const q = f.q.trim();
    AND.push({
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { shortDescription: { contains: q } },
        { description: { contains: q } },
        { collection: { name: { contains: q } } },
        { category: { name: { contains: q } } },
      ],
    });
  }

  if (f.collection?.length) AND.push({ collection: { slug: { in: f.collection } } });
  // A category slug may name a top-level group (Chairs) or a sub-category
  // (Deluxe Arm Chairs); selecting the group has to include everything under it.
  if (f.category?.length) {
    AND.push({
      OR: [
        { category: { slug: { in: f.category } } },
        { category: { parent: { slug: { in: f.category } } } },
      ],
    });
  }

  // sortPrice already holds the effective (post-discount) price, so the
  // range filter is a simple comparison. hasPrice keeps unpriced products
  // out of the results rather than treating them as ₹0.
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    AND.push({
      hasPrice: true,
      sortPrice: {
        gte: f.minPrice ?? 0,
        ...(f.maxPrice !== undefined ? { lte: f.maxPrice } : {}),
      },
    });
  }

  if (f.inStock) AND.push({ OR: [{ trackStock: false }, { stock: { gt: 0 } }] });
  if (f.featured) AND.push({ isFeatured: true });
  if (f.isNew) AND.push({ isNew: true });
  if (f.bestSeller) AND.push({ isBestSeller: true });
  if (f.premium) AND.push({ isPremium: true });
  if (f.limitedEdition) AND.push({ isLimitedEdition: true });

  if (AND.length) where.AND = AND;
  return where;
}

function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }, { name: "asc" }];
    case "name-asc":
      return [{ name: "asc" }];
    case "name-desc":
      return [{ name: "desc" }];
    // hasPrice leads both directions so unpriced products always sort last;
    // MySQL has no NULLS LAST, and sortPrice is the effective price.
    case "price-asc":
      return [{ hasPrice: "desc" }, { sortPrice: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ hasPrice: "desc" }, { sortPrice: "desc" }, { name: "asc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { reviewCount: "desc" }, { name: "asc" }];
    case "featured":
    default:
      return [
        { isFeatured: "desc" },
        { isBestSeller: "desc" },
        { isNew: "desc" },
        { name: "asc" },
      ];
  }
}

/* ------------------------------------------------------------------
   Queries
   ------------------------------------------------------------------ */

export async function getProducts(
  filters: ProductFilters = {},
): Promise<Paginated<ProductCardDTO>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = PRODUCTS_PER_PAGE;
  const where = buildWhere(filters);

  return safeRead(async () => {
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: rows.map(mapProductCard),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
  }, { items: [], total: 0, page, pageSize, totalPages: 1 });
}

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetailDTO | null> =>
    safeRead(async () => {
    const p = await prisma.product.findUnique({
      where: { slug },
      select: {
        ...cardSelect,
        images: { select: { id: true, url: true, alt: true }, orderBy: { sortOrder: "asc" } },
        description: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
        isPublished: true,
        features: { select: { id: true, label: true }, orderBy: { sortOrder: "asc" } },
        specifications: {
          select: { id: true, name: true, value: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!p || !p.isPublished) return null;

    return {
      ...mapProductCard(p as CardRow),
      images: p.images,
      description: p.description,
      features: p.features,
      specifications: p.specifications,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      createdAt: p.createdAt.toISOString(),
    };
    }, null),
);

export async function getRelatedProducts(
  productId: string,
  collectionSlug: string,
  take = 8,
): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
  const rows = await prisma.product.findMany({
    where: {
      isPublished: true,
      id: { not: productId },
      collection: { slug: collectionSlug },
    },
    select: cardSelect,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take,
  });
    return rows.map(mapProductCard);
  }, []);
}

/** Homepage rails. One round trip each, run in parallel by the caller. */
export async function getFeaturedProducts(take = 8): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, isFeatured: true },
    select: cardSelect,
    orderBy: [{ updatedAt: "desc" }],
    take,
  });
    return rows.map(mapProductCard);
  }, []);
}

export async function getNewArrivals(take = 8): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, isNew: true },
    select: cardSelect,
    orderBy: [{ createdAt: "desc" }],
    take,
  });
    return rows.map(mapProductCard);
  }, []);
}

export async function getBestSellers(take = 8): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, isBestSeller: true },
    select: cardSelect,
    orderBy: [{ ratingAvg: "desc" }, { name: "asc" }],
    take,
  });
    return rows.map(mapProductCard);
  }, []);
}

export async function getLimitedEditionProducts(take = 12): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
    const rows = await prisma.product.findMany({
      where: { isPublished: true, isLimitedEdition: true },
      select: cardSelect,
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take,
    });
    return rows.map(mapProductCard);
  }, []);
}

export async function getPremiumProducts(take = 12): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
    const rows = await prisma.product.findMany({
      where: { isPublished: true, isPremium: true, isLimitedEdition: false },
      select: cardSelect,
      // Products with real imagery and a price look finished, so they lead.
      orderBy: [
        { isFeatured: "desc" },
        { needsReview: "asc" },
        { collection: { sortOrder: "asc" } },
        { name: "asc" },
      ],
      // Over-fetch: the caller spreads the rail across brands.
      take: take * 6,
    });
    return rows.map(mapProductCard);
  }, []);
}

/**
 * The homepage "Premium & Limited Edition" rail.
 *
 * Limited-edition pieces lead — an admin picked those by hand. Premium fills
 * whatever is left, dealt round-robin by brand so one brand (NATIONAL alone
 * holds 71 premium products) cannot take the whole row.
 */
export async function getHighlightProducts(take = 8): Promise<ProductCardDTO[]> {
  const [limited, premium] = await Promise.all([
    getLimitedEditionProducts(take),
    getPremiumProducts(take),
  ]);

  const picked = limited.slice(0, take);
  const used = new Set(picked.map((p) => p.id));

  const byBrand = new Map<string, ProductCardDTO[]>();
  for (const p of premium) {
    if (used.has(p.id)) continue;
    const bucket = byBrand.get(p.collection.slug);
    if (bucket) bucket.push(p);
    else byBrand.set(p.collection.slug, [p]);
  }

  const queues = [...byBrand.values()];
  let round = 0;
  while (picked.length < take && queues.some((q) => q.length > round)) {
    for (const q of queues) {
      if (picked.length >= take) break;
      const next = q[round];
      if (next) picked.push(next);
    }
    round++;
  }

  return picked;
}

/**
 * Fallback for a freshly seeded catalogue: before an admin has flagged
 * anything as Featured/New/Best Seller, show a stable sample so the
 * homepage never renders an empty rail.
 */
export async function getShowcaseProducts(take = 8): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
  const rows = await prisma.product.findMany({
    where: { isPublished: true },
    select: cardSelect,
    orderBy: [{ collection: { sortOrder: "asc" } }, { name: "asc" }],
    take,
  });
    return rows.map(mapProductCard);
  }, []);
}

export async function searchProducts(q: string, take = 8): Promise<ProductCardDTO[]> {
  return safeRead(async () => {
  const term = q.trim();
  if (term.length < 2) return [];

  const rows = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: term } },
        { sku: { contains: term } },
        { collection: { name: { contains: term } } },
        { category: { name: { contains: term } } },
      ],
    },
    select: cardSelect,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take,
  });
    return rows.map(mapProductCard);
  }, []);
}

export async function getProductReviews(productId: string): Promise<ReviewDTO[]> {
  return safeRead(async () => {
  const rows = await prisma.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    author: { name: r.user.name },
  }));
  }, []);
}

/** Price bounds across priced products, used to configure the range filter. */
export const getPriceBounds = cache(async (): Promise<{ min: number; max: number }> =>
  safeRead(async () => {
  const agg = await prisma.product.aggregate({
    where: { isPublished: true, hasPrice: true },
    _min: { sortPrice: true },
    _max: { sortPrice: true },
  });
  return { min: agg._min.sortPrice ?? 0, max: agg._max.sortPrice ?? 0 };
  }, { min: 0, max: 0 }),
);

export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return safeRead(
    () =>
      prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
        orderBy: { name: "asc" },
      }),
    [],
  );
}

/** Published product count. Returns 0 when the database is unavailable. */
export async function getPublishedProductCount(): Promise<number> {
  return safeRead(() => prisma.product.count({ where: { isPublished: true } }), 0);
}
