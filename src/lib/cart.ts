import "server-only";

import prisma from "@/lib/db/prisma";
import { FLAT_SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import type { AccentToken } from "@/lib/placeholder";
import type { CartLineDTO, CartTotals } from "@/types";

export interface RawCartLine {
  productId: string;
  quantity: number;
}

/**
 * Resolves client-held cart lines against the database.
 *
 * Prices, stock and availability always come from the server — the client
 * store only ever holds product ids and quantities, so a tampered
 * localStorage cannot change what a customer is charged.
 */
export async function resolveCart(
  rawLines: RawCartLine[],
): Promise<{ lines: CartLineDTO[]; totals: CartTotals }> {
  const wanted = rawLines.filter((l) => l.quantity > 0);

  if (wanted.length === 0) {
    return { lines: [], totals: emptyTotals() };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: wanted.map((l) => l.productId) }, isPublished: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      discountPrice: true,
      stock: true,
      trackStock: true,
      collection: { select: { name: true, accent: true } },
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: CartLineDTO[] = [];
  for (const raw of wanted) {
    const p = byId.get(raw.productId);
    // Silently drop products that were unpublished or deleted since the
    // customer added them; the cart page reports the difference.
    if (!p) continue;

    const listPrice = p.price;
    const unitPrice =
      p.discountPrice && p.price && p.discountPrice < p.price ? p.discountPrice : p.price;

    // Never let a line exceed available stock.
    const quantity = p.trackStock
      ? Math.max(0, Math.min(raw.quantity, p.stock))
      : raw.quantity;

    if (quantity === 0) continue;

    lines.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image: p.images[0]?.url ?? null,
      accent: p.collection.accent as AccentToken,
      collectionName: p.collection.name,
      unitPrice,
      listPrice,
      quantity,
      stock: p.stock,
      trackStock: p.trackStock,
    });
  }

  return { lines, totals: computeTotals(lines) };
}

export function computeTotals(lines: CartLineDTO[]): CartTotals {
  let subtotal = 0;
  let listTotal = 0;
  let unpricedCount = 0;

  for (const line of lines) {
    if (line.unitPrice === null) {
      unpricedCount += 1;
      continue;
    }
    subtotal += line.unitPrice * line.quantity;
    listTotal += (line.listPrice ?? line.unitPrice) * line.quantity;
  }

  const discount = Math.max(0, listTotal - subtotal);

  // Shipping is only meaningful once there is something payable in the cart.
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;

  return {
    subtotal,
    discount,
    shipping,
    total: subtotal + shipping,
    unpricedCount,
  };
}

function emptyTotals(): CartTotals {
  return { subtotal: 0, discount: 0, shipping: 0, total: 0, unpricedCount: 0 };
}

/**
 * Merges guest lines into a signed-in user's stored cart, taking the larger
 * quantity per product so nothing a customer added is silently lost.
 */
export async function mergeCartForUser(
  userId: string,
  guestLines: RawCartLine[],
): Promise<RawCartLine[]> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { select: { productId: true, quantity: true } } },
  });

  const merged = new Map<string, number>();
  for (const item of cart.items) merged.set(item.productId, item.quantity);
  for (const line of guestLines) {
    if (line.quantity <= 0) continue;
    merged.set(line.productId, Math.max(merged.get(line.productId) ?? 0, line.quantity));
  }

  // Drop anything that no longer points at a published product.
  const validIds = new Set(
    (
      await prisma.product.findMany({
        where: { id: { in: [...merged.keys()] }, isPublished: true },
        select: { id: true },
      })
    ).map((p) => p.id),
  );

  const finalLines = [...merged.entries()]
    .filter(([productId]) => validIds.has(productId))
    .map(([productId, quantity]) => ({ productId, quantity: Math.min(quantity, 99) }));

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    ...(finalLines.length
      ? [
          prisma.cartItem.createMany({
            data: finalLines.map((l) => ({
              cartId: cart.id,
              productId: l.productId,
              quantity: l.quantity,
            })),
          }),
        ]
      : []),
  ]);

  return finalLines;
}

/** Replaces the stored cart with exactly these lines. */
export async function persistCart(userId: string, lines: RawCartLine[]): Promise<void> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

  const clean = lines.filter((l) => l.quantity > 0);

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    ...(clean.length
      ? [
          prisma.cartItem.createMany({
            data: clean.map((l) => ({
              cartId: cart.id,
              productId: l.productId,
              quantity: Math.min(l.quantity, 99),
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}
