/**
 * Changes an administrator's password.
 *
 *   npx tsx scripts/set-admin-password.ts                      # generate one
 *   npx tsx scripts/set-admin-password.ts 'YourPassw0rd'       # choose one
 *   npx tsx scripts/set-admin-password.ts 'YourPassw0rd' admin@example.com
 *
 * The password is hashed with the same bcrypt helper the login route uses, so
 * a password set here behaves exactly like one set through the UI. It is never
 * written to a file — a generated one is printed once and then only exists as
 * a hash.
 */
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

/** Mirrors the password rule in src/lib/validations: 8+, upper, lower, digit. */
function validate(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 72) return "Password must be at most 72 characters.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/\d/.test(password)) return "Include at least one number.";
  return null;
}

/** Ambiguous characters (O/0, l/1/I) are left out so it can be read aloud. */
function generate(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const pick = (set: string) => set[randomBytes(1)[0] % set.length];

  // Guarantee one of each required class, then fill and shuffle.
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 20) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

async function main() {
  const supplied = process.argv[2];
  const email = process.argv[3] ?? process.env.SEED_ADMIN_EMAIL ?? "admin@nationalplasto.com";

  const admin = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!admin) {
    console.error(`\nNo user found with email ${email}.`);
    console.error("Pass the address as the second argument, or run npm run db:seed first.\n");
    process.exit(1);
  }
  if (admin.role !== "ADMIN") {
    console.error(`\n${email} is not an administrator. Refusing to change it here.\n`);
    process.exit(1);
  }

  const generated = !supplied;
  const password = supplied ?? generate();

  const problem = validate(password);
  if (problem) {
    console.error(`\n${problem}\n`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      passwordHash: await hashPassword(password),
      // Any outstanding reset link for this account is now void.
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  console.log(`\nPassword updated for ${admin.email}.`);
  if (generated) {
    console.log("\n  " + password + "\n");
    console.log("Store this in a password manager now — it is not saved anywhere else,");
    console.log("and this is the only time it will be shown.");
  }
  console.log("\nSign in at /admin/login\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
