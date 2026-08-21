/**
 * Bulk-import product photographs from a folder.
 *
 *   npx tsx scripts/import-product-images.ts ./incoming            # dry run
 *   npx tsx scripts/import-product-images.ts ./incoming --apply    # write
 *   npx tsx scripts/import-product-images.ts ./incoming --apply --replace
 *
 * Files are matched to products by filename, in this order:
 *
 *   NP-NXT-001.jpg          exact SKU
 *   atom-2-ft.jpg           exact slug
 *   Atom - 2 ft.jpg         product name (slugified)
 *   atom-2-ft-2.jpg         slug + a trailing number = second image, and so on
 *
 * Matching is deliberately strict: a photo attached to the wrong product is
 * worse than no photo at all, so anything ambiguous is reported and skipped
 * rather than guessed at.
 *
 * Dry run by default — nothing is copied or written until you pass --apply.
 */
import { createHash } from "crypto";
import { copyFile, mkdir, readdir, stat } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 5);
const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? "public/uploads";
const FOLDER = "products";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Candidate {
  file: string;
  absolute: string;
  bytes: number;
  /** Trailing -2, -3 … means "second photo of this product". */
  order: number;
  key: string;
}

function parseName(file: string): { key: string; order: number } {
  const base = path.basename(file, path.extname(file)).trim();
  const m = /^(.*?)[-_\s]+(\d{1,2})$/.exec(base);
  if (m) return { key: m[1], order: Number(m[2]) - 1 };
  return { key: base, order: 0 };
}

