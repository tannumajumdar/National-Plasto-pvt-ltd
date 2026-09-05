import "server-only";

import { cache } from "react";

import prisma from "@/lib/db/prisma";
import { safeRead } from "@/lib/db/safe";
import type { AccentToken } from "@/lib/placeholder";
import type {
  BrandCatalogueDTO,
  CatalogueNavBrand,
  CategoryDTO,
  CategoryNodeDTO,
  CollectionDTO,
} from "@/types";

export const getCollections = cache(async (): Promise<CollectionDTO[]> =>
  safeRead(async () => {
    const rows = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    });

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      tagline: c.tagline,
      description: c.description,
      bannerImage: c.bannerImage,
      accent: c.accent as AccentToken,
      isActive: c.isActive,
      productCount: c._count.products,
    }));
  }, []),
);

export const getCollectionBySlug = cache(
  async (slug: string): Promise<CollectionDTO | null> =>
    safeRead(async () => {
      const c = await prisma.collection.findUnique({
        where: { slug },
        include: {
          _count: { select: { products: { where: { isPublished: true } } } },
        },
      });
      if (!c || !c.isActive) return null;

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        description: c.description,
        bannerImage: c.bannerImage,
        accent: c.accent as AccentToken,
        isActive: c.isActive,
        productCount: c._count.products,
      };
    }, null),
);

export const getCategories = cache(async (): Promise<CategoryDTO[]> =>
  safeRead(async () => {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    });

    return rows
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      }))
      // A category with nothing in it is noise in the filter sidebar.
      .filter((c) => c.productCount > 0);
  }, []),
);

/* ------------------------------------------------------------------
   The catalogue tree: Brand -> Category -> Sub-category
   ------------------------------------------------------------------ */

/**
 * Every published product reduced to (brand, category, parent category).
 *
 * One round trip builds the whole tree. The alternative — a `_count` per
 * category per brand — is 4 x 34 counts, and the catalogue is small enough
 * (a few hundred rows of three short strings) that counting in memory is
 * both faster and simpler to keep consistent.
 */
const getCatalogueIndex = cache(async () =>
  safeRead(async () => {
    const rows = await prisma.product.findMany({
      where: { isPublished: true },
      select: {
        collection: { select: { slug: true } },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            sortOrder: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    return rows.filter(
      (r): r is typeof r & { category: NonNullable<typeof r.category> } =>
        r.category !== null,
    );
  }, []),
);

type IndexRow = Awaited<ReturnType<typeof getCatalogueIndex>>[number];

/**
 * Folds product rows into the group -> heading tree.
 *
 * A group can hold products directly — SAPPHIRE and CAPTAIN simply list
 * STOOLS where NATIONAL splits Premium from Economical — so `directCount` is
 * reported separately from what the children hold.
 */
function buildTree(rows: IndexRow[]): CategoryNodeDTO[] {
  const groups = new Map<
    string,
    CategoryNodeDTO & { sortOrder: number; childOrder: Map<string, number> }
  >();

  for (const row of rows) {
    const cat = row.category;
    const top = cat.parent ?? cat;

    let group = groups.get(top.slug);
    if (!group) {
      group = {
        id: top.id,
        name: top.name,
        slug: top.slug,
        description: top.description,
        productCount: 0,
        directCount: 0,
        children: [] as CategoryDTO[],
        sortOrder: top.sortOrder,
        childOrder: new Map<string, number>(),
      };
      groups.set(top.slug, group);
    }
    group.productCount++;

    if (!cat.parent) {
      group.directCount++;
      continue;
    }

    const child = group.children.find((c) => c.slug === cat.slug);
    if (child) {
      child.productCount++;
    } else {
      group.children.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: 1,
      });
      group.childOrder.set(cat.slug, cat.sortOrder);
    }
  }

  return [...groups.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map(({ sortOrder: _sortOrder, childOrder, ...node }) => ({
      ...node,
      children: node.children.sort(
        (a, b) =>
          (childOrder.get(a.slug) ?? 0) - (childOrder.get(b.slug) ?? 0) ||
          a.name.localeCompare(b.name),
      ),
    }));
}

/**
 * The full catalogue, grouped the way the brand sheets are: each brand, the
 * top-level groups its products fall into, and the headings beneath them.
 */
export const getCatalogue = cache(async (): Promise<BrandCatalogueDTO[]> => {
  const [brands, index] = await Promise.all([getCollections(), getCatalogueIndex()]);

  return brands
    .map((brand) => ({
      brand,
      groups: buildTree(index.filter((r) => r.collection.slug === brand.slug)),
    }))
    .filter((b) => b.groups.length > 0);
});

/**
 * The same tree across every brand, for the filter sidebar. Only categories
 * that actually hold published products appear.
 */
export const getCategoryTree = cache(async (): Promise<CategoryNodeDTO[]> =>
  buildTree(await getCatalogueIndex()),
);

/**
 * A compact version of the tree for the header menu: brand, its top-level
 * groups, and counts. Sub-categories are left to the catalogue page — a menu
 * listing all 29 headings would be unreadable.
 */
export const getCatalogueNav = cache(async (): Promise<CatalogueNavBrand[]> => {
  const catalogue = await getCatalogue();

  return catalogue.map((entry) => ({
    name: entry.brand.name,
    slug: entry.brand.slug,
    accent: entry.brand.accent,
    productCount: entry.brand.productCount,
    groups: entry.groups.map((g) => ({
      name: g.name,
      slug: g.slug,
      productCount: g.productCount,
    })),
  }));
});

/** One brand's slice of the catalogue tree. */
export const getBrandCatalogue = cache(
  async (slug: string): Promise<BrandCatalogueDTO | null> => {
    const all = await getCatalogue();
    return all.find((b) => b.brand.slug === slug) ?? null;
  },
);
