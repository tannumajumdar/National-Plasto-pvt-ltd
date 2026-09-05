/**
 * The catalogue, transcribed from "Website Product-Wise Update" (03 Sep 2026).
 *
 * Structure mirrors the source document exactly:
 *   brand -> category heading -> product names
 *
 * IMPORTANT: the document supplies NAMES ONLY. No prices, dimensions,
 * materials, colours or specifications were given, so none are invented here.
 * Every product seeds with `needsReview: true` and null pricing for an admin
 * to complete.
 *
 * Two readability normalisations were applied, and nothing else:
 *   - Headings are singular/plural-normalised so the same heading appearing on
 *     several brand sheets ("ECONOMIC ARM CHAIRS" on NEXT, "ECONOMICAL ARM
 *     CHAIR" on SAPPHIRE/CAPTAIN) resolves to one category.
 *   - Product names are title-cased; the wording itself is untouched.
 */

export const BRAND_SEED = [
  {
    name: "NEXT",
    slug: "next",
    accent: "next",
    code: "NXT",
    sortOrder: 1,
    tagline: "Contemporary designs for the way people live now",
    description:
      "The NEXT collection brings a modern, everyday sensibility to our range — practical formats designed around compact urban homes and changing lifestyles.",
  },
  {
    name: "NATIONAL",
    slug: "national",
    accent: "national",
    code: "NTL",
    sortOrder: 2,
    tagline: "The flagship range that carries our name",
    description:
      "NATIONAL is our broadest collection — the dependable, everyday range that established National Plasto in homes and businesses across eastern India.",
  },
  {
    name: "NATIONAL SAPPHIRE",
    slug: "national-sapphire",
    accent: "sapphire",
    code: "NSP",
    sortOrder: 3,
    tagline: "Our premium tier, finished to a higher standard",
    description:
      "NATIONAL SAPPHIRE is the elevated line — a focused selection of premium pieces for customers who want a more refined finish and presence.",
  },
  {
    name: "CAPTAIN",
    slug: "captain",
    accent: "captain",
    code: "CPT",
    sortOrder: 4,
    tagline: "A compact, value-focused range",
    description:
      "CAPTAIN is our tightest range — a short, deliberately edited selection covering the formats a household reaches for most.",
  },
] as const;

export type BrandSlug = (typeof BRAND_SEED)[number]["slug"];

/**
 * Top-level groups and the brand-sheet headings beneath them. A heading is
 * shared across brands wherever the source document uses the same wording; the
 * storefront scopes it per brand by filtering on the products themselves.
 */
export const CATEGORY_TREE = [
  {
    name: "Chairs",
    slug: "chairs",
    sortOrder: 1,
    description: "Arm and armless seating across every collection.",
    children: [
      { name: "Deluxe Arm Chairs", slug: "deluxe-arm-chairs" },
      { name: "Deluxe Armless Chairs", slug: "deluxe-armless-chairs" },
      { name: "Steel Moulded Chairs", slug: "steel-moulded-chairs" },
      { name: "Heavy Premium Chairs", slug: "heavy-premium-chairs" },
      { name: "Heavy Guarantee Arm Chairs", slug: "heavy-guarantee-arm-chairs" },
      { name: "Premium Arm Chairs", slug: "premium-arm-chairs" },
      { name: "Regular Arm Chairs", slug: "regular-arm-chairs" },
      { name: "Economical Arm Chairs", slug: "economical-arm-chairs" },
      { name: "Premium Armless Chairs", slug: "premium-armless-chairs" },
      { name: "Economical Armless Chairs", slug: "economical-armless-chairs" },
      { name: "C Armless Chairs", slug: "c-armless-chairs" },
    ],
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    sortOrder: 2,
    description: "Chairs and tables sized for children.",
    children: [
      { name: "Baby Chairs", slug: "baby-chairs" },
      { name: "Premium Baby Chairs", slug: "premium-baby-chairs" },
      { name: "Baby Tables", slug: "baby-tables" },
    ],
  },
  {
    name: "Stools",
    slug: "stools",
    sortOrder: 3,
    description: "Compact seating and step stools.",
    children: [
      { name: "Premium Stools", slug: "premium-stools" },
      { name: "Economical Stools", slug: "economical-stools" },
    ],
  },
  {
    name: "Tables",
    slug: "tables",
    sortOrder: 4,
    description: "Tea, coffee, dining and monoblock tables.",
    children: [
      { name: "Tea Tables", slug: "tea-tables" },
      { name: "Premium Tea Tables", slug: "premium-tea-tables" },
      { name: "Economical Tea Tables", slug: "economical-tea-tables" },
      { name: "Coffee Tables", slug: "coffee-tables" },
      { name: "Premium Coffee Tables", slug: "premium-coffee-tables" },
      { name: "Economical Coffee Tables", slug: "economical-coffee-tables" },
      { name: "Dining Tables", slug: "dining-tables" },
      { name: "Premium Dining Tables", slug: "premium-dining-tables" },
      { name: "Economical Dining Tables", slug: "economical-dining-tables" },
      { name: "Monoblock Tables", slug: "monoblock-tables" },
    ],
  },
  {
    name: "Storage",
    slug: "storage",
    sortOrder: 5,
    description: "Wardrobes, trolleys and racks.",
    children: [
      { name: "Trolleys", slug: "trolleys" },
      { name: "Wardrobes", slug: "wardrobes" },
      { name: "Shoe Racks", slug: "shoe-racks" },
    ],
  },
] as const;

