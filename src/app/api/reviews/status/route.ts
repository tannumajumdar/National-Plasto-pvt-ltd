import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ok } from "@/lib/api";

/**
 * Whether the caller may review a product.
 *
 * Kept as a small per-request endpoint so the product page itself can stay
 * statically cached rather than becoming dynamic just to read a cookie.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const user = await getCurrentUser();
  if (!user || !productId) {
    return ok({ signedIn: Boolean(user), alreadyReviewed: false });
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
    select: { id: true },
  });

  return ok({ signedIn: true, alreadyReviewed: Boolean(existing) });
}
