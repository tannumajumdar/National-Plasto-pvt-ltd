import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { reviewSchema } from "@/lib/validations";
import { clientIp, fail, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in to write a review.", 401);

  const limit = rateLimit(`review:${user.id}:${clientIp(request)}`, {
    limit: 5,
    windowMs: 600_000,
  });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, reviewSchema);
  if (error) return error;

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true },
  });
  if (!product) return fail("Product not found.", 404);

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: data.productId, userId: user.id } },
    select: { id: true },
  });
  if (existing) {
    return fail("You have already reviewed this product.", 409);
  }

  // Reviews are held for admin approval before appearing on the storefront,
  // so the cached product rating is deliberately not updated here.
  await prisma.review.create({
    data: {
      productId: data.productId,
      userId: user.id,
      rating: data.rating,
      title: data.title || null,
      body: data.body || null,
      isApproved: false,
    },
  });

  return ok(
    {
      message:
        "Thank you — your review has been submitted and will appear once it is approved.",
    },
    { status: 201 },
  );
}
