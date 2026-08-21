/**
 * Connection tester for DATABASE_URL.
 *
 * Run this BEFORE deploying, from the machine that will actually run the app.
 * It answers the only question that matters at that point — "can this box
 * reach that database with those credentials?" — and names the likely cause
 * when it cannot.
 *
 *   npm run db:test                                  # uses .env
 *   npm run db:test -- 'mysql://user:pass@host:3306/db'
 */
import { PrismaClient } from "@prisma/client";

const url = process.argv[2] || process.env.DATABASE_URL;

if (!url) {
  console.error("\nUsage: npm run db:test -- 'mysql://user:pass@host:3306/db'\n");
  process.exit(1);
}

// Never print the password, even into a terminal the user trusts.
const safe = url.replace(/:\/\/([^:]+):[^@]*@/, "://$1:****@");
console.log(`\nConnecting to: ${safe}`);

const prisma = new PrismaClient({ datasources: { db: { url } } });

/** Prisma prefixes its errors with a banner; the useful sentence is further in. */
function explain(error) {
  const text = String(error?.message ?? error ?? "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("Invalid `prisma"));

  const detail = lines.find((l) => /error|denied|unknown|reach|refused|resolve|timed out/i.test(l));
  return detail ?? lines.pop() ?? String(error);
}

// Order matters — the first match wins, so the specific patterns come before
// the general ones. "mysql_native_password" contains the word "password", and
// would otherwise be misreported as bad credentials.
const HINTS = [
  [
    /plugin .* is not loaded|native_password/i,
    "MySQL 8.4 dropped mysql_native_password. Create the user with\n                caching_sha2_password, or the credentials are simply wrong —\n                MySQL reports both this way.",
  ],
  [/unknown database|does not exist/i, "the database does not exist yet — CREATE DATABASE first"],
  [/refused|can't reach|cannot reach|timed out/i, "wrong host or port, MySQL is not running, or a firewall is blocking it"],
  [/enotfound|resolve|getaddrinfo/i, "the hostname does not resolve — check for a typo"],
  [/denied|authentication/i, "username or password is wrong, or that user may not connect from this host"],
];

try {
  const [info] = await prisma.$queryRawUnsafe(
    "SELECT VERSION() AS version, DATABASE() AS db, USER() AS who",
  );
  const [tables] = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()",
  );

  console.log(`  OK   MySQL ${info.version}`);
  console.log(`       database : ${info.db ?? "(none selected)"}`);
  console.log(`       user     : ${info.who}`);
  console.log(`       tables   : ${tables.n}`);

  if (Number(tables.n) === 0) {
    console.log("\n  Connected, but the schema is empty. Run:  npx prisma migrate deploy");
  }
  console.log("\nConnection works.\n");
} catch (error) {
  const detail = explain(error);
  console.error(`\n  FAILED: ${detail}\n`);
  const hint = HINTS.find(([re]) => re.test(detail))?.[1];
  if (hint) console.error(`  Likely cause: ${hint}\n`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
