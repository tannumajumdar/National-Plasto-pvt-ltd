/**
 * Test fixtures for the end-to-end flow harness.
 *
 * Creates clearly-labelled TEST products with real prices and stock so the
 * cart / checkout / stock paths can be exercised. Seeded catalogue products
 * deliberately have `price: null`, so they cannot be bought.
 *
 * Run:  npx tsx scripts/e2e-fixtures.ts [reset|teardown]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const FIXTURE_SKUS = ["ZZTEST-A", "ZZTEST-B", "ZZTEST-C", "ZZTEST-D"];
const FIXTURE_EMAIL_PREFIX = "e2e-";

async function teardown() {
  await prisma.orderEvent.deleteMany({
    where: { order: { customerEmail: { startsWith: FIXTURE_EMAIL_PREFIX } } },
  });
  await prisma.orderItem.deleteMany({
    where: { order: { customerEmail: { startsWith: FIXTURE_EMAIL_PREFIX } } },
  });
  await prisma.order.deleteMany({
    where: { customerEmail: { startsWith: FIXTURE_EMAIL_PREFIX } },
  });
  // Every SKU any suite creates starts "ZZ" — match the prefix, not just the
  // three known SKUs, or products created by the action/category suites leak
  // into the real catalogue and show up on the storefront.
  const testProduct = { sku: { startsWith: "ZZ" } };

  await prisma.review.deleteMany({ where: { product: testProduct } });
  await prisma.cartItem.deleteMany({ where: { product: testProduct } });
  await prisma.wishlistItem.deleteMany({ where: { product: testProduct } });
  await prisma.orderItem.deleteMany({ where: { product: testProduct } });
  await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "ZZ-" } } });
  await prisma.product.deleteMany({ where: testProduct });
  await prisma.category.deleteMany({ where: { slug: { startsWith: "zz-" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: FIXTURE_EMAIL_PREFIX } } });
}

async function setup() {
  const collection = await prisma.collection.findFirstOrThrow({ where: { slug: "next" } });

  const defs: {
    sku: string;
    name: string;
    price: number | null;
    stock: number;
    trackStock?: boolean;
  }[] = [
    { sku: "ZZTEST-A", name: "ZZ Test Chair A", price: 150000, stock: 10 },
    { sku: "ZZTEST-B", name: "ZZ Test Table B", price: 250000, stock: 3 },
    { sku: "ZZTEST-C", name: "ZZ Test Untracked C", price: 50000, stock: 0, trackStock: false },
    // Deliberately unpriced. The suites need a "Price on request" product, and
    // they must not depend on the real catalogue being unpriced — demo prices
    // (scripts/demo-data.ts) may well have been applied to all 90 of those.
    { sku: "ZZTEST-D", name: "ZZ Test Unpriced D", price: null, stock: 5 },
  ];

  const out: Record<string, string> = {};
  for (const d of defs) {
    const p = await prisma.product.upsert({
      where: { sku: d.sku },
      update: { price: d.price, stock: d.stock, isPublished: true },
      create: {
        name: d.name,
        slug: d.sku.toLowerCase(),
        sku: d.sku,
        collectionId: collection.id,
        price: d.price,
        stock: d.stock,
        trackStock: d.trackStock ?? true,
        isPublished: true,
        needsReview: false,
      },
      select: { id: true, sku: true },
    });
    out[p.sku] = p.id;
  }
  return out;
}

async function main() {
  const mode = process.argv[2] ?? "reset";
  if (mode === "teardown") {
    await teardown();
    console.log(JSON.stringify({ ok: true, mode: "teardown" }));
    return;
  }
  await teardown();
  const ids = await setup();
  console.log(JSON.stringify({ ok: true, mode: "reset", products: ids }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
