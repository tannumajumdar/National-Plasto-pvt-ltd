/**
 * Bulk-import product photographs from a folder.
 *
 *   npx tsx scripts/import-product-images.ts ./incoming            # dry run
 *   npx tsx scripts/import-product-images.ts ./incoming --apply    # write
 *   npx tsx scripts/import-product-images.ts ./incoming --apply --replace
 *
 * Sub-folders are walked, so a catalogue exported brand-wise works as-is:
 *
 *   incoming/NEXT/Baby Chairs/Baby Ultimate.jpg
 *   incoming/CAPTAIN/Baby Chair/Baby Ultimate.jpg
 *
 * Files are matched to products by filename, in this order:
 *
 *   NP-NXT-001.jpg          exact SKU        <- always unambiguous
 *   baby-ultimate.jpg       exact slug
 *   Baby Ultimate.jpg       product name (slugified)
 *   baby-ultimate-2.jpg     slug + a trailing number = second image, and so on
 *
 * 53 of the 230 products share a name with another brand (Old Florence is in
 * NATIONAL, SAPPHIRE and CAPTAIN). A name alone cannot pick between those, so
 * a brand folder anywhere in the path — NEXT, NATIONAL, NATIONAL SAPPHIRE,
 * CAPTAIN, or their slugs — is used to narrow it down. Anything still
 * ambiguous is REPORTED AND SKIPPED, never guessed: a photo on the wrong
 * product is worse than no photo at all.
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
  /** Path as the operator sees it, relative to the source folder. */
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

/** Every file under `dir`, recursively, as paths relative to `base`. */
async function walk(dir: string, base: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of (await readdir(dir)).sort()) {
    const absolute = path.join(dir, entry);
    const info = await stat(absolute);
    if (info.isDirectory()) {
      out.push(...(await walk(absolute, base)));
    } else {
      out.push(path.relative(base, absolute));
    }
  }
  return out;
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
    entries = await walk(sourceDir, sourceDir);
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
      collection: { select: { name: true, slug: true } },
      images: { select: { id: true, url: true } },
    },
  });
  type Product = (typeof products)[number];

  const collections = await prisma.collection.findMany({
    select: { name: true, slug: true },
  });

  const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
  const bySlug = new Map(products.map((p) => [p.slug.toLowerCase(), p]));

  // A list, not a single product: names repeat across brands and the caller
  // has to be told when a filename cannot identify one product on its own.
  const byName = new Map<string, Product[]>();
  for (const p of products) {
    const key = slugify(p.name);
    byName.set(key, [...(byName.get(key) ?? []), p]);
  }

  // Both "NATIONAL SAPPHIRE" and "national-sapphire" name the same brand.
  const brandFolders = new Map<string, string>();
  for (const c of collections) {
    brandFolders.set(slugify(c.name), c.slug);
    brandFolders.set(slugify(c.slug), c.slug);
  }

  /* ---------------- classify every file ---------------- */
  const matched = new Map<string, Candidate[]>(); // productId -> files
  const unmatched: string[] = [];
  const ambiguous: { file: string; candidates: Product[] }[] = [];
  const misfiled: { file: string; brandHint: string; candidates: Product[] }[] = [];
  const rejected: { file: string; why: string }[] = [];

  for (const file of entries) {
    const absolute = path.join(sourceDir, file);
    const info = await stat(absolute);

    // A leading underscore marks a working file the tooling wrote itself
    // (fetch-drive-images leaves its manifest here); not something to report.
    if (path.basename(file).startsWith("_")) continue;

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

    // Any folder on the way to this file that names a brand.
    const brandHint = path
      .dirname(file)
      .split(path.sep)
      .map((segment) => brandFolders.get(slugify(segment)))
      .find(Boolean);

    const { key, order } = parseName(file);
    const norm = key.toLowerCase();
    const keySlug = slugify(key);

    let product = bySku.get(norm) ?? null;

    if (!product) {
      // Everything the filename could possibly mean. A shared name contributes
      // one candidate per brand; a slug contributes exactly one. Both go in the
      // pool BEFORE the brand folder narrows it, because a slug match that
      // ignored the folder is precisely how a CAPTAIN photo lands on a NEXT
      // product — "baby-ultimate" is NEXT's slug and also CAPTAIN's name.
      const pool = new Map<string, Product>();
      for (const p of byName.get(keySlug) ?? []) pool.set(p.id, p);
      const slugHit = bySlug.get(keySlug);
      if (slugHit) pool.set(slugHit.id, slugHit);

      const all = [...pool.values()];
      const candidates = brandHint
        ? all.filter((p) => p.collection.slug === brandHint)
        : all;

      if (candidates.length === 1) {
        product = candidates[0];
      } else if (candidates.length > 1) {
        // No tie-break here on purpose. `old-florence.jpg` names three
        // products; that one of them holds the unsuffixed slug is an artefact
        // of seeding order, not a statement of intent.
        ambiguous.push({ file, candidates });
        continue;
      } else if (all.length > 0) {
        misfiled.push({ file, brandHint: brandHint!, candidates: all });
        continue;
      }
    }

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
  console.log(`Files  : ${entries.length}`);
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

  if (ambiguous.length) {
    console.log(`\n  ${ambiguous.length} file(s) matched MORE THAN ONE product and were skipped:`);
    for (const a of ambiguous.slice(0, 25)) {
      console.log(
        `    ! ${a.file} — could be ${a.candidates
          .map((p) => `${p.sku} (${p.collection.name})`)
          .join(" or ")}`,
      );
    }
    if (ambiguous.length > 25) console.log(`    …and ${ambiguous.length - 25} more`);
    console.log("    Put the file in a brand folder, or rename it to the SKU.");
  }

  if (misfiled.length) {
    console.log(`\n  ${misfiled.length} file(s) sit in the wrong brand folder and were skipped:`);
    for (const m of misfiled.slice(0, 25)) {
      const who = m.candidates
        .map((p) => `${p.sku} (${p.collection.name})`)
        .join(" or ");
      console.log(`    ! ${m.file} — names ${who}, not a ${m.brandHint.toUpperCase()} product`);
    }
    if (misfiled.length > 25) console.log(`    …and ${misfiled.length - 25} more`);
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

    for (const f of ordered) {
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
