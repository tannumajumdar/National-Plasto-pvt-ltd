/**
 * Runs the whole end-to-end suite in order against a running dev server.
 *
 *   npm run dev          # in one terminal
 *   npm run e2e          # in another
 *
 * Requires E2E_HARNESS=1 in .env for the server-action suites, and a reachable
 * MySQL. Each suite simulates its own client IP so repeated runs are not
 * throttled by the auth rate limiter.
 */
import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE ?? "http://localhost:3000";

function run(file, env = {}, nodeArgs = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [...nodeArgs, file], {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

// The payment and email suites are pure unit tests over TypeScript modules:
// they need the tsx loader, and email.ts imports "server-only", which only
// resolves to a no-op under the react-server export condition.
const TSX_ARGS = ["--import", "tsx", "--conditions=react-server"];

function runTsx(file, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", file, ...args], { shell: true });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => process.stderr.write(d));
    child.on("exit", (code) => (code === 0 ? resolve(out) : reject(new Error(`${file} exited ${code}`))));
  });
}

async function main() {
  // Fail fast with a clear message rather than 60 confusing assertion errors.
  try {
    const res = await fetch(`${BASE}/api/auth/me`);
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    console.error(`\nNo dev server at ${BASE}. Start it with:  npm run dev\n`);
    process.exit(1);
  }

  const probe = await fetch(`${BASE}/api/e2e-harness`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "noop", args: [] }),
    redirect: "manual",
  });
  if (probe.status === 404) {
    console.error("\nThe action harness is disabled. Set E2E_HARNESS=\"1\" in .env and restart the dev server.\n");
    process.exit(1);
  }

  console.log("\nSeeding e2e fixtures…");
  const fixtureOut = await runTsx("scripts/e2e-fixtures.ts", ["reset"]);
  const products = JSON.parse(fixtureOut.trim().split("\n").pop()).products;

  const prisma = new PrismaClient();
  const unpriced = await prisma.product.findFirst({
    where: { price: null },
    select: { id: true },
  });
  await prisma.$disconnect();

  const suites = [
    ["scripts/e2e-http.mjs", { FIXTURES: JSON.stringify(products), UNPRICED_ID: unpriced?.id ?? "" }],
    ["scripts/e2e-actions.mjs", {}],
    ["scripts/e2e-reset.mjs", {}],
    ["scripts/e2e-categories.mjs", {}],
    ["scripts/e2e-payments.mjs", {}, TSX_ARGS],
    ["scripts/e2e-email.mjs", {}, TSX_ARGS],
    ["scripts/e2e-stores.mjs", {}, TSX_ARGS],
    ["scripts/e2e-theme.mjs", {}, TSX_ARGS],
    ["scripts/e2e-uploads.mjs", {}, TSX_ARGS],
    ["scripts/e2e-demo-journey.mjs", {}, []],
  ];

  const failures = [];
  for (const [file, env, nodeArgs] of suites) {
    console.log(`\n${"#".repeat(64)}\n# ${file}\n${"#".repeat(64)}`);
    const code = await run(file, env, nodeArgs);
    if (code !== 0) failures.push(file);
  }

  console.log(`\n${"=".repeat(64)}`);
  if (failures.length === 0) {
    console.log("ALL SUITES PASSED");
  } else {
    console.log(`FAILED SUITES: ${failures.join(", ")}`);
  }
  console.log("=".repeat(64));
  process.exit(failures.length ? 1 : 0);
}

main();
