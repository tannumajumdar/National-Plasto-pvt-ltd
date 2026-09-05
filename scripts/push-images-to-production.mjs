/**
 * Sends the downloaded product photographs to a deployed site.
 *
 *   node scripts/push-images-to-production.mjs <folder>            # plan only
 *   node scripts/push-images-to-production.mjs <folder> --apply    # upload
 *
 *   --limit 50        stop after this many products (useful for a first pass)
 *   --replace         replace photographs a product already has
 *
 * The photographs live in `public/uploads/`, which .gitignore excludes, so a
 * deploy never carries them. Rather than reaching into the container, this
 * goes through the site's own admin upload endpoint: the file lands wherever
 * UPLOAD_DIR points — the Railway volume — and the row is then written
 * straight to the database over the public proxy.
 *
 * Files are named by SKU (NP-NXT-001.jpg, NP-NXT-001-2.jpg), which is how
 * scripts/fetch-drive-images.mjs writes them and the one key that is never
 * ambiguous: 53 products share a name with another brand.
 *
 * Credentials come from .env.production.local, never from an argument:
 *
 *   DATABASE_URL="mysql://…"
 *   SITE_URL="https://your-app.up.railway.app"
 *   ADMIN_EMAIL="admin@nationalplasto.com"
 *   ADMIN_PASSWORD="…"
 */
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

const ENV_FILE = ".env.production.local";

async function readEnv(file) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    throw new Error(`Cannot read ${file}.`);
  }
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m || /^\s*#/.test(line)) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function need(env, key, hint) {
  if (!env[key]) throw new Error(`${ENV_FILE} has no ${key}.\n  ${hint}`);
  return env[key];
}

/** Prisma's defaults assume a local database; this one is across the internet. */
function withPoolSettings(url) {
  try {
    const u = new URL(url);
    u.searchParams.set("connection_limit", "5");
    u.searchParams.set("pool_timeout", "60");
    u.searchParams.set("connect_timeout", "30");
    return u.toString();
  } catch {
    return url;
  }
}

