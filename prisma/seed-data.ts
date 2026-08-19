/**
 * Product names transcribed verbatim from the brand-wise product list.
 *
 * IMPORTANT: the source supplied NAMES ONLY. No prices, dimensions,
 * materials, colours or specifications were provided, so none are invented
 * here. Every product is seeded with `needsReview: true` and null pricing
 * for an admin to complete.
 */

export const NEXT_PRODUCTS = [
  "Atom - 2 ft",
  "Atom - 4 ft",
  "Atom - 6 ft",
  "Avenger",
  "Big Bonny",
  "Bonny",
  "Caliber",
  "Canny",
  "Cherish",
  "Cinematic",
  "Delight",
  "Discover",
  "Easy",
  "Enlarge",
  "Fortune",
  "Genius",
  "Invent",
  "Kidzee Junior",
  "Kinder",
  "Magnetic",
  "Marvel",
  "Matt",
  "Playtime",
  "Primo",
  "Rocker",
  "Rolex",
  "Shoe Rack - 2 ft",
  "Shoe Rack - 4 ft",
  "Star",
  "Stark",
  "Stripes",
  "Toss",
  "Treat",
  "Utility Rack",
  "Vanity",
  "Vanity Super Deluxe",
] as const;

export const NATIONAL_PRODUCTS = [
  "Activa Superior",
  "Anchor",
  "Avenger",
  "Beast",
  "Bravo",
  "Cheetah",
  "Ciaz",
  "Dawn",
  "Dell",
  "Desire",
  "Echo",
  "Elegant",
  "Florida",
  "Ghost",
  "Giraffe Table",
  "Glance",
  "Heritage",
  "Jazz Pro",
  "Jeep",
  "Jumbo",
  "King",
  "Leo",
  "Magik",
  "Maharaja",
  "Omega",
  "Opel",
  "Orbit",
  "Panther",
  "Perfect",
  "Phantom",
  "Pluto",
  "Rock",
  "Scale",
  "Speed",
  "Stool",
  "Sumo",
  "Thunder",
  "Tiger",
  "Vegas",
  "Versa",
  "Vitara",
] as const;

export const NATIONAL_SAPPHIRE_PRODUCTS = [
  "Aspire",
  "Crown",
  "Florida",
  "Ideal",
  "Jaguar",
  "Lion",
  "Loop",
  "Magna",
  "Maharaja Superior",
  "Neptune Superior",
  "Puma",
  "Shark",
  "Tejas",
] as const;

export const COLLECTION_SEED = [
  {
    name: "NEXT",
    slug: "next",
    accent: "next",
    sortOrder: 1,
    tagline: "Contemporary designs for the way people live now",
    description:
      "The NEXT collection brings a modern, everyday sensibility to our range — practical formats designed around compact urban homes and changing lifestyles.",
    products: NEXT_PRODUCTS,
  },
  {
    name: "NATIONAL",
    slug: "national",
    accent: "national",
    sortOrder: 2,
    tagline: "The flagship range that carries our name",
    description:
      "NATIONAL is our broadest collection — the dependable, everyday range that established National Plasto in homes and businesses across eastern India.",
    products: NATIONAL_PRODUCTS,
  },
  {
    name: "NATIONAL SAPPHIRE",
    slug: "national-sapphire",
    accent: "sapphire",
    sortOrder: 3,
    tagline: "Our premium tier, finished to a higher standard",
    description:
      "NATIONAL SAPPHIRE is the elevated line — a focused selection of premium pieces for customers who want a more refined finish and presence.",
    products: NATIONAL_SAPPHIRE_PRODUCTS,
  },
] as const;

/**
 * Categories exist so the storefront filter is usable, but a product is only
 * auto-assigned when its OWN NAME states the product type (e.g. "Shoe Rack",
 * "Giraffe Table", "Stool"). Everything else stays uncategorised for an admin
 * to classify — guessing would mean inventing product facts.
 */
export const CATEGORY_SEED = [
  { name: "Chairs", slug: "chairs", sortOrder: 1, description: "Seating across all three National Plasto collections." },
  { name: "Tables", slug: "tables", sortOrder: 2, description: "Dining, centre and utility tables." },
  { name: "Stools", slug: "stools", sortOrder: 3, description: "Compact seating and step stools." },
  { name: "Storage & Racks", slug: "storage-racks", sortOrder: 4, description: "Shoe racks, utility racks and organisers." },
  { name: "Vanity & Bathroom", slug: "vanity-bathroom", sortOrder: 5, description: "Vanity units and bathroom fittings." },
  { name: "Kids", slug: "kids", sortOrder: 6, description: "Furniture designed for children." },
  { name: "Uncategorised", slug: "uncategorised", sortOrder: 99, description: "Awaiting classification by an administrator." },
] as const;

/** Literal name-based rules only — no inference about unnamed product types. */
const CATEGORY_RULES: Array<{ test: RegExp; slug: string }> = [
  { test: /\bshoe rack\b/i, slug: "storage-racks" },
  { test: /\butility rack\b/i, slug: "storage-racks" },
  { test: /\brack\b/i, slug: "storage-racks" },
  { test: /\btable\b/i, slug: "tables" },
  { test: /\bstool\b/i, slug: "stools" },
  { test: /\bvanity\b/i, slug: "vanity-bathroom" },
];

export function categorySlugForProduct(name: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.test.test(name)) return rule.slug;
  }
  return "uncategorised";
}

/**
 * SKU: NP-<COLLECTION>-<NNN>, e.g. NP-NXT-004.
 * Stable across re-seeds because it derives from list position.
 */
export function makeSku(collectionSlug: string, index: number): string {
  const code =
    collectionSlug === "next" ? "NXT" : collectionSlug === "national" ? "NTL" : "NSP";
  return `NP-${code}-${String(index + 1).padStart(3, "0")}`;
}
