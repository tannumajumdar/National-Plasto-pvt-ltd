import "server-only";

import { cache } from "react";

import prisma from "@/lib/db/prisma";
import type { AccentToken } from "@/lib/placeholder";
import type { CategoryDTO, CollectionDTO } from "@/types";

export const getCollections = cache(async (): Promise<CollectionDTO[]> => {
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
});

export const getCollectionBySlug = cache(
  async (slug: string): Promise<CollectionDTO | null> => {
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
  },
);

export const getCategories = cache(async (): Promise<CategoryDTO[]> => {
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
});
