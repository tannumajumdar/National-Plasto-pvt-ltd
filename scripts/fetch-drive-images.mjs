/**
 * Pulls product photographs out of a public Google Drive folder.
 *
 *   node scripts/fetch-drive-images.mjs <folderId> <outDir>            # plan only
 *   node scripts/fetch-drive-images.mjs <folderId> <outDir> --apply    # download
 *
 *   --size w1600        Drive's resized copy (default). w2048, w2560 … or
 *                       "original" for the full 4 MB camera file.
 *   --per-product 3     how many photographs to take from each folder
 *   --concurrency 4     parallel downloads; higher trips Drive's rate limit
 *   --refresh           re-walk Drive instead of reusing <outDir>/_manifest.json
 *
 * The shoot is filed as BRAND / CATEGORY / PRODUCT / IMG_1234.JPG, sometimes a
 * couple of levels deeper, so the PRODUCT NAME IS A FOLDER, never a filename.
 * This walks the tree, works out which catalogue product each folder is, and
 * writes the chosen photographs out named by SKU:
 *
 *   NP-NXT-001.jpg  NP-NXT-001-2.jpg  NP-NXT-001-3.jpg
 *
 * Then `scripts/import-product-images.ts` puts them in the database — it
 * matches on SKU, which is the one key that is never ambiguous.
 *
 * Nothing is downloaded and nothing is written until you pass --apply.
 */
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const BRAND_FOLDER = {
  NEXT: "next",
  NATIONAL: "national",
  SAPPHIRE: "national-sapphire",
  "NATIONAL SAPPHIRE": "national-sapphire",
  CAPTAIN: "captain",
};

/**
 * An archive of superseded photography that mirrors the whole catalogue one
 * level down. Its shots are older than the ones in the live brand folders, and
 * including it would have every product matched twice.
 */
const EXCLUDE_PATHS = [/(^|\/)OLD NATIONAL(\/|$)/i];

/** Folder names that carry no product information. */
const NOISE = /^(new folder|copy|\d+|img|images|photos?|final|edit(ed)?|raw|jpg|jpeg)$/i;

/** Words appended to a folder name that are not part of the product name. */
const TRAILING_TAG =
  /\s+(CAP|NAT|NSP|SAP|SAPH|VNAT|PRM|PREMIUM|HEAVYDUTY|NEXT|NATIONAL|SAPPHIRE|CAPTAIN|CHAIR|CHAIRS|STOOL|STOOLS|TABLE|TABLES|PREMIUM STOOL)$/;

