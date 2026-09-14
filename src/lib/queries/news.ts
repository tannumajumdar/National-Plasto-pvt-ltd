import "server-only";

import { cache } from "react";

import prisma from "@/lib/db/prisma";
import { safeRead } from "@/lib/db/safe";
import type { NewsPostDTO } from "@/types";

/** Published posts, most recent first. Drafts never leave this file. */
export const getNewsPosts = cache(async (take?: number): Promise<NewsPostDTO[]> =>
  safeRead(async () => {
    const rows = await prisma.newsPost.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      ...(take ? { take } : {}),
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      body: null,
      image: r.image,
      // publishedAt is set the first time an admin publishes; before that the
      // row only has createdAt, so the list still sorts and dates sensibly.
      publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
      metaTitle: null,
      metaDescription: null,
    }));
  }, []),
);

export const getNewsPostBySlug = cache(
  async (slug: string): Promise<NewsPostDTO | null> =>
    safeRead(async () => {
      const r = await prisma.newsPost.findUnique({ where: { slug } });
      if (!r || !r.isPublished) return null;

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        body: r.body,
        image: r.image,
        publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
        metaTitle: r.metaTitle,
        metaDescription: r.metaDescription,
      };
    }, null),
);

export async function getNewsSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return safeRead(
    () =>
      prisma.newsPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    [],
  );
}
