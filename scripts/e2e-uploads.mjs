/**
 * Upload-storage tests.
 *
 * Covers both shapes of UPLOAD_DIR:
 *   "public/uploads"  — the default, served by Next's static handler
 *   "/abs/path"       — a mounted volume, served by the route handler
 *
 * The second is what a container host (Railway, Fly) needs, and the path
 * handling for it is easy to get subtly wrong — `path.join(cwd, "/data")`
 * silently writes inside the container instead of on the volume. These tests
 * exist because that failure is invisible until a redeploy eats the images.
 *
 * Run:  npx tsx --conditions=react-server scripts/e2e-uploads.mjs
 */
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const results = [];
let currentFlow = "";
function flow(n) {
  currentFlow = n;
  console.log(`\n=== ${n} ===`);
}
function check(label, condition, detail) {
  const passed = Boolean(condition);
  results.push({ flow: currentFlow, label, passed, detail });
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${label}`);
  if (!passed && detail !== undefined) console.log(`        ${detail}`);
}

let bust = 0;
const load = () => import(`../src/lib/storage/local.ts?v=${bust++}`);

async function main() {
  const projectRoot = process.cwd();

  /* ---------------- default: inside public/ ---------------- */
  flow("Default UPLOAD_DIR — inside public/, served statically");

  delete process.env.UPLOAD_DIR;
  let mod = await load();

  check(
    "root resolves inside the project",
    mod.uploadRoot() === path.resolve(projectRoot, "public/uploads"),
    mod.uploadRoot(),
  );
  check("not treated as external", mod.uploadsAreExternal() === false);
  check("URL prefix is /uploads", mod.UPLOAD_URL_PREFIX === "/uploads");
  check(
    "a URL maps back to the right file",
    mod.resolveUploadPath("/uploads/products/a.png") ===
      path.resolve(projectRoot, "public/uploads/products/a.png"),
    mod.resolveUploadPath("/uploads/products/a.png"),
  );

  /* ---------------- volume: absolute path outside the app ---------------- */
  flow("Absolute UPLOAD_DIR — a mounted volume outside the app");

  const volume = mkdtempSync(path.join(tmpdir(), "np-volume-"));
  process.env.UPLOAD_DIR = volume;
  mod = await load();

  check(
    "root resolves to the volume, NOT inside the project",
    mod.uploadRoot() === path.resolve(volume) && !mod.uploadRoot().startsWith(projectRoot),
    `${mod.uploadRoot()}  (project: ${projectRoot})`,
  );
  check(
    "recognised as external, so the route serves it",
    mod.uploadsAreExternal() === true,
    "if this were false the images would 404 on a volume",
  );
  check(
    "URL prefix stays /uploads so stored rows keep working",
    mod.UPLOAD_URL_PREFIX === "/uploads",
  );
  check(
    "a URL maps onto the volume",
    mod.resolveUploadPath("/uploads/products/a.png") ===
      path.resolve(volume, "products/a.png"),
    mod.resolveUploadPath("/uploads/products/a.png"),
  );

  // The bug this whole change exists to fix.
  check(
    "does NOT fall back to <project>/data-style paths",
    !mod.resolveUploadPath("/uploads/products/a.png").startsWith(projectRoot),
    "path.join(cwd, absolutePath) would have written inside the container",
  );

  /* ---------------- traversal ---------------- */
  flow("Path traversal is refused");

  const attacks = [
    "/uploads/../../../etc/passwd",
    "/uploads/products/../../../../secret.txt",
    "/uploads/%2e%2e%2f%2e%2e%2fetc/passwd",
    "/uploads/....//....//etc/passwd",
    "/uploads/products/..%2f..%2f.env",
  ];
  for (const attack of attacks) {
    const resolved = mod.resolveUploadPath(attack);
    const contained =
      resolved === null || resolved.startsWith(path.resolve(volume) + path.sep);
    check(`refused: ${attack.slice(0, 46)}`, contained, `resolved to ${resolved}`);
  }

  check("a URL outside /uploads is rejected", mod.resolveUploadPath("/etc/passwd") === null);
  check("an empty path is rejected", mod.resolveUploadPath("/uploads/") === null);
  check(
    "a sibling directory sharing the prefix is rejected",
    mod.resolveUploadPath("/uploads/../np-volume-evil/x.png") === null ||
      !mod.resolveUploadPath("/uploads/../np-volume-evil/x.png").includes("evil"),
  );

  /* ---------------- real write, then read back ---------------- */
  flow("Writing to a volume and reading it back");

  mkdirSync(path.join(volume, "products"), { recursive: true });
  writeFileSync(path.join(volume, "products", "demo.png"), Buffer.from([1, 2, 3]));

  const back = mod.resolveUploadPath("/uploads/products/demo.png");
  check("the written file resolves", back === path.resolve(volume, "products/demo.png"), back);

  rmSync(volume, { recursive: true, force: true });
  delete process.env.UPLOAD_DIR;

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL ${results.length}   PASS ${results.length - failed.length}   FAIL ${failed.length}`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  [${f.flow}] ${f.label}\n      ${f.detail ?? ""}`);
  }
  console.log("=".repeat(60));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("CRASHED:", e);
  process.exit(2);
});
