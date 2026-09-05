/**
 * Brings the production database up to date with the catalogue in this repo.
 *
 *   node scripts/deploy-catalogue.mjs            # report only
 *   node scripts/deploy-catalogue.mjs --apply    # push schema, then seed
 *
 * Deploying the code is not enough on its own. Two things live outside git:
 * the schema (today's run added Category.parentId and the Product premium
 * flags — the new code cannot start without them) and the catalogue itself
 * (230 products, four brands, 34 categories), which was seeded into the local
 * database and has to be seeded into production separately.
 *
 * The connection string is read from a file, never from an argument, so it
 * stays out of shell history and process listings:
 *
 *   .env.production.local        DATABASE_URL="mysql://user:pass@host:port/db"
 *
 * That filename is already covered by .gitignore (.env*.local), so it cannot
 * be committed by accident.
 */
import { spawn } from "child_process";
import { readFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

const ENV_FILE = ".env.production.local";

/** Pulls DATABASE_URL out of a dotenv-style file without loading the rest. */
async function readDatabaseUrl(file) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    throw new Error(
      `Cannot read ${file}.\n\n` +
        `  Create it next to package.json with one line:\n\n` +
        `    DATABASE_URL="mysql://user:password@host:port/railway"\n\n` +
        `  Railway shows this under your MySQL service, Variables tab, as\n` +
        `  MYSQL_URL or DATABASE_URL. Use the PUBLIC url — the internal one\n` +
        `  (*.railway.internal) only resolves from inside Railway.`,
    );
  }

  const line = text
    .split(/\r?\n/)
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l) && !/^\s*#/.test(l));
  if (!line) throw new Error(`${file} has no DATABASE_URL line.`);

  const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  if (!value) throw new Error(`DATABASE_URL in ${file} is empty.`);
  return value;
}

/** host:port/database, with the password removed — safe to print. */
function describe(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "3306"}${u.pathname} as ${u.username}`;
  } catch {
    return "(unparseable URL)";
  }
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...env },
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)),
    );
  });
}

/** Columns today's schema change added. Their absence is what breaks the app. */
const REQUIRED_COLUMNS = [
  ["categories", "parentId"],
  ["products", "isPremium"],
  ["products", "isLimitedEdition"],
];

async function main() {
  const apply = process.argv.includes("--apply");
  const envFile = path.resolve(process.cwd(), ENV_FILE);
  const url = await readDatabaseUrl(envFile);

  console.log(`\nTarget : ${describe(url)}`);
  console.log(`Mode   : ${apply ? "APPLY — schema push, then seed" : "REPORT ONLY — nothing will be written"}`);
  console.log("-".repeat(66));

  const prisma = new PrismaClient({ datasourceUrl: url });

  /* ---------------- what is there now ---------------- */
  let present;
  try {
    const rows = await prisma.$queryRaw`
      SELECT TABLE_NAME AS t, COLUMN_NAME AS c
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
    `;
    present = new Set(rows.map((r) => `${r.t}.${r.c}`));
  } catch (e) {
    await prisma.$disconnect();
    throw new Error(
      `Could not reach the database.\n  ${e.message}\n\n` +
        `  If the host ends in .railway.internal it is only reachable from\n` +
        `  inside Railway — use the public host instead.`,
    );
  }

  const missing = REQUIRED_COLUMNS.filter(([t, c]) => !present.has(`${t}.${c}`));

  console.log("\nSchema");
  for (const [t, c] of REQUIRED_COLUMNS) {
    console.log(`  ${present.has(`${t}.${c}`) ? "ok     " : "MISSING"}  ${t}.${c}`);
  }

  /* Counts, guarded: an out-of-date schema still answers these. */
  console.log("\nContent");
  try {
    const [products, collections, categories, images] = await Promise.all([
      prisma.product.count(),
      prisma.collection.count(),
      prisma.category.count(),
      prisma.productImage.count(),
    ]);
    console.log(`  products    ${products}`);
    console.log(`  brands      ${collections}`);
    console.log(`  categories  ${categories}`);
    console.log(`  photographs ${images}`);

    if (products > 0) {
      const orders = await prisma.order.count();
      console.log(`  orders      ${orders}`);
      if (orders > 0) {
        console.log(
          "\n  Note: seeding retires products that are not on the current sheet.\n" +
            "  Order history is unaffected — order_items snapshot the name, slug\n" +
            "  and price, and their productId is ON DELETE SET NULL. Any prices or\n" +
            "  photographs an admin entered against a retired product DO go.",
        );
      }
    }
  } catch (e) {
    console.log(`  (counts unavailable: ${e.message.split("\n")[0]})`);
  }

  await prisma.$disconnect();

  console.log("\n" + "-".repeat(66));

  if (!apply) {
    console.log(
      missing.length
        ? `\n${missing.length} column(s) missing — the deployed app will error until the\n` +
            `schema is pushed. Re-run with --apply to push it and seed the catalogue.\n`
        : "\nSchema is current. Re-run with --apply to seed the catalogue.\n",
    );
    return;
  }

  /* ---------------- apply ---------------- */
  console.log("\n1/2  prisma db push\n");
  await run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    DATABASE_URL: url,
  });

  console.log("\n2/2  seed\n");
  await run("npx", ["tsx", "prisma/seed.ts"], { DATABASE_URL: url });

  console.log("\nDone. Photographs are a separate step — they are not in git:");
  console.log("  public/uploads/products  387 files, 58 MB\n");
}

main().catch((e) => {
  console.error("\n" + e.message + "\n");
  process.exit(1);
});