function norm(s) {
  return s
    .toUpperCase()
    // The shoot spells the deluxe line several ways; the catalogue says DLX.
    .replace(/S\.?\s*DLX\b/g, "SUPER DLX")
    .replace(/SUPER\s*(DELEXUE|DELUXE|DELEX)\b/g, "SUPER DLX")
    .replace(/\s*-\s*COPY$/, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function stripTags(s) {
  let out = s;
  for (let i = 0; i < 4; i++) {
    const next = out.replace(TRAILING_TAG, "").trim();
    if (next === out || next === "") break;
    out = next;
  }
  return out;
}

/* ------------------------------------------------------------------
   Drive
   ------------------------------------------------------------------ */

function decodeBlob(raw) {
  const unescaped = raw
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // Drive escapes characters JSON does not know (\= inside URLs). Drop any
  // backslash that is not a valid JSON escape, then parse.
  return JSON.parse(unescaped.replace(/\\(?!["\\/bfnrtu])/g, ""));
}

async function listFolder(id, attempt = 0) {
  const res = await fetch(`https://drive.google.com/drive/folders/${id}`, {
    headers: { "User-Agent": UA },
  });
  const html = await res.text();
  const m = /window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/.exec(html);
  if (!m) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      return listFolder(id, attempt + 1);
    }
    throw new Error(
      `Cannot read folder ${id} (HTTP ${res.status}). Is the link set to "Anyone with the link"?`,
    );
  }
  const rows = decodeBlob(m[1])[0] ?? [];
  return rows.map((r) => ({ id: r[0], name: r[2], mime: r[3], bytes: Number(r[13] ?? 0) }));
}

async function walkDrive(rootId) {
  const files = [];
  let folderCount = 0;

  async function walk(id, trail) {
    for (const c of await listFolder(id)) {
      const p = [...trail, c.name];
      if (c.mime === "application/vnd.google-apps.folder") {
        folderCount++;
        if (folderCount % 25 === 0) process.stdout.write(`\r  walked ${folderCount} folders…`);
        await walk(c.id, p);
      } else if (/^image\//.test(c.mime)) {
        files.push({ id: c.id, bytes: c.bytes, path: p.join("/") });
      }
    }
  }

  await walk(rootId, []);
  process.stdout.write(`\r  walked ${folderCount} folders, found ${files.length} images\n`);
  return files;
}

/* ------------------------------------------------------------------
   Matching
   ------------------------------------------------------------------ */

function buildIndex(products) {
  const byBrand = new Map();
  for (const p of products) {
    const list = byBrand.get(p.collection.slug) ?? [];
    list.push({ ...p, key: norm(p.name) });
    byBrand.set(p.collection.slug, list);
  }
  return byBrand;
}

/**
 * Resolves one folder path to a product.
 *
 * Segments are tried deepest first, so CHEETAH/SHINNY resolves on CHEETAH once
 * SHINNY finds nothing, and WARDROBE/NEXT IMAGINE SERIES/ATOM 2FT resolves on
 * ATOM 2FT rather than on the series it sits in. Only the brand's own products
 * are ever considered.
 */
function resolve(segments, candidates) {
  const meaningful = segments.filter((s) => !NOISE.test(s.trim()));

  for (let i = meaningful.length - 1; i >= 0; i--) {
    const raw = norm(meaningful[i]);
    if (!raw) continue;
    const bare = stripTags(raw);

    const hit =
      candidates.find((c) => c.key === raw) ??
      candidates.find((c) => c.key === bare) ??
      // "OLD IMPERIAL RRK" is the shoot's word for Imperial RRK; accepted only
      // when the unprefixed form matches and the prefixed one does not, so
      // Old Florence and New Florence are never collapsed into Florence.
      (/^(OLD|NEW) /.test(bare) && !candidates.some((c) => c.key === bare)
        ? candidates.find((c) => c.key === bare.replace(/^(OLD|NEW) /, ""))
        : null);

    if (hit) return { product: hit, on: meaningful[i], how: "exact" };
  }
  return null;
}

/* ------------------------------------------------------------------
   Main
   ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * The two ways to read a public Drive image.
 *
 * lh3 is the CDN the Drive UI itself renders thumbnails from, and it serves
 * bulk traffic happily; drive.google.com/thumbnail starts refusing connections
 * after a couple of hundred requests. Same bytes from both, so the CDN leads
 * and the Drive host is only a fallback.
 */
function urlsFor(id, size) {
  if (size === "original") {
    return [`https://drive.usercontent.google.com/download?id=${id}&export=download`];
  }
  return [
    `https://lh3.googleusercontent.com/d/${id}=${size}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=${size}`,
  ];
}

/**
 * Fetches one image, falling back to the second host and then retrying with a
 * growing pause. Returns null on success, else a message.
 */
async function download(urls, target, attempts = 3) {
  let last = "unknown error";

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt) await sleep(1000 * 2 ** (attempt - 1));

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        if (res.status === 429 || res.status >= 500) {
          last = `HTTP ${res.status}`;
          continue;
        }
        if (!res.ok) {
          last = `HTTP ${res.status}`;
          continue;
        }

        const buf = Buffer.from(await res.arrayBuffer());
        // A rate limit or a permission problem comes back as an HTML page with
        // a 200, so check the bytes rather than trusting the status.
        if (buf.length < 1024 || buf[0] !== 0xff || buf[1] !== 0xd8) {
          last = "not a JPEG (rate limited?)";
          continue;
        }

        await writeFile(target, buf);
        return null;
      } catch (e) {
        last = e.cause?.code ?? e.message;
      }
    }
  }

  return last;
}

