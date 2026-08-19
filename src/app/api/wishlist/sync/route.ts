import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { fail, ok, parseBody } from "@/lib/api";

const schema = z.object({ ids: z.array(z.string().min(1)).max(200) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const { data, error } = await parseBody(request, schema);
  if (error) return error;

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
    include: { items: { select: { productId: true } } },
  });

  // Union of stored and guest ids, restricted to products that still exist.
  const union = new Set([...wishlist.items.map((i) => i.productId), ...data.ids]);

  const valid = await prisma.product.findMany({
    where: { id: { in: [...union] }, isPublished: true },
    select: { id: true },
  });
  const validIds = valid.map((p) => p.id);

  await prisma.$transaction([
    prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } }),
    ...(validIds.length
      ? [
          prisma.wishlistItem.createMany({
            data: validIds.map((productId) => ({ wishlistId: wishlist.id, productId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  return ok({ ids: validIds });
}
