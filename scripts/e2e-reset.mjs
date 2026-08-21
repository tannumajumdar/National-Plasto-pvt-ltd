/**
 * Full password-reset cycle: issue → use → reuse → expiry.
 *
 * Run:  node scripts/e2e-reset.mjs
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE ?? "http://localhost:3000";
const prisma = new PrismaClient();
const RUN_IP = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

const results = [];
function check(label, condition, detail) {
  const passed = Boolean(condition);
  results.push({ label, passed, detail });
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${label}`);
  if (!passed && detail !== undefined) console.log(`        ${detail}`);
}

const post = async (path, body) => {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

async function main() {
  const stamp = Date.now().toString(36);
  const email = `e2e-reset-${stamp}@example.com`;
  const OLD = "OldPassw0rd";
  const NEW = "NewPassw0rd";

  console.log("\n=== Password reset cycle ===");

  const reg = await post("/api/auth/register", {
    name: "Reset Tester",
    email,
    password: OLD,
    confirmPassword: OLD,
  });
  check("test user registered", reg.status === 201, `got ${reg.status}`);

  const forgot = await post("/api/auth/forgot-password", { email });
  check("forgot-password 200", forgot.status === 200, `got ${forgot.status}`);
  check(
    "reports that email is not configured",
    forgot.json?.emailConfigured === false,
    JSON.stringify(forgot.json),
  );

  const link = forgot.json?.devResetLink;
  check("dev reset link returned outside production", Boolean(link), JSON.stringify(forgot.json));
  const token = link ? new URL(link).searchParams.get("token") : null;
  check("link carries a token", Boolean(token), link);

  const stored = await prisma.user.findUnique({
    where: { email },
    select: { resetToken: true, resetTokenExpiry: true },
  });
  check("token stored hashed, not in plaintext", stored?.resetToken !== token, "raw token found in DB!");
  check("token is a sha256 hex digest", /^[0-9a-f]{64}$/.test(stored?.resetToken ?? ""), stored?.resetToken);
  const ttlMin = stored?.resetTokenExpiry
    ? Math.round((stored.resetTokenExpiry.getTime() - Date.now()) / 60000)
    : 0;
  check(`expiry set ~60 min ahead (got ${ttlMin})`, ttlMin > 55 && ttlMin <= 61);

  const wrongToken = await post("/api/auth/reset-password", {
    token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    password: NEW,
    confirmPassword: NEW,
  });
  check("bogus token rejected 400", wrongToken.status === 400, `got ${wrongToken.status}`);

  const mismatch = await post("/api/auth/reset-password", {
    token,
    password: NEW,
    confirmPassword: "Different1",
  });
  check("mismatched confirmation rejected", mismatch.status === 422, `got ${mismatch.status}`);

  const weak = await post("/api/auth/reset-password", {
    token,
    password: "short",
    confirmPassword: "short",
  });
  check("weak new password rejected", weak.status === 422, `got ${weak.status}`);

  /* ---- expiry ---- */
  await prisma.user.update({
    where: { email },
    data: { resetTokenExpiry: new Date(Date.now() - 1000) },
  });
  const expired = await post("/api/auth/reset-password", {
    token,
    password: NEW,
    confirmPassword: NEW,
  });
  check("expired token rejected 400", expired.status === 400, `got ${expired.status}`);

  // Re-issue a fresh, valid token.
  const forgot2 = await post("/api/auth/forgot-password", { email });
  const token2 = new URL(forgot2.json.devResetLink).searchParams.get("token");
  check("second request issues a different token", token2 !== token);

  const done = await post("/api/auth/reset-password", {
    token: token2,
    password: NEW,
    confirmPassword: NEW,
  });
  check("valid token resets the password", done.status === 200, `got ${done.status} ${JSON.stringify(done.json)}`);

  const cleared = await prisma.user.findUnique({
    where: { email },
    select: { resetToken: true, resetTokenExpiry: true },
  });
  check("token cleared after use", cleared?.resetToken === null, JSON.stringify(cleared));
  check("expiry cleared after use", cleared?.resetTokenExpiry === null, JSON.stringify(cleared));

  const replay = await post("/api/auth/reset-password", {
    token: token2,
    password: "Replayed123",
    confirmPassword: "Replayed123",
  });
  check("token cannot be replayed", replay.status === 400, `got ${replay.status}`);

  const oldLogin = await post("/api/auth/login", { email, password: OLD });
  check("old password no longer works", oldLogin.status === 401, `got ${oldLogin.status}`);

  const newLogin = await post("/api/auth/login", { email, password: NEW });
  check("new password works", newLogin.status === 200, `got ${newLogin.status}`);

  await prisma.user.deleteMany({ where: { email } });

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL ${results.length}   PASS ${results.length - failed.length}   FAIL ${failed.length}`);
  if (failed.length) for (const f of failed) console.log(`  FAIL ${f.label}: ${f.detail ?? ""}`);
  console.log("=".repeat(60));
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("CRASHED:", e);
  await prisma.$disconnect();
  process.exit(2);
});