/** Runs `worker` over `items`, `limit` at a time. */
async function pool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const folderId = process.argv[2];
  const outDir = process.argv[3];
  const apply = process.argv.includes("--apply");
  const refresh = process.argv.includes("--refresh");
  const size = arg("size", "w1600");
  const perProduct = Number(arg("per-product", "3"));
  const concurrency = Number(arg("concurrency", "4"));

  if (!folderId || !outDir) {
    console.error(
      "\nUsage: node scripts/fetch-drive-images.mjs <folderId> <outDir> [--apply]" +
        "\n       [--size w1600|w2048|original] [--per-product 3] [--refresh]\n",
    );
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const manifestPath = path.join(outDir, "_manifest.json");

  let files;
  if (!refresh) {
    try {
      files = JSON.parse(await readFile(manifestPath, "utf8"));
      console.log(`Reusing ${manifestPath} (${files.length} images). --refresh to re-walk.`);
    } catch {
      /* fall through to a walk */
    }
  }
  if (!files) {
    console.log("Walking Drive…");
    files = await walkDrive(folderId);
    await writeFile(manifestPath, JSON.stringify(files));
  }

  const products = await prisma.product.findMany({
    select: { name: true, sku: true, collection: { select: { slug: true, name: true } } },
  });
  const byBrand = buildIndex(products);

  /* Group images by the folder that holds them, then resolve each folder. */
  const groups = new Map(); // folder path -> images
  let excluded = 0;
  for (const f of files) {
    if (EXCLUDE_PATHS.some((re) => re.test(f.path))) {
      excluded++;
      continue;
    }
    const dir = f.path.split("/").slice(0, -1).join("/");
    const list = groups.get(dir) ?? [];
    list.push(f);
    groups.set(dir, list);
  }

  const perSku = new Map(); // sku -> { product, images }
  const unresolved = [];

  for (const [dir, images] of [...groups].sort()) {
    const segments = dir.split("/");
    const brandSlug = BRAND_FOLDER[segments[0]?.toUpperCase()];
    if (!brandSlug) {
      unresolved.push({ dir, count: images.length, why: "unknown brand folder" });
      continue;
    }

    const hit = resolve(segments.slice(1), byBrand.get(brandSlug) ?? []);
    if (!hit) {
      unresolved.push({ dir, count: images.length, why: "no product of that name in this brand" });
      continue;
    }

    const entry = perSku.get(hit.product.sku) ?? { product: hit.product, images: [] };
    entry.images.push(...images);
    perSku.set(hit.product.sku, entry);
  }

  // Filename order is shoot order, which puts the straight-on shots first.
  for (const entry of perSku.values()) {
    entry.images.sort((a, b) => a.path.localeCompare(b.path));
    entry.chosen = entry.images.slice(0, perProduct);
  }

  const chosenCount = [...perSku.values()].reduce((n, e) => n + e.chosen.length, 0);
  const bytes = [...perSku.values()].reduce(
    (n, e) => n + e.chosen.reduce((m, i) => m + i.bytes, 0),
    0,
  );

  console.log(`\nimages in Drive        : ${files.length}`);
  if (excluded) console.log(`skipped (archive)      : ${excluded}`);
  console.log(`folders resolved       : ${groups.size - unresolved.length} of ${groups.size}`);
  console.log(`catalogue covered      : ${perSku.size} of ${products.length} products`);
  console.log(`photographs to take    : ${chosenCount} (${perProduct} per product, ${size})`);
  if (size === "original") {
    console.log(`download size          : ~${(bytes / 1024 / 1024).toFixed(0)} MB`);
  }

  const missing = products.filter((p) => !perSku.has(p.sku));
  console.log(`\nproducts with no photographs: ${missing.length}`);
  const perBrand = new Map();
  for (const p of missing) perBrand.set(p.collection.name, (perBrand.get(p.collection.name) ?? 0) + 1);
  for (const [b, n] of perBrand) console.log(`  ${b.padEnd(20)} ${n}`);

  if (!apply) {
    console.log("\nPlan only. Re-run with --apply to download.\n");
    await prisma.$disconnect();
    return;
  }

  /* ---------------- download ---------------- */
  console.log("\nDownloading…");
  let done = 0;
  let failed = 0;

  let skipped = 0;

  const jobs = [];
  for (const [sku, entry] of perSku) {
    for (const [i, image] of entry.chosen.entries()) {
      jobs.push({
        sku,
        index: i + 1,
        id: image.id,
        target: path.join(outDir, i === 0 ? `${sku}.jpg` : `${sku}-${i + 1}.jpg`),
      });
    }
  }

  // Drive starts serving HTML instead of JPEGs when pushed hard. Four at a
  // time with a short gap gets everything through in one pass; eight does not.
  await pool(jobs, concurrency, async (job) => {
    // Resume: a re-run after a rate limit should not re-fetch what it has.
    if (await exists(job.target)) {
      skipped++;
      return;
    }

    await sleep(250);
    const urls = urlsFor(job.id, size);
    const err = await download(urls, job.target);
    if (err) {
      failed++;
      // The URL goes in the message on purpose: when a download fails the next
      // question is always "does that link work in a browser?", and without it
      // there is no way to tell a bad file id from a throttled host.
      console.log(`  ! ${job.sku} image ${job.index}: ${err}  ${urls[0]}`);
    } else {
      done++;
    }

    if ((done + skipped) % 20 === 0) {
      process.stdout.write(`\r  ${done + skipped}/${chosenCount}…   `);
    }
  });

  if (skipped) console.log(`\r  ${skipped} already present, left alone       `);

  console.log(`\r  downloaded ${done} file(s)${failed ? `, ${failed} failed` : ""}      `);
  console.log(`\nWritten to ${path.resolve(outDir)}`);
  console.log("Next:");
  console.log(`  npx tsx scripts/import-product-images.ts "${outDir}"          # check`);
  console.log(`  npx tsx scripts/import-product-images.ts "${outDir}" --apply  # write\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n" + e.message + "\n");
  await prisma.$disconnect();
  process.exit(1);
});
