import "server-only";

import { Prisma } from "@prisma/client";

/**
 * Distinguishes "the database is not available" from "this query is wrong".
 *
 * Only infrastructure problems — server unreachable, credentials rejected,
 * schema not migrated yet — are treated as recoverable. A genuine query bug
 * must still surface as an error rather than being hidden behind empty data.
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return [
      "P1000", // authentication failed
      "P1001", // can't reach database server
      "P1002", // connection timed out
      "P1003", // database does not exist
      "P1010", // access denied
      "P1017", // server closed the connection
      "P2021", // table does not exist (not migrated yet)
      "P2022", // column does not exist (schema out of date)
    ].includes(error.code);
  }

  return false;
}

let warned = false;

function warnOnce() {
  if (warned) return;
  warned = true;
  console.warn(
    [
      "",
      "  ┌───────────────────────────────────────────────────────────────┐",
      "  │  Database not available — serving empty content.              │",
      "  │                                                               │",
      "  │  The site will render, but no products or content will show.  │",
      "  │                                                               │",
      "  │  To fix:                                                      │",
      "  │    1. Start MySQL (MySQL Server / XAMPP / Docker)             │",
      "  │    2. Check DATABASE_URL in .env                              │",
      "  │    3. npm run db:push                                         │",
      "  │    4. npm run db:seed                                         │",
      "  └───────────────────────────────────────────────────────────────┘",
      "",
    ].join("\n"),
  );
}

/**
 * Runs a read query, falling back to `fallback` when the database is
 * unavailable so public pages still render instead of hitting the error
 * boundary. Never use this for writes — a failed write must not look
 * like a successful one.
 */
export async function safeRead<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      warnOnce();
      return fallback;
    }
    throw error;
  }
}

/** True when the database cannot currently be reached. */
export async function isDatabaseReachable(): Promise<boolean> {
  const { default: prisma } = await import("@/lib/db/prisma");
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