/**
 * Headings the source document itself marks as an upper tier. Products in
 * these categories seed with `isPremium: true`; an admin can override any
 * individual product afterwards.
 */
export const PREMIUM_CATEGORY_SLUGS: readonly string[] = [
  "deluxe-arm-chairs",
  "deluxe-armless-chairs",
  "heavy-premium-chairs",
  "heavy-guarantee-arm-chairs",
  "premium-arm-chairs",
  "premium-armless-chairs",
  "premium-baby-chairs",
  "premium-stools",
  "premium-tea-tables",
  "premium-coffee-tables",
  "premium-dining-tables",
];

export interface CatalogueGroup {
  /**
   * Category slug the products attach to — a child heading, or a top-level
   * group where the brand sheet supplies no finer split (SAPPHIRE and CAPTAIN
   * simply say STOOLS, where NATIONAL splits Premium from Economical).
   */
  category: string;
  /** The heading exactly as printed on the brand sheet, kept for reference. */
  sourceHeading: string;
  products: readonly string[];
}

export interface BrandCatalogue {
  brand: BrandSlug;
  groups: readonly CatalogueGroup[];
}

export const CATALOGUE: readonly BrandCatalogue[] = [
  /* ---------------------------------------------------------------
     NEXT — 72 products, 15 headings
     --------------------------------------------------------------- */
  {
    brand: "next",
    groups: [
      {
        category: "deluxe-arm-chairs",
        sourceHeading: "DELUXE ARM CHAIRS",
        products: ["Magnetic", "Vanity Super DLX"],
      },
      {
        category: "deluxe-armless-chairs",
        sourceHeading: "DELUXE ARMLESS CHAIRS",
        products: ["Discover Super DLX", "Caliber Super DLX", "Invent Super DLX"],
      },
      {
        category: "steel-moulded-chairs",
        sourceHeading: "STEEL MOULDED",
        products: ["Cinematic", "Matt"],
      },
      {
        category: "heavy-premium-chairs",
        sourceHeading: "HEAVY PREMIUM CHAIRS",
        products: ["Easy", "Vanity", "Stark", "Wonder", "Magik"],
      },
      {
        category: "economical-arm-chairs",
        sourceHeading: "ECONOMIC ARM CHAIRS",
        products: ["Prawn", "Roman", "Wheel", "Avenger", "Treat", "Camry"],
      },
      {
        category: "premium-armless-chairs",
        sourceHeading: "PREMIUM ARMLESS CHAIRS",
        products: [
          "Discover", "Caliber", "Catch", "Ruffel", "Invent", "Spread",
          "Canny", "Stripes", "Rolex", "Star", "Delight", "Toss",
        ],
      },
      {
        category: "economical-armless-chairs",
        sourceHeading: "ECONOMIC ARMLESS CHAIRS",
        products: [
          "Imperial RRK", "Imperial New", "Imperial WiFi",
          "Imperial Hajipur", "Kinky",
        ],
      },
      {
        category: "baby-chairs",
        sourceHeading: "BABY CHAIRS",
        products: [
          "Dolphin Easy Baby", "Rocker", "Baby Ultimate", "Primo",
          "Bonny", "Mickey", "Civic", "Ponny",
        ],
      },
      {
        category: "baby-tables",
        sourceHeading: "BABY TABLES",
        products: ["Kinder", "Kidjee Junior", "Kids Playtime"],
      },
      {
        category: "stools",
        sourceHeading: "STOOL",
        products: [
          "Scale", "Aspire", "Swift", "Charm", "Rozy",
          "Miracle", "Marvel", "Big Ponny", "Enlarge Step Stool",
        ],
      },
      {
        category: "tea-tables",
        sourceHeading: "TEA TABLES",
        products: ["Orient", "Rider", "Dogma", "Mesh"],
      },
      {
        category: "dining-tables",
        sourceHeading: "DINING TABLES",
        products: ["Buffet", "Fortune", "Cherish", "Glance"],
      },
      {
        category: "trolleys",
        sourceHeading: "TROLLEY",
        products: ["Utility Rack-4", "Utility Rack-5"],
      },
      {
        category: "wardrobes",
        sourceHeading: "WARDROBE",
        products: ["Atom 2FT", "Atom 4FT", "Atom 6FT", "Princess 2FT", "Princess 4FT"],
      },
      {
        category: "shoe-racks",
        sourceHeading: "SHOE RACK",
        products: ["Shoe Rack 2 Feet", "Shoe Rack 4 Feet"],
      },
    ],
  },

  /* ---------------------------------------------------------------
     NATIONAL — 103 products, 14 headings
     --------------------------------------------------------------- */
  {
    brand: "national",
    groups: [
      {
        category: "heavy-guarantee-arm-chairs",
        sourceHeading: "HEAVY GUARANTEE ARM CHAIR",
        products: [
          "Leo", "King", "Lord", "Simba", "Sher", "Arjun",
          "Cheetah", "Tiger", "Panther", "Prince", "Rock", "Anchor",
        ],
      },
      {
        category: "premium-arm-chairs",
        sourceHeading: "PREMIUM ARM CHAIR",
        products: [
          "Ciaz", "Cruze", "Sumo", "Seltos", "Magik", "Jewel", "Phantom",
          "Ghost", "Hercules", "Crysta", "Diamond", "Wonder", "Sturdy",
          "Robust", "Thrill", "Creta", "Rio", "New Spectrum",
          "Ultimate Premium", "New Fusion", "Fire", "Alpine", "Techno",
          "Beast", "Bravo", "Sonic", "Dell", "Amazon", "Unique",
        ],
      },
      {
        category: "regular-arm-chairs",
        sourceHeading: "REGULAR ARM CHAIR",
        products: [
          "Dolphin", "Avenger", "Dawn", "Thunder", "Eco", "Elegant",
          "Daylight", "Admire", "Heritage", "Palms", "Dream",
        ],
      },
      {
        category: "premium-armless-chairs",
        sourceHeading: "PREMIUM ARMLESS CHAIR",
        products: [
          "Galaxy", "Vision", "Speed", "Omega",
          "Hector", "Activa", "Activa Superior", "Turbo",
        ],
      },
      {
        category: "c-armless-chairs",
        sourceHeading: "C ARMLESS CHAIR",
        products: [
          "Imperial Sofa", "Echo", "Old Florence", "New Florence",
          "Lilly", "Desire", "Perfect",
        ],
      },
      {
        category: "premium-baby-chairs",
        sourceHeading: "PREMIUM BABY CHAIR",
        products: [
          "Bonny", "Primo", "Baby Ultimate", "Pups",
          "Tom Baby", "Toy Baby", "Cute Baby",
        ],
      },
      {
        category: "premium-stools",
        sourceHeading: "PREMIUM STOOLS",
        products: ["Scale", "Mars", "Saturn", "Jimmy", "Comet", "Enlarge"],
      },
      {
        category: "economical-stools",
        sourceHeading: "ECONOMIC STOOLS",
        products: ["Java", "Charm", "Swift", "Rhino"],
      },
      {
        category: "monoblock-tables",
        sourceHeading: "MONOBLOCK TABLE",
        products: ["Jazz", "Jazz Pro"],
      },
      {
        category: "premium-tea-tables",
        sourceHeading: "PREMIUM TEA TABLE",
        products: ["Opel", "Astor", "Vegas"],
      },
      {
        category: "premium-coffee-tables",
        sourceHeading: "PREMIUM COFFEE TABLE",
        products: ["Jeep"],
      },
      {
        category: "economical-coffee-tables",
        sourceHeading: "ECONOMICAL COFFEE TABLE",
        products: ["Indica", "Alto", "Vitara", "Orbit", "Versa"],
      },
      {
        category: "dining-tables",
        sourceHeading: "DINING TABLE",
        products: ["Flora", "Punch", "Neptune"],
      },
      {
        category: "premium-dining-tables",
        sourceHeading: "PREMIUM DINING TABLE",
        products: ["Maharaja", "Jumbo", "Glance", "Florida", "Florida Superior"],
      },
    ],
  },

  /* ---------------------------------------------------------------
     NATIONAL SAPPHIRE — 37 products, 10 headings
     --------------------------------------------------------------- */
  {
    brand: "national-sapphire",
    groups: [
      {
        category: "heavy-guarantee-arm-chairs",
        sourceHeading: "HEAVY GUARANTEE ARM CHAIR",
        products: [
          "Jaguar", "Leopard Leo", "Leopard King", "Carnival",
          "Tejas", "Relaxo", "Puma", "Bheem",
        ],
      },
      {
        category: "economical-arm-chairs",
        sourceHeading: "ECONOMICAL ARM CHAIR",
        products: ["Dolphin", "Brezza", "Rex", "Flower"],
      },
      {
        category: "economical-armless-chairs",
        sourceHeading: "ECONOMICAL ARMLESS CHAIR",
        products: ["Pluto", "Old Florence", "New Florence", "Ideal", "Ruby"],
      },
      {
        category: "baby-chairs",
        sourceHeading: "BABY CHAIR",
        products: ["Toy Baby"],
      },
      {
        category: "stools",
        sourceHeading: "STOOLS",
        products: ["Aspire", "Cross", "Disc", "Jimmy", "Comet"],
      },
      {
        category: "monoblock-tables",
        sourceHeading: "MONOBLOCK TABLE",
        products: ["Comfy", "Magna", "Striker"],
      },
      {
        category: "premium-tea-tables",
        sourceHeading: "PREMIUM TEA TABLE",
        products: ["Opel Superior", "Versa Superior", "Zen Superior"],
      },
      {
        category: "economical-tea-tables",
        sourceHeading: "ECONOMICAL TEA TABLE",
        products: ["Versa", "Vitara"],
      },
      {
        category: "premium-dining-tables",
        sourceHeading: "PREMIUM DINING TABLE",
        products: ["Flora Superior", "Maharaja Superior", "Neptune Superior"],
      },
      {
        category: "economical-dining-tables",
        sourceHeading: "ECONOMICAL DINING TABLE",
        products: ["Flora", "Neptune", "Maharaja"],
      },
    ],
  },

  /* ---------------------------------------------------------------
     CAPTAIN — 18 products, 9 headings
     --------------------------------------------------------------- */
  {
    brand: "captain",
    groups: [
      {
        category: "heavy-guarantee-arm-chairs",
        sourceHeading: "HEAVY GUARANTEE ARM CHAIR",
        products: ["Crystal", "Curl"],
      },
      {
        category: "premium-arm-chairs",
        sourceHeading: "PREMIUM ARM CHAIR",
        products: ["Ultimate", "Cute", "Cube"],
      },
      {
        category: "economical-arm-chairs",
        sourceHeading: "ECONOMICAL ARM CHAIR",
        products: ["Sofa", "Camry", "Ajanta"],
      },
      {
        category: "economical-armless-chairs",
        sourceHeading: "ECONOMICAL ARMLESS CHAIR",
        products: ["Old Florence", "New Florence"],
      },
      {
        category: "baby-chairs",
        sourceHeading: "BABY CHAIR",
        products: ["Joye Baby", "Baby Ultimate"],
      },
      {
        category: "stools",
        sourceHeading: "STOOLS",
        products: ["Charm"],
      },
      {
        category: "monoblock-tables",
        sourceHeading: "MONOBLOCK TABLE",
        products: ["Orkid"],
      },
      {
        category: "coffee-tables",
        sourceHeading: "COFFEE TABLE",
        products: ["Venue", "Web"],
      },
      {
        category: "dining-tables",
        sourceHeading: "DINING TABLE",
        products: ["Flora", "Punch"],
      },
    ],
  },
];

/** SKU: NP-<BRAND CODE>-<NNN>. Stable across re-seeds — derived from position. */
export function makeSku(brandSlug: string, index: number): string {
  const code = BRAND_SEED.find((b) => b.slug === brandSlug)?.code ?? "NPL";
  return `NP-${code}-${String(index + 1).padStart(3, "0")}`;
}
