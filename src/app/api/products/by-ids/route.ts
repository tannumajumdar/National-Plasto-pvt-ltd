import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { mapProductCard } from "@/lib/queries/products";
import { ok, parseBody } from "@/lib/api";

const schema = z.object({ ids: z.array(z.string().min(1)).max(200) });

/** Resolves a list of product ids into card data (used by the wishlist). */
export async function POST(request: Request) {
  const { data, error } = await parseBody(request, schema);
  if (error) return error;

  if (data.ids.length === 0) return ok({ products: [] });

  const rows = await prisma.product.findMany({
    where: { id: { in: data.ids }, isPublished: true },
    select: {
      id: true, name: true, slug: true, sku: true, shortDescription: true,
      price: true, discountPrice: true, stock: true, trackStock: true,
      isFeatured: true, isNew: true, isBestSeller: true,
      isPremium: true, isLimitedEdition: true,
      ratingAvg: true, reviewCount: true, needsReview: true,
      images: { select: { id: true, url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
      collection: { select: { name: true, slug: true, accent: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  // Preserve the order the client asked for.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const products = data.ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(mapProductCard);

  return ok({ products });
}
