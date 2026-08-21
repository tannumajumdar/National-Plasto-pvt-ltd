/**
 * DEMO DATA — fake prices so the shop can actually be shopped.
 *
 *   npx tsx scripts/demo-data.ts apply    # give every unpriced product a price
 *   npx tsx scripts/demo-data.ts clear    # take them away again
 *   npx tsx scripts/demo-data.ts status   # what is demo, what is real
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  THESE PRICES ARE INVENTED. They exist only so the cart, checkout, order
 *  and admin flows can be demonstrated end to end. They are NOT National
 *  Plasto's prices and must not be shown to a customer or published.
 *  Run `clear` before this site goes anywhere near production.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `clear` is safe: it only resets a product whose current price still equals
 * the value this script would generate for it. The moment an admin types a
 * real price, that product stops matching and `clear` leaves it alone.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Same stable hash the placeholder art uses, so prices never shuffle. */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Plausible-looking bands, in whole rupees, by category. */
const BANDS: Record<string, [number, number]> = {
  chairs: [450, 1900],
  tables: [900, 3600],
  stools: [250, 850],
  "storage-racks": [700, 2900],
  "vanity-bathroom": [1200, 4200],
  kids: [400, 1600],
  uncategorised: [500, 2600],
};

interface DemoPrice {
  /** Paise. */
  price: number;
  /** Paise, or null. */
  discountPrice: number | null;
}

function demoPriceFor(name: string, categorySlug: string | null): DemoPrice {
  const [lo, hi] = BANDS[categorySlug ?? "uncategorised"] ?? BANDS.uncategorised;
  const h = hashString(name);

  // Land on a retail-looking figure: multiples of 10, ending in 9 or 5.
  const span = hi - lo;
  const raw = lo + (h % span);
  const rupees = Math.round(raw / 10) * 10 + (h % 2 === 0 ? 9 : 5);

  // Roughly one product in four carries a markdown, so the discount path,
  // the strike-through price and Order.discount all get exercised.
  const hasDiscount = h % 4 === 0;
  const price = rupees * 100;
  const discountPrice = hasDiscount ? Math.round((rupees * 0.85) / 5) * 5 * 100 : null;

  return {
    price,
    discountPrice: discountPrice !== null && discountPrice < price ? discountPrice : null,
  };
}

function pricingFields(price: number | null, discountPrice: number | null) {
  if (price === null) return { hasPrice: false, sortPrice: 0 };
  const effective =
    discountPrice !== null && discountPrice > 0 && discountPrice < price ? discountPrice : price;
  return { hasPrice: true, sortPrice: effective };
}

async function load() {
  return prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      discountPrice: true,
      description: true,
      category: { select: { slug: true } },
      images: { select: { id: true } },
    },
    orderBy: { sku: "asc" },
  });
}

async function apply() {
  const products = await load();
  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    if (p.price !== null) {
      skipped++;
      continue;
    }
    const demo = demoPriceFor(p.name, p.category?.slug ?? null);
    await prisma.product.update({
      where: { id: p.id },
      data: {
        price: demo.price,
        discountPrice: demo.discountPrice,
        ...pricingFields(demo.price, demo.discountPrice),
        // Mirrors computeNeedsReview: price + description + image.
        needsReview: !p.description?.trim() || p.images.length === 0,
      },
    });
    updated++;
  }

  console.log(`\nDemo prices applied to ${updated} product(s).`);
  if (skipped) console.log(`${skipped} already had a price and were left alone.`);
  console.log("\n  These prices are INVENTED. Run `demo-data.ts clear` before production.\n");
}

async function clear() {
  const products = await load();
  let cleared = 0;
  let kept = 0;

  for (const p of products) {
    if (p.price === null) continue;

    const demo = demoPriceFor(p.name, p.category?.slug ?? null);
    const isDemo = p.price === demo.price && p.discountPrice === demo.discountPrice;

    if (!isDemo) {
      kept++;
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        price: null,
        discountPrice: null,
        ...pricingFields(null, null),
        needsReview: true,
      },
    });
    cleared++;
  }

  console.log(`\nCleared demo prices from ${cleared} product(s).`);
  if (kept) console.log(`${kept} product(s) had prices that were edited by hand — left untouched.`);
  console.log();
}

async function status() {
  const products = await load();
  let demo = 0;
  let real = 0;
  let none = 0;

  for (const p of products) {
    if (p.price === null) {
      none++;
      continue;
    }
    const d = demoPriceFor(p.name, p.category?.slug ?? null);
    if (p.price === d.price && p.discountPrice === d.discountPrice) demo++;
    else real++;
  }

  console.log(`\n  ${products.length} products`);
  console.log(`    demo price   ${demo}`);
  console.log(`    real price   ${real}`);
  console.log(`    no price     ${none}`);
  if (demo > 0) {
    console.log("\n  Demo prices are live. Run `demo-data.ts clear` before production.");
  }
  console.log();
}

const mode = process.argv[2];
const run = mode === "apply" ? apply : mode === "clear" ? clear : mode === "status" ? status : null;

if (!run) {
  console.error("\nUsage: npx tsx scripts/demo-data.ts <apply|clear|status>\n");
  process.exit(1);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