/** NP-NXT-001.jpg -> { sku, order: 0 };  NP-NXT-001-2.jpg -> { sku, order: 1 } */
function parseName(file) {
  const base = path.basename(file, path.extname(file));
  const m = /^(NP-[A-Z]{3}-\d{3})(?:-(\d{1,2}))?$/.exec(base);
  if (!m) return null;
  return { sku: m[1], order: m[2] ? Number(m[2]) - 1 : 0 };
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const folder = process.argv[2];
  const apply = process.argv.includes("--apply");
  const replace = process.argv.includes("--replace");
  const limit = Number(arg("limit", "0")) || Infinity;

  if (!folder) {
    console.error(
      "\nUsage: node scripts/push-images-to-production.mjs <folder> [--apply]" +
        "\n       [--limit 50] [--replace]\n",
    );
    process.exit(1);
  }

  const env = await readEnv(path.resolve(process.cwd(), ENV_FILE));
  const dbUrl = need(env, "DATABASE_URL", "The Railway MySQL public URL.");
  const siteUrl = need(
    env,
    "SITE_URL",
    'e.g. SITE_URL="https://national-plasto-pvt-ltd-production.up.railway.app"',
  ).replace(/\/+$/, "");
  const adminEmail = need(env, "ADMIN_EMAIL", "The admin account to sign in as.");
  const adminPassword = need(env, "ADMIN_PASSWORD", "That account's password.");

  /* ---------------- what is on disk ---------------- */
  const bySku = new Map();
  for (const file of (await readdir(folder)).sort()) {
    const parsed = parseName(file);
    if (!parsed) continue;
    const absolute = path.join(folder, file);
    if (!(await stat(absolute)).isFile()) continue;
    const list = bySku.get(parsed.sku) ?? [];
    list.push({ file, absolute, order: parsed.order });
    bySku.set(parsed.sku, list);
  }
  for (const list of bySku.values()) list.sort((a, b) => a.order - b.order);

  /* ---------------- what production has ---------------- */
  const prisma = new PrismaClient({ datasourceUrl: withPoolSettings(dbUrl) });

  const products = await prisma.product.findMany({
    where: { sku: { in: [...bySku.keys()] } },
    select: { id: true, sku: true, name: true, _count: { select: { images: true } } },
  });
  const byId = new Map(products.map((p) => [p.sku, p]));

  const todo = [...bySku.entries()]
    .filter(([sku]) => byId.has(sku))
    .filter(([sku]) => replace || byId.get(sku)._count.images === 0)
    .slice(0, limit);

  const unknown = [...bySku.keys()].filter((sku) => !byId.has(sku));
  const files = todo.reduce((n, [, l]) => n + l.length, 0);

  console.log(`\nSource : ${path.resolve(folder)}`);
  console.log(`Site   : ${siteUrl}`);
  console.log(`Mode   : ${apply ? "APPLY" : "PLAN ONLY — nothing will be uploaded"}`);
  console.log("-".repeat(66));
  console.log(`  products with files locally : ${bySku.size}`);
  console.log(`  matched in production       : ${products.length}`);
  console.log(`  already have photographs    : ${products.filter((p) => p._count.images > 0).length}`);
  console.log(`  to upload now               : ${todo.length} products, ${files} files`);
  if (unknown.length) {
    console.log(`  SKUs not in production      : ${unknown.length} (${unknown.slice(0, 5).join(", ")}…)`);
  }

  if (!apply) {
    console.log("\nPlan only. Re-run with --apply to upload.\n");
    await prisma.$disconnect();
    return;
  }

  /* ---------------- sign in ---------------- */
  const login = await fetch(`${siteUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  if (!login.ok) {
    await prisma.$disconnect();
    throw new Error(
      `Sign-in failed: HTTP ${login.status}. Check ADMIN_EMAIL and ADMIN_PASSWORD.`,
    );
  }
  const cookie = (login.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");
  if (!cookie) {
    await prisma.$disconnect();
    throw new Error("Signed in but no session cookie came back.");
  }
  console.log(`\nSigned in as ${adminEmail}\n`);

  /* ---------------- upload ---------------- */
  let uploaded = 0;
  let failedFiles = 0;
  let done = 0;

  for (const [sku, list] of todo) {
    const product = byId.get(sku);
    const urls = [];

    for (const item of list) {
      try {
        const body = new FormData();
        const bytes = await readFile(item.absolute);
        body.append("file", new Blob([bytes], { type: "image/jpeg" }), item.file);
        body.append("folder", "products");
        body.append("slug", sku.toLowerCase());

        const res = await fetch(`${siteUrl}/api/upload`, {
          method: "POST",
          headers: { cookie },
          body,
        });
        const json = await res.json().catch(() => ({}));
        // The route answers { files: [{ url, bytes }], urls: ['/uploads/...'] }.
        const url = json?.urls?.[0];
        if (!res.ok || !url) throw new Error(json?.error ?? `HTTP ${res.status}`);

        urls.push(url);
        uploaded++;
      } catch (e) {
        failedFiles++;
        console.log(`  ! ${sku} ${item.file}: ${e.message}`);
      }
    }

    if (urls.length) {
      await prisma.$transaction(async (tx) => {
        if (replace) await tx.productImage.deleteMany({ where: { productId: product.id } });
        await tx.productImage.createMany({
          data: urls.map((url, i) => ({
            productId: product.id,
            url,
            alt: product.name,
            sortOrder: i,
          })),
        });
      });
    }

    done++;
    if (done % 10 === 0) process.stdout.write(`\r  ${done}/${todo.length} products…   `);
  }

  const covered = await prisma.product.count({ where: { images: { some: {} } } });
  const total = await prisma.product.count();

  console.log(`\r  uploaded ${uploaded} file(s)${failedFiles ? `, ${failedFiles} failed` : ""}      `);
  console.log(`\nProduction now has photographs on ${covered} of ${total} products.\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("\n" + e.message + "\n");
  process.exit(1);
});
