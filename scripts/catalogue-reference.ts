/**
 * Writes docs/catalogue-reference.csv — every product with its SKU, brand,
 * category and the filename an image should carry.
 *
 *   npx tsx scripts/catalogue-reference.ts
 *
 * This is the sheet to work from when naming photographs: `scripts/
 * import-product-images.ts` matches on SKU first, and a SKU is the one key
 * that is never ambiguous. 53 products share a name with another brand.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Quotes a CSV field only when it needs it. */
function csv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function main() {
  const products = await prisma.product.findMany({
    orderBy: [{ collection: { sortOrder: "asc" } }, { sku: "asc" }],
    select: {
      name: true,
      slug: true,
      sku: true,
      isPremium: true,
      isLimitedEdition: true,
      collection: { select: { name: true, sortOrder: true } },
      category: {
        select: { name: true, parent: { select: { name: true } } },
      },
      images: { select: { id: true } },
    },
  });

  const nameCounts = new Map<string, number>();
  for (const p of products) {
    const key = p.name.toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }

  const header = [
    "Brand",
    "Category",
    "Sub-category",
    "Product",
    "SKU",
    "Image filename",
    "Name shared with another brand",
    "Premium",
    "Limited edition",
    "Has image",
  ];

  const lines = [header.join(",")];

  for (const p of products) {
    const group = p.category?.parent?.name ?? p.category?.name ?? "";
    const heading = p.category?.parent ? p.category.name : "";
    const shared = (nameCounts.get(p.name.toLowerCase()) ?? 0) > 1;

    lines.push(
      [
        p.collection.name,
        group,
        heading,
        p.name,
        p.sku,
        // SKU-named files are unambiguous, so that is what the sheet asks for.
        `${p.sku}.jpg`,
        shared ? "YES — use the SKU" : "",
        p.isPremium ? "yes" : "",
        p.isLimitedEdition ? "yes" : "",
        p.images.length ? "yes" : "",
      ]
        .map(csv)
        .join(","),
    );
  }

  const out = path.join(process.cwd(), "docs", "catalogue-reference.csv");
  await mkdir(path.dirname(out), { recursive: true });
  // BOM so Excel opens the file as UTF-8 rather than the system codepage.
  await writeFile(out, "﻿" + lines.join("\n") + "\n", "utf8");

  const shared = products.filter(
    (p) => (nameCounts.get(p.name.toLowerCase()) ?? 0) > 1,
  ).length;
  const withImage = products.filter((p) => p.images.length > 0).length;

  console.log(`\nWrote ${out}`);
  console.log(`  ${products.length} products across 4 brands`);
  console.log(`  ${shared} share a name with another brand — name those files by SKU`);
  console.log(`  ${withImage} already have an image, ${products.length - withImage} do not\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
