/**
 * End-to-end HTTP flow harness.
 *
 * Drives the running dev server the way a browser would: real cookies, real
 * middleware, real database. Every assertion below has actually been executed
 * against MySQL — nothing here is a mock.
 *
 * Run:  node scripts/e2e-http.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* Tiny cookie-jar client                                              */
/* ------------------------------------------------------------------ */

/**
 * Each harness run presents a distinct X-Forwarded-For, so repeated runs are
 * not throttled as though they came from one browser. The rate limiter itself
 * is tested explicitly in flow 9.
 */
const RUN_IP = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

// Overridable so the suite keeps working after the seeded password is changed.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@nationalplasto.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@12345";

class Client {
  constructor(name) {
    this.name = name;
    this.jar = new Map();
  }

  cookieHeader() {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  absorb(res) {
    const raw = res.headers.getSetCookie?.() ?? [];
    for (const c of raw) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      if (v === "" || /Max-Age=0/i.test(c)) this.jar.delete(k);
      else this.jar.set(k, v);
    }
  }

  async req(method, path, body, opts = {}) {
    const headers = { cookie: this.cookieHeader(), "x-forwarded-for": opts.ip ?? RUN_IP };
    let payload;
    if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: payload,
      redirect: opts.redirect ?? "manual",
    });
    this.absorb(res);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* html response */
    }
    return { status: res.status, json, text, headers: res.headers };
  }

  get(p, o) {
    return this.req("GET", p, undefined, o);
  }
  post(p, b, o) {
    return this.req("POST", p, b, o);
  }
  patch(p, b, o) {
    return this.req("PATCH", p, b, o);
  }
  del(p, b, o) {
    return this.req("DELETE", p, b, o);
  }
}

/* ------------------------------------------------------------------ */
/* Assertions                                                          */
/* ------------------------------------------------------------------ */

const results = [];
let currentFlow = "";

function flow(name) {
  currentFlow = name;
  console.log(`\n=== ${name} ===`);
}

function check(label, condition, detail) {
  const passed = Boolean(condition);
  results.push({ flow: currentFlow, label, passed, detail });
  const mark = passed ? "  PASS" : "  FAIL";
  console.log(`${mark}  ${label}${passed || detail === undefined ? "" : `\n        ${detail}`}`);
  return passed;
}

/* ------------------------------------------------------------------ */

const stamp = Date.now().toString(36);
const USER = {
  name: "E2E Tester",
  email: `e2e-user-${stamp}@example.com`,
  phone: "9830123456",
  password: "Passw0rdTest",
  confirmPassword: "Passw0rdTest",
};

const PRODUCTS = JSON.parse(process.env.FIXTURES ?? "{}");
const A = PRODUCTS["ZZTEST-A"];
const B = PRODUCTS["ZZTEST-B"];
const C = PRODUCTS["ZZTEST-C"];

const ADDRESS = {
  customerName: "E2E Tester",
  customerEmail: USER.email,
  customerPhone: "9830123456",
  line1: "12 Test Street, Behala",
  city: "Kolkata",
  state: "West Bengal",
  pincode: "700034",
  paymentMethod: "COD",
};

