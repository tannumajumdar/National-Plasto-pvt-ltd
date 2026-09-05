/**
 * Writes docs/products-needing-photos.csv — every published product the
 * catalogue still has no photograph for, grouped the way the shoot is
 * organised so a photographer can work straight off it.
 *
 *   npx tsx scripts/photo-gaps.ts
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const csv = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

async function main() {
  const rows = await prisma.product.findMany({
    where: { images: { none: {} } },
    orderBy: [{ collection: { sortOrder: "asc" } }, { sku: "asc" }],
    select: {
      name: true,
      sku: true,
      isPremium: true,
      collection: { select: { name: true } },
      category: { select: { name: true, parent: { select: { name: true } } } },
    },
  });

  const total = await prisma.product.count();
  const lines = [["Brand", "Category", "Sub-category", "Product", "SKU", "Premium"].join(",")];

  for (const p of rows) {
    lines.push(
      [
        p.collection.name,
        p.category?.parent?.name ?? p.category?.name ?? "",
        p.category?.parent ? p.category.name : "",
        p.name,
        p.sku,
        p.isPremium ? "yes" : "",
      ]
        .map(csv)
        .join(","),
    );
  }

  const out = path.join(process.cwd(), "docs", "products-needing-photos.csv");
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, "\ufeff" + lines.join("\n") + "\n", "utf8");

  const perBrand = new Map<string, number>();
  for (const p of rows) {
    perBrand.set(p.collection.name, (perBrand.get(p.collection.name) ?? 0) + 1);
  }

  console.log(`\n${rows.length} of ${total} products have no photograph:`);
  for (const [b, n] of perBrand) console.log(`  ${b.padEnd(20)} ${n}`);
  console.log(`\nWrote ${out}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
