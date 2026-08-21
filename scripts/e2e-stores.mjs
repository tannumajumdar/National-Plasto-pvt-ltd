/**
 * Tests the client-side cart and wishlist stores.
 *
 * These are Zustand + `persist` stores that live in the browser, so the HTTP
 * suites cannot reach them. This runs them in Node against a fake
 * localStorage, which exercises the same code path the browser takes —
 * including rehydration and the `ready` flag the UI gates on.
 *
 * Run:  npx tsx --conditions=react-server scripts/e2e-stores.mjs
 */

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

/* ---------------- fake browser storage ---------------- */

function installStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  globalThis.localStorage = storage;
  if (!globalThis.window) globalThis.window = globalThis;
  globalThis.window.localStorage = storage;
  return map;
}

/** Zustand hydrates asynchronously; let the microtask queue drain. */
const settle = () => new Promise((r) => setTimeout(r, 20));

let bust = 0;
const freshCart = () => import(`../src/hooks/use-cart.ts?v=${bust++}`);
const freshWishlist = () => import(`../src/hooks/use-wishlist.ts?v=${bust++}`);

async function main() {
  /* ---------------- cart, empty storage ---------------- */
  flow("Cart — first visit (nothing stored)");

  let store = installStorage();
  let { useCart } = await freshCart();
  await settle();

  check("store starts empty", useCart.getState().lines.length === 0);
  check(
    "ready becomes true even with nothing in localStorage",
    useCart.getState().ready === true,
    "the cart page gates its whole render on `ready`; if this stays false the page shows a skeleton for ever",
  );

  useCart.getState().add("prod-a", 1);
  check("add() adds a line", useCart.getState().lines.length === 1, JSON.stringify(useCart.getState().lines));
  check(
    "line has the right shape",
    useCart.getState().lines[0]?.productId === "prod-a" && useCart.getState().lines[0]?.quantity === 1,
    JSON.stringify(useCart.getState().lines[0]),
  );

  useCart.getState().add("prod-a", 2);
  check("adding the same product increments", useCart.getState().lines[0]?.quantity === 3, JSON.stringify(useCart.getState().lines));

  useCart.getState().add("prod-b", 1);
  check("adding a second product appends", useCart.getState().lines.length === 2);

  useCart.getState().setQuantity("prod-a", 5);
  check("setQuantity updates", useCart.getState().lines.find((l) => l.productId === "prod-a")?.quantity === 5);

  useCart.getState().setQuantity("prod-a", 0);
  check("setQuantity(0) removes the line", useCart.getState().lines.length === 1);

  useCart.getState().add("prod-c", 200);
  check("quantity is capped at 99", useCart.getState().lines.find((l) => l.productId === "prod-c")?.quantity === 99);

  useCart.getState().remove("prod-c");
  check("remove() drops the line", !useCart.getState().lines.some((l) => l.productId === "prod-c"));

  await settle();
  const persisted = store.get("np-cart");
  check("state is written to localStorage", Boolean(persisted), `np-cart = ${persisted}`);
  check(
    "only `lines` is persisted, not `ready`",
    persisted ? !("ready" in JSON.parse(persisted).state) : false,
    persisted,
  );

  useCart.getState().clear();
  check("clear() empties the cart", useCart.getState().lines.length === 0);

  /* ---------------- cart, rehydrating ---------------- */
  flow("Cart — returning visit (rehydrates from localStorage)");

  installStorage({
    "np-cart": JSON.stringify({
      state: { lines: [{ productId: "saved-1", quantity: 4 }] },
      version: 1,
    }),
  });
  ({ useCart } = await freshCart());
  await settle();

  check("previous lines are restored", useCart.getState().lines.length === 1, JSON.stringify(useCart.getState().lines));
  check("restored quantity is right", useCart.getState().lines[0]?.quantity === 4);
  check("ready is true after rehydrating", useCart.getState().ready === true);

  /* ---------------- cart, corrupt storage ---------------- */
  flow("Cart — corrupt localStorage must not wedge the page");

  installStorage({ "np-cart": "{ this is not json" });
  ({ useCart } = await freshCart());
  await settle();
  check(
    "ready still becomes true with unparseable storage",
    useCart.getState().ready === true,
    "otherwise one bad value leaves every visitor staring at a skeleton",
  );
  check("lines fall back to empty", Array.isArray(useCart.getState().lines));

  /* ---------------- wishlist ---------------- */
  flow("Wishlist — first visit");

  store = installStorage();
  let { useWishlist } = await freshWishlist();
  await settle();

  check("starts empty", useWishlist.getState().ids.length === 0);
  check(
    "ready becomes true with nothing stored",
    useWishlist.getState().ready === true,
    "WishlistView renders a skeleton until `ready`; if it never flips, the page looks broken",
  );

  const added = useWishlist.getState().toggle("prod-a");
  check("toggle() returns true when adding", added === true);
  check("id is stored", useWishlist.getState().ids.includes("prod-a"));

  const removed = useWishlist.getState().toggle("prod-a");
  check("toggle() returns false when removing", removed === false);
  check("id is gone", !useWishlist.getState().ids.includes("prod-a"));

  useWishlist.getState().add("prod-b");
  useWishlist.getState().add("prod-b");
  check("add() is idempotent", useWishlist.getState().ids.filter((i) => i === "prod-b").length === 1);

  useWishlist.getState().remove("prod-b");
  check("remove() works", useWishlist.getState().ids.length === 0);

  useWishlist.getState().add("prod-c");
  await settle();
  check("wishlist persists to localStorage", Boolean(store.get("np-wishlist")), store.get("np-wishlist"));

  /* ---------------- wishlist, rehydrating ---------------- */
  flow("Wishlist — returning visit");

  installStorage({
    "np-wishlist": JSON.stringify({ state: { ids: ["saved-x", "saved-y"] }, version: 1 }),
  });
  ({ useWishlist } = await freshWishlist());
  await settle();

  check("saved ids are restored", useWishlist.getState().ids.length === 2, JSON.stringify(useWishlist.getState().ids));
  check("ready is true after rehydrating", useWishlist.getState().ready === true);

  installStorage({ "np-wishlist": "<<<corrupt>>>" });
  ({ useWishlist } = await freshWishlist());
  await settle();
  check("ready still true with corrupt storage", useWishlist.getState().ready === true);

  /* ---------------- summary ---------------- */
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