async function main() {
  const dir = process.argv[2];
  const apply = process.argv.includes("--apply");
  const replace = process.argv.includes("--replace");

  if (!dir) {
    console.error(
      "\nUsage: npx tsx scripts/import-product-images.ts <folder> [--apply] [--replace]\n",
    );
    process.exit(1);
  }

  const sourceDir = path.resolve(dir);
  let entries: string[];
  try {
    entries = await readdir(sourceDir);
  } catch {
    console.error(`\nCannot read folder: ${sourceDir}\n`);
    process.exit(1);
  }

  /* ---------------- build the lookup ---------------- */
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      description: true,
      price: true,
      images: { select: { id: true, url: true } },
    },
  });

  const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
  const bySlug = new Map(products.map((p) => [p.slug.toLowerCase(), p]));
  const byName = new Map(products.map((p) => [slugify(p.name), p]));

  /* ---------------- classify every file ---------------- */
  const matched = new Map<string, Candidate[]>(); // productId -> files
  const unmatched: string[] = [];
  const rejected: { file: string; why: string }[] = [];

  for (const file of entries.sort()) {
    const absolute = path.join(sourceDir, file);
    const info = await stat(absolute);
    if (info.isDirectory()) continue;

    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED.has(ext)) {
      rejected.push({ file, why: `unsupported type ${ext || "(none)"}` });
      continue;
    }
    if (info.size === 0) {
      rejected.push({ file, why: "empty file" });
      continue;
    }
    if (info.size > MAX_MB * 1024 * 1024) {
      rejected.push({ file, why: `${(info.size / 1024 / 1024).toFixed(1)} MB exceeds ${MAX_MB} MB` });
      continue;
    }

    const { key, order } = parseName(file);
    const norm = key.toLowerCase();
    const product =
      bySku.get(norm) ?? bySlug.get(slugify(key)) ?? byName.get(slugify(key)) ?? null;

    if (!product) {
      unmatched.push(file);
      continue;
    }

    const list = matched.get(product.id) ?? [];
    list.push({ file, absolute, bytes: info.size, order, key });
    matched.set(product.id, list);
  }

  /* ---------------- report ---------------- */
  const byId = new Map(products.map((p) => [p.id, p]));
  const willSkip: string[] = [];

  console.log(`\nSource : ${sourceDir}`);
  console.log(`Mode   : ${apply ? (replace ? "APPLY (replacing existing images)" : "APPLY") : "DRY RUN — nothing will be written"}`);
  console.log("-".repeat(70));

  for (const [productId, files] of [...matched.entries()].sort()) {
    const p = byId.get(productId)!;
    const existing = p.images.length;
    if (existing > 0 && !replace) {
      willSkip.push(p.sku);
      console.log(`  SKIP  ${p.sku.padEnd(12)} ${p.name}  (already has ${existing}; use --replace)`);
      continue;
    }
    const ordered = files.sort((a, b) => a.order - b.order);
    console.log(
      `  OK    ${p.sku.padEnd(12)} ${p.name}  <- ${ordered.map((f) => f.file).join(", ")}`,
    );
  }

  if (unmatched.length) {
    console.log(`\n  ${unmatched.length} file(s) matched no product:`);
    for (const f of unmatched.slice(0, 25)) console.log(`    ? ${f}`);
    if (unmatched.length > 25) console.log(`    …and ${unmatched.length - 25} more`);
    console.log("    Rename them to the product SKU or slug — see the header of this file.");
  }

  if (rejected.length) {
    console.log(`\n  ${rejected.length} file(s) rejected:`);
    for (const r of rejected.slice(0, 15)) console.log(`    x ${r.file} — ${r.why}`);
  }

  const importable = [...matched.entries()].filter(
    ([id]) => replace || byId.get(id)!.images.length === 0,
  );

  console.log("\n" + "-".repeat(70));
  console.log(
    `products to update: ${importable.length}   files to copy: ${importable.reduce((n, [, f]) => n + f.length, 0)}`,
  );
  console.log(`catalogue without any image: ${products.filter((p) => p.images.length === 0).length} of ${products.length}`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write.\n");
    await prisma.$disconnect();
    return;
  }

  /* ---------------- write ---------------- */
  const destDir = path.join(process.cwd(), UPLOAD_ROOT, FOLDER);
  await mkdir(destDir, { recursive: true });
  const publicRoot = `/${UPLOAD_ROOT.replace(/^public\/?/, "")}`.replace(/\/+/g, "/");

  let copied = 0;
  for (const [productId, files] of importable) {
    const p = byId.get(productId)!;
    const ordered = files.sort((a, b) => a.order - b.order);
    const urls: string[] = [];

    for (const [i, f] of ordered.entries()) {
      const ext = path.extname(f.file).toLowerCase().replace(".jpeg", ".jpg");
      // Content hash in the name: re-importing the same photo cannot collide,
      // and a changed photo gets a new URL so caches do not serve the old one.
      const digest = createHash("sha1")
        .update(`${p.slug}:${f.file}:${f.bytes}`)
        .digest("hex")
        .slice(0, 10);
      const filename = `${p.slug}-${digest}${ext}`;
      await copyFile(f.absolute, path.join(destDir, filename));
      urls.push(`${publicRoot}/${FOLDER}/${filename}`.replace(/\/+/g, "/"));
      copied++;
      void i;
    }

    await prisma.$transaction(async (tx) => {
      if (replace) {
        await tx.productImage.deleteMany({ where: { productId } });
      }
      await tx.productImage.createMany({
        data: urls.map((url, i) => ({ productId, url, alt: p.name, sortOrder: i })),
      });
      // Mirrors computeNeedsReview in src/lib/actions/products.ts: a product is
      // complete only with a price, a description AND an image.
      await tx.product.update({
        where: { id: productId },
        data: {
          needsReview: p.price === null || !p.description?.trim() || urls.length === 0,
        },
      });
    });
  }

  const remaining = await prisma.product.count({ where: { images: { none: {} } } });
  console.log(`\nCopied ${copied} file(s) for ${importable.length} product(s).`);
  console.log(`Still without an image: ${remaining} of ${products.length}.`);
  if (willSkip.length) {
    console.log(`Left alone (already had images): ${willSkip.length}. Re-run with --replace to overwrite.`);
  }
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