async function main() {
  const guest = new Client("guest");
  const user = new Client("user");
  const admin = new Client("admin");

  /* ---------------- 1. Registration & session ---------------- */
  flow("1. Register / login / logout / session");

  const badReg = await user.post("/api/auth/register", { ...USER, password: "weak", confirmPassword: "weak" });
  check("weak password rejected (422/400)", badReg.status >= 400 && badReg.status < 500, `got ${badReg.status}`);

  const reg = await user.post("/api/auth/register", USER);
  check("register returns 201", reg.status === 201, `got ${reg.status} ${reg.text.slice(0, 200)}`);
  check("register sets session cookie", user.jar.size > 0, `jar=${[...user.jar.keys()]}`);

  const me1 = await user.get("/api/auth/me");
  check("session resolves after register", me1.json?.user?.email === USER.email, JSON.stringify(me1.json));

  const dup = await new Client("dup").post("/api/auth/register", USER);
  check("duplicate email rejected 409", dup.status === 409, `got ${dup.status}`);

  const logout = await user.post("/api/auth/logout");
  check("logout returns 200", logout.status === 200, `got ${logout.status}`);
  const me2 = await user.get("/api/auth/me");
  check("session cleared after logout", me2.json?.user === null, JSON.stringify(me2.json));

  const badLogin = await user.post("/api/auth/login", { email: USER.email, password: "WrongPass1" });
  check("wrong password rejected 401", badLogin.status === 401, `got ${badLogin.status}`);

  const unknownLogin = await user.post("/api/auth/login", { email: `nobody-${stamp}@example.com`, password: "WrongPass1" });
  check(
    "unknown email gives same 401 (no enumeration)",
    unknownLogin.status === 401 && unknownLogin.json?.error === badLogin.json?.error,
    `${unknownLogin.status} / ${unknownLogin.json?.error} vs ${badLogin.json?.error}`,
  );

  const login = await user.post("/api/auth/login", { email: USER.email, password: USER.password });
  check("login returns 200", login.status === 200, `got ${login.status} ${login.text.slice(0, 200)}`);
  const me3 = await user.get("/api/auth/me");
  check("session persists after login", me3.json?.user?.email === USER.email, JSON.stringify(me3.json));
  check("registered user has role USER", me3.json?.user?.role === "USER", JSON.stringify(me3.json?.user));

  /* ---------------- 2. Middleware guards ---------------- */
  flow("2. Middleware guards");

  const anon = new Client("anon");
  const gAccount = await anon.get("/account");
  check(
    "anonymous /account redirects to /login",
    gAccount.status === 307 && (gAccount.headers.get("location") ?? "").includes("/login"),
    `${gAccount.status} -> ${gAccount.headers.get("location")}`,
  );

  const gCheckout = await anon.get("/checkout");
  check(
    "anonymous /checkout redirects to /login",
    gCheckout.status === 307 && (gCheckout.headers.get("location") ?? "").includes("/login"),
    `${gCheckout.status} -> ${gCheckout.headers.get("location")}`,
  );

  const gAdmin = await anon.get("/admin");
  check(
    "anonymous /admin redirects to /admin/login",
    gAdmin.status === 307 && (gAdmin.headers.get("location") ?? "").includes("/admin/login"),
    `${gAdmin.status} -> ${gAdmin.headers.get("location")}`,
  );

  const uAdmin = await user.get("/admin");
  check(
    "non-admin USER blocked from /admin",
    uAdmin.status === 307 && (uAdmin.headers.get("location") ?? "").includes("error=forbidden"),
    `${uAdmin.status} -> ${uAdmin.headers.get("location")}`,
  );

  const uAccount = await user.get("/account");
  check("signed-in /account returns 200", uAccount.status === 200, `got ${uAccount.status}`);

  const adminLoginPage = await anon.get("/admin/login");
  check("/admin/login reachable anonymously", adminLoginPage.status === 200, `got ${adminLoginPage.status}`);

  /* ---------------- 3. Guest cart → merge → clamp ---------------- */
  flow("3. Guest cart merge and stock clamping");

  const resolveGuest = await guest.post("/api/cart/resolve", {
    lines: [
      { productId: A, quantity: 2 },
      { productId: B, quantity: 99 },
    ],
  });
  const gl = resolveGuest.json?.lines ?? [];
  check("resolve returns both lines", gl.length === 2, JSON.stringify(resolveGuest.json).slice(0, 300));
  const lineB = gl.find((l) => l.productId === B);
  check("quantity clamped to stock (99 -> 3)", lineB?.quantity === 3, `got ${lineB?.quantity}`);
  const lineA = gl.find((l) => l.productId === A);
  check("server supplies price, not client (A = 150000 paise)", lineA?.unitPrice === 150000, `got ${lineA?.unitPrice}`);

  const untracked = await guest.post("/api/cart/resolve", { lines: [{ productId: C, quantity: 40 }] });
  check(
    "untracked-stock product not clamped",
    untracked.json?.lines?.[0]?.quantity === 40,
    JSON.stringify(untracked.json?.lines),
  );

  const unpriced = await guest.post("/api/cart/resolve", { lines: [{ productId: A, quantity: 1 }] });
  check("totals computed", unpriced.json?.totals?.subtotal === 150000, JSON.stringify(unpriced.json?.totals));
  check(
    "shipping ₹99 below ₹2000 threshold",
    unpriced.json?.totals?.shipping === 9900,
    JSON.stringify(unpriced.json?.totals),
  );

  const syncAnon = await new Client("x").post("/api/cart/sync", { lines: [{ productId: A, quantity: 1 }] });
  check("cart sync requires auth (401)", syncAnon.status === 401, `got ${syncAnon.status}`);

  const sync1 = await user.post("/api/cart/sync", { lines: [{ productId: A, quantity: 2 }] });
  check("cart sync 200", sync1.status === 200, `got ${sync1.status} ${sync1.text.slice(0, 200)}`);
  check("cart sync stored 1 line", sync1.json?.lines?.length === 1, JSON.stringify(sync1.json));

  const sync2 = await user.post("/api/cart/sync", {
    lines: [
      { productId: A, quantity: 1 },
      { productId: B, quantity: 2 },
    ],
  });
  const merged = sync2.json?.lines ?? [];
  const mA = merged.find((l) => l.productId === A);
  check("merge keeps the larger quantity (2 vs 1 -> 2)", mA?.quantity === 2, JSON.stringify(merged));
  check("merge adds the new product", merged.length === 2, JSON.stringify(merged));

  const syncBogus = await user.post("/api/cart/sync", {
    lines: [
      { productId: A, quantity: 1 },
      { productId: "does-not-exist", quantity: 5 },
    ],
  });
  check(
    "unknown product dropped from merge",
    (syncBogus.json?.lines ?? []).every((l) => l.productId !== "does-not-exist"),
    JSON.stringify(syncBogus.json?.lines),
  );

  /* ---------------- 4. Checkout ---------------- */
  flow("4. Checkout / order creation / stock deduction");

  const orderAnon = await new Client("y").post("/api/orders", { ...ADDRESS, lines: [{ productId: A, quantity: 1 }] });
  check("checkout requires auth (401)", orderAnon.status === 401, `got ${orderAnon.status}`);

  // ZZTEST-D is the fixture that has no price. Deliberately not a catalogue
  // product: demo prices may have been applied to all of those.
  const unpricedOrder = await user.post("/api/orders", {
    ...ADDRESS,
    lines: [{ productId: PRODUCTS["ZZTEST-D"] ?? process.env.UNPRICED_ID, quantity: 1 }],
  });
  check(
    "unpriced catalogue product cannot be ordered",
    unpricedOrder.status === 409,
    `got ${unpricedOrder.status} ${unpricedOrder.text.slice(0, 200)}`,
  );

  const razorpay = await user.post("/api/orders", {
    ...ADDRESS,
    paymentMethod: "RAZORPAY",
    lines: [{ productId: A, quantity: 1 }],
  });
  check(
    "RAZORPAY rejected while PAYMENTS_ENABLED=false",
    razorpay.status === 400,
    `got ${razorpay.status} ${razorpay.text.slice(0, 200)}`,
  );

  const overStock = await user.post("/api/orders", { ...ADDRESS, lines: [{ productId: B, quantity: 99 }] });
  check(
    "over-stock order rejected 409 (clamp mismatch)",
    overStock.status === 409,
    `got ${overStock.status} ${overStock.text.slice(0, 200)}`,
  );

  const order = await user.post("/api/orders", {
    ...ADDRESS,
    lines: [
      { productId: A, quantity: 2 },
      { productId: B, quantity: 1 },
    ],
  });
  check("order created 201", order.status === 201, `got ${order.status} ${order.text.slice(0, 300)}`);
  const orderNumber = order.json?.order?.orderNumber;
  check("order number returned", Boolean(orderNumber), JSON.stringify(order.json));
  // 2 * 150000 + 1 * 250000 = 550000 paise = ₹5500 -> free shipping
  check(
    "total correct in paise (550000, free shipping)",
    order.json?.order?.total === 550000,
    `got ${order.json?.order?.total}`,
  );
  check("requiresPayment false for COD", order.json?.requiresPayment === false, JSON.stringify(order.json));

  console.log(
    JSON.stringify({ __ORDER__: { orderNumber, id: order.json?.order?.id, email: USER.email } }),
  );

  /* ---------------- 5. Forgot password ---------------- */
  flow("5. Forgot password");

  const forgot = await new Client("z").post("/api/auth/forgot-password", { email: USER.email });
  check("forgot-password returns 200", forgot.status === 200, `got ${forgot.status} ${forgot.text.slice(0, 200)}`);

  const forgotUnknown = await new Client("z2").post("/api/auth/forgot-password", {
    email: `ghost-${stamp}@example.com`,
  });
  check(
    "unknown email gives same response (no enumeration)",
    forgotUnknown.status === forgot.status,
    `${forgotUnknown.status} vs ${forgot.status}`,
  );

  const badToken = await new Client("z3").post("/api/auth/reset-password", {
    token: "not-a-real-token",
    password: "Passw0rdNew1",
    confirmPassword: "Passw0rdNew1",
  });
  check("invalid reset token rejected", badToken.status >= 400, `got ${badToken.status}`);

  /* ---------------- 6. Reviews ---------------- */
  flow("6. Reviews");

  const reviewAnon = await new Client("r").post("/api/reviews", { productId: A, rating: 5, body: "Great" });
  check("review requires auth", reviewAnon.status === 401, `got ${reviewAnon.status}`);

  const review = await user.post("/api/reviews", {
    productId: A,
    rating: 5,
    title: "Solid",
    body: "Held up well in testing.",
  });
  check("review submitted", review.status === 200 || review.status === 201, `got ${review.status} ${review.text.slice(0, 250)}`);

  const dupReview = await user.post("/api/reviews", { productId: A, rating: 3, body: "Second attempt" });
  check(
    "duplicate review handled (not a 500)",
    dupReview.status < 500,
    `got ${dupReview.status} ${dupReview.text.slice(0, 200)}`,
  );

  const badRating = await user.post("/api/reviews", { productId: A, rating: 9 });
  check("rating out of range rejected", badRating.status >= 400 && badRating.status < 500, `got ${badRating.status}`);

  /* ---------------- 7. Admin login ---------------- */
  flow("7. Admin login");

  const adminLogin = await admin.post("/api/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  check("admin login 200", adminLogin.status === 200, `got ${adminLogin.status} ${adminLogin.text.slice(0, 200)}`);
  check("admin role ADMIN", adminLogin.json?.user?.role === "ADMIN", JSON.stringify(adminLogin.json?.user));

  const adminDash = await admin.get("/admin");
  check("admin reaches /admin", adminDash.status === 200, `got ${adminDash.status}`);

  for (const path of [
    "/admin/products",
    "/admin/orders",
    "/admin/collections",
    "/admin/reviews",
    "/admin/customers",
    "/admin/content",
    "/admin/settings",
  ]) {
    const r = await admin.get(path);
    check(`admin page ${path} renders`, r.status === 200, `got ${r.status}`);
  }

  /* ---------------- 8. Public pages ---------------- */
  flow("8. Public pages against real data");

  for (const path of ["/", "/products", "/collections", "/about", "/contact", "/collections/next"]) {
    const r = await anon.get(path);
    check(`public page ${path} renders`, r.status === 200, `got ${r.status}`);
  }

  const productPage = await anon.get("/products/avenger-national");
  check("suffixed duplicate slug resolves", productPage.status === 200, `got ${productPage.status}`);

  const search = await anon.get("/api/search?q=chair");
  check("search API responds", search.status === 200, `got ${search.status}`);

  /* ---------------- 9. Rate limiting ---------------- */
  flow("9. Auth rate limiting");

  // A dedicated IP so this cannot throttle the rest of the run.
  const floodIp = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
  const flood = new Client("flood");
  let sawLimit = 0;
  let firstLimitAt = 0;
  for (let i = 1; i <= 14; i++) {
    const r = await flood.post(
      "/api/auth/login",
      { email: `nobody-${i}@example.com`, password: "WrongPass1" },
      { ip: floodIp },
    );
    if (r.status === 429) {
      sawLimit += 1;
      if (!firstLimitAt) firstLimitAt = i;
    }
  }
  check(
    `login throttles after repeated failures (first 429 at attempt ${firstLimitAt})`,
    sawLimit > 0,
    "14 failed logins from one IP were never rate-limited",
  );
  check(
    "throttle kicks in at the configured limit of 10",
    firstLimitAt === 11,
    `expected the 11th attempt to be the first 429, got attempt ${firstLimitAt}`,
  );

  const otherIp = await new Client("other").post(
    "/api/auth/login",
    { email: USER.email, password: USER.password },
    { ip: `198.51.100.${Math.floor(Math.random() * 250) + 1}` },
  );
  check("a different IP is not affected by that throttle", otherIp.status === 200, `got ${otherIp.status}`);

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
  console.error("HARNESS CRASHED:", e);
  process.exit(2);
});
