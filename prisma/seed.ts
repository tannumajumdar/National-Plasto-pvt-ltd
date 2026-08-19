import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  CATEGORY_SEED,
  COLLECTION_SEED,
  categorySlugForProduct,
  makeSku,
} from "./seed-data";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("\nSeeding National Plasto\n" + "=".repeat(46));

  /* ---------------- Collections ---------------- */
  const collectionIds = new Map<string, string>();
  for (const c of COLLECTION_SEED) {
    const row = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        accent: c.accent,
        sortOrder: c.sortOrder,
      },
      create: {
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        description: c.description,
        accent: c.accent,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
    collectionIds.set(c.slug, row.id);
  }
  console.log(`  collections   ${COLLECTION_SEED.length}`);

  /* ---------------- Categories ---------------- */
  const categoryIds = new Map<string, string>();
  for (const cat of CATEGORY_SEED) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
    });
    categoryIds.set(cat.slug, row.id);
  }
  console.log(`  categories    ${CATEGORY_SEED.length}`);

  /* ---------------- Products ----------------
     A few names appear in more than one collection (Avenger in NEXT and
     NATIONAL; Florida in NATIONAL and NATIONAL SAPPHIRE). The first
     occurrence keeps the clean slug; later ones are suffixed with their
     collection so URLs stay unique and stable across re-seeds.          */
  const usedSlugs = new Set<string>();
  let created = 0;

  for (const c of COLLECTION_SEED) {
    const collectionId = collectionIds.get(c.slug)!;

    for (const [index, name] of c.products.entries()) {
      const base = slugify(name);
      const slug = usedSlugs.has(base) ? `${base}-${c.slug}` : base;
      usedSlugs.add(slug);

      const categorySlug = categorySlugForProduct(name);

      await prisma.product.upsert({
        where: { slug },
        update: {
          name,
          collectionId,
          sku: makeSku(c.slug, index),
        },
        create: {
          name,
          slug,
          sku: makeSku(c.slug, index),
          collectionId,
          categoryId: categoryIds.get(categorySlug) ?? null,
          // No price, description or specifications supplied by the source
          // document — an admin fills these in.
          price: null,
          discountPrice: null,
          stock: 0,
          trackStock: false,
          isPublished: true,
          needsReview: true,
          metaTitle: `${name} — ${c.name} Collection | National Plasto`,
        },
      });
      created++;
    }
  }
  console.log(`  products      ${created}`);

  /* ---------------- Admin user ---------------- */
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@nationalplasto.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      name: "National Plasto Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`  admin user    ${adminEmail}`);

  /* ---------------- Stats ----------------
     Products and Collections resolve live from the database, so they are
     published immediately and always accurate. "Years of Experience" and
     "Customers" are left unpublished — no real figures were supplied, and
     the storefront hides a stat until an admin enters one.               */
  const stats = [
    { key: "products", label: "Products in Catalogue", value: "0", suffix: "+", icon: "Package", computed: "products", isPublished: true, sortOrder: 1 },
    { key: "collections", label: "Brand Collections", value: "0", suffix: "", icon: "Layers", computed: "collections", isPublished: true, sortOrder: 2 },
    { key: "experience", label: "Years of Experience", value: "", suffix: "+", icon: "CalendarClock", computed: null, isPublished: false, sortOrder: 3 },
    { key: "customers", label: "Happy Customers", value: "", suffix: "+", icon: "Users", computed: null, isPublished: false, sortOrder: 4 },
  ];

  for (const s of stats) {
    const existing = await prisma.stat.findFirst({ where: { label: s.label } });
    if (existing) continue;
    await prisma.stat.create({
      data: {
        label: s.label,
        value: s.value,
        suffix: s.suffix,
        icon: s.icon,
        computed: s.computed,
        isPublished: s.isPublished,
        sortOrder: s.sortOrder,
      },
    });
  }
  console.log(`  stats         ${stats.length} (2 published, 2 awaiting real figures)`);

  /* ---------------- Editable site content ---------------- */
  const settings: Array<{ key: string; value: any }> = [
    {
      key: "hero",
      value: {
        eyebrow: "National Plasto Pvt. Ltd. · Kolkata",
        headline: "Quality Plastic Products Designed for Modern Living",
        subheadline:
          "Discover durable, stylish and reliable products from National Plasto Pvt. Ltd.",
        primaryCta: { label: "Explore Products", href: "/products" },
        secondaryCta: { label: "View Collections", href: "/collections" },
        image: null,
      },
    },
    {
      key: "about",
      value: {
        heading: "Built in Kolkata, made for everyday Indian homes",
        intro:
          "National Plasto Pvt. Ltd. is a plastic furniture and household products manufacturer based in Kolkata, West Bengal. We design and produce across three collections — NEXT, NATIONAL and NATIONAL SAPPHIRE — each built to the same standard of durability and finish.",
        vision:
          "To be recognised across eastern India as the plastic products brand that customers trust for everyday durability and honest value.",
        mission:
          "To manufacture dependable, well-finished plastic products, to keep our range wide enough to serve every home, and to stand behind everything that carries our name.",
        quality:
          "Every product is checked for finish, structural strength and consistency before it leaves our facility.",
        image: null,
      },
    },
    {
      key: "whyChooseUs",
      value: {
        heading: "Why choose National Plasto",
        subheading:
          "Six commitments that shape how we design, manufacture and support every product.",
        items: [
          { icon: "BadgeCheck", title: "Quality Products", body: "Consistent finish and build standards applied across all three collections." },
          { icon: "ShieldCheck", title: "Durable Materials", body: "Products engineered to hold up to daily use in real Indian homes." },
          { icon: "Sparkles", title: "Modern Designs", body: "Forms and formats designed around how people actually live today." },
          { icon: "LayoutGrid", title: "Wide Product Range", body: "Three collections spanning seating, storage, tables and more." },
          { icon: "HeartHandshake", title: "Customer Satisfaction", body: "We stand behind what we make and support customers after the sale." },
          { icon: "Truck", title: "Reliable Service", body: "Dependable dispatch and clear communication from order to delivery." },
        ],
      },
    },
    {
      key: "contact",
      value: {
        addressLine1: "National Plasto Pvt. Ltd.",
        addressLine2: "Kolkata, West Bengal",
        pincode: "700001",
        phonePrimary: "+91 00000 00000",
        phoneSecondary: "",
        emailGeneral: "info@nationalplasto.com",
        emailSales: "sales@nationalplasto.com",
        hoursWeekday: "Monday - Saturday, 10:00 AM - 7:00 PM",
        hoursWeekend: "Sunday - Closed",
        mapEmbedUrl: "https://www.google.com/maps?q=Kolkata,West%20Bengal,India&output=embed",
        mapLabel: "Kolkata, West Bengal",
        note: "Placeholder contact details - update from Admin > Content > Contact.",
      },
    },
    {
      key: "journey",
      value: {
        heading: "Our journey",
        subheading: "Milestones are editable from the admin panel.",
        milestones: [
          { year: "", title: "Company founded", body: "Add the founding year and story from Admin > Content." },
          { year: "", title: "NATIONAL collection introduced", body: "Our flagship range." },
          { year: "", title: "NEXT collection launched", body: "A contemporary line for modern homes." },
          { year: "", title: "NATIONAL SAPPHIRE launched", body: "Our premium tier." },
        ],
      },
    },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},                     // never clobber admin edits on re-seed
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`  settings      ${settings.length} content blocks`);

  console.log("=".repeat(46));
  console.log("Seed complete.\n");
  console.log(`  Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("  Change this password after first sign-in.\n");
}

main()
  .catch((e) => {
    console.error("\nSeed failed:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
