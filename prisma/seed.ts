import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  BRAND_SEED,
  CATALOGUE,
  CATEGORY_TREE,
  PREMIUM_CATEGORY_SLUGS,
  makeSku,
} from "./catalogue-data";

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

  /* ---------------- Brands (collections) ---------------- */
  const collectionIds = new Map<string, string>();
  for (const b of BRAND_SEED) {
    const row = await prisma.collection.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        tagline: b.tagline,
        description: b.description,
        accent: b.accent,
        sortOrder: b.sortOrder,
      },
      create: {
        name: b.name,
        slug: b.slug,
        tagline: b.tagline,
        description: b.description,
        accent: b.accent,
        sortOrder: b.sortOrder,
        isActive: true,
      },
    });
    collectionIds.set(b.slug, row.id);
  }
  console.log(`  brands        ${BRAND_SEED.length}`);

  /* ---------------- Category tree ----------------
     Parents first, then their children, so a child always has a parent row to
     point at. Categories from an earlier catalogue are removed once products
     have been re-pointed further down.                                     */
  const categoryIds = new Map<string, string>();
  let categoryCount = 0;

  for (const parent of CATEGORY_TREE) {
    const parentRow = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: {
        name: parent.name,
        description: parent.description,
        sortOrder: parent.sortOrder,
        parentId: null,
        isActive: true,
      },
      create: {
        name: parent.name,
        slug: parent.slug,
        description: parent.description,
        sortOrder: parent.sortOrder,
      },
    });
    categoryIds.set(parent.slug, parentRow.id);
    categoryCount++;

    for (const [i, child] of parent.children.entries()) {
      const childRow = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          parentId: parentRow.id,
          sortOrder: parent.sortOrder * 100 + i + 1,
          isActive: true,
        },
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parentRow.id,
          sortOrder: parent.sortOrder * 100 + i + 1,
        },
      });
      categoryIds.set(child.slug, childRow.id);
      categoryCount++;
    }
  }
  console.log(`  categories    ${categoryCount} (${CATEGORY_TREE.length} groups + headings)`);

  /* ---------------- Products ----------------
     Names repeat across brands (Avenger in NEXT and NATIONAL; Flora in
     NATIONAL, SAPPHIRE and CAPTAIN), so the first occurrence keeps the clean
     slug and later ones are suffixed with their brand. Iteration order is
     fixed by CATALOGUE, so slugs stay stable across re-seeds.             */
  const usedSlugs = new Set<string>();
  const plan: Array<{
    name: string;
    slug: string;
    sku: string;
    brandName: string;
    collectionId: string;
    categoryId: string | null;
    isPremium: boolean;
  }> = [];

  for (const brand of CATALOGUE) {
    const meta = BRAND_SEED.find((b) => b.slug === brand.brand)!;
    const collectionId = collectionIds.get(brand.brand)!;
    let index = 0;

    for (const group of brand.groups) {
      const categoryId = categoryIds.get(group.category) ?? null;
      const isPremium = PREMIUM_CATEGORY_SLUGS.includes(group.category);

      for (const name of group.products) {
        const base = slugify(name);
        const slug = usedSlugs.has(base) ? `${base}-${brand.brand}` : base;
        usedSlugs.add(slug);

        plan.push({
          name,
          slug,
          sku: makeSku(brand.brand, index),
          brandName: meta.name,
          collectionId,
          categoryId,
          isPremium,
        });
        index++;
      }
    }
  }

  /* Retire the previous catalogue FIRST — its SKUs sit on the numbers this
     list is about to claim. Order history is unaffected: order_items snapshot
     the name, slug and price, and their productId is ON DELETE SET NULL.   */
  const retired = await prisma.product.deleteMany({
    where: { slug: { notIn: plan.map((p) => p.slug) } },
  });
  if (retired.count) {
    console.log(`  retired       ${retired.count} products from the previous list`);
  }

  /* Survivors keep their row (and any pricing or imagery an admin added) but
     their old SKU may be the number this list assigns to a different product.
     Park every survivor on a temporary SKU so the renumbering below cannot
     collide part-way through. */
  const survivors = await prisma.product.findMany({ select: { id: true } });
  for (const s of survivors) {
    await prisma.product.update({
      where: { id: s.id },
      data: { sku: `TMP-${s.id}` },
    });
  }

  for (const p of plan) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        sku: p.sku,
        collectionId: p.collectionId,
        categoryId: p.categoryId,
        isPremium: p.isPremium,
        isPublished: true,
      },
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        collectionId: p.collectionId,
        categoryId: p.categoryId,
        isPremium: p.isPremium,
        // No price, description or specifications supplied by the source
        // document — an admin fills these in.
        price: null,
        discountPrice: null,
        stock: 0,
        trackStock: false,
        isPublished: true,
        needsReview: true,
        metaTitle: `${p.name} — ${p.brandName} Collection | National Plasto`,
      },
    });
  }
  console.log(`  products      ${plan.length}`);

  const keepCategories = [...categoryIds.values()];
  const staleCategories = await prisma.category.deleteMany({
    where: { id: { notIn: keepCategories } },
  });
  if (staleCategories.count) {
    console.log(`  retired       ${staleCategories.count} categories`);
  }

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
          "National Plasto Pvt. Ltd. is a plastic furniture and household products manufacturer based in Kolkata, West Bengal. We design and produce across four brands — NEXT, NATIONAL, NATIONAL SAPPHIRE and CAPTAIN — each built to the same standard of durability and finish.",
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
          { icon: "BadgeCheck", title: "Quality Products", body: "Consistent finish and build standards applied across all four brands." },
          { icon: "ShieldCheck", title: "Durable Materials", body: "Products engineered to hold up to daily use in real Indian homes." },
          { icon: "Sparkles", title: "Modern Designs", body: "Forms and formats designed around how people actually live today." },
          { icon: "LayoutGrid", title: "Wide Product Range", body: "Four brands spanning seating, storage, tables and more." },
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
