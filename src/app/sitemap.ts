import type { MetadataRoute } from "next";

import { getAllProductSlugs } from "@/lib/queries/products";
import { getCollections } from "@/lib/queries/catalogue";
import { SITE } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/collections`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const [products, collections] = await Promise.all([
      getAllProductSlugs(),
      getCollections(),
    ]);

    return [
      ...staticRoutes,
      ...collections.map((c) => ({
        url: `${base}/collections/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // A database outage should not break the sitemap entirely.
    return staticRoutes;
  }
}
