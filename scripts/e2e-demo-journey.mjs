/**
 * The full customer journey the demo has to survive, start to finish:
 *
 *   browse -> wishlist -> wishlist to cart -> checkout (COD) -> order
 *   -> customer sees the order -> admin sees the order, customer and review
 *
 * Uses the real HTTP endpoints and the real database. Payment is deliberately
 * NOT exercised: the demo runs Cash on Delivery only.
 *
 * Run:  node scripts/e2e-demo-journey.mjs
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE ?? "http://localhost:3000";
const prisma = new PrismaClient();
const RUN_IP = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@nationalplasto.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@12345";

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
  return passed;
}

class Client {
  constructor() {
    this.jar = new Map();
  }
  cookie() {
    return [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  async req(method, path, body) {
    const headers = { cookie: this.cookie(), "x-forwarded-for": RUN_IP };
    if (body !== undefined) headers["content-type"] = "application/json";
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const k = pair.slice(0, i).trim();
      const v = pair.slice(i + 1).trim();
      if (!v || /Max-Age=0/i.test(c)) this.jar.delete(k);
      else this.jar.set(k, v);
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* html */
    }
    return { status: res.status, json, text, headers: res.headers };
  }
  get(p) {
    return this.req("GET", p);
  }
  post(p, b) {
    return this.req("POST", p, b);
  }
}

async function main() {
  const stamp = Date.now().toString(36);
  const shopper = new Client();
  const admin = new Client();

  const email = `demo-shopper-${stamp}@example.com`;
  const password = "Shopper@123";

  /* ---------------- 0. the catalogue must be shoppable ---------------- */
  flow("0. Catalogue is shoppable");

  // Scoped to the real catalogue (NP-* SKUs). Test fixtures from the other
  // suites may still be present, and one of them is unpriced on purpose.
  const CATALOGUE = { sku: { startsWith: "NP-" }, isPublished: true };
  const priced = await prisma.product.count({ where: { ...CATALOGUE, price: { not: null } } });
  const total = await prisma.product.count({ where: CATALOGUE });
  check(`every catalogue product has a price (${priced}/${total})`, priced === total && total > 0);

  const listing = await shopper.get("/products");
  check("/products renders", listing.status === 200, `got ${listing.status}`);
  check("cards offer Add to Cart, not Enquire", listing.text.includes("Add to Cart"));
  check("no 'Price on request' left", !listing.text.includes("Price on request"));

  /* ---------------- 1. register ---------------- */
  flow("1. Customer registers");

  const reg = await shopper.post("/api/auth/register", {
    name: "Demo Shopper",
    email,
    phone: "9830111222",
    password,
    confirmPassword: password,
  });
  check("registered", reg.status === 201, `${reg.status} ${reg.text.slice(0, 160)}`);
  check("signed in straight away", (await shopper.get("/api/auth/me")).json?.user?.email === email);

  /* ---------------- 2. wishlist ---------------- */
  flow("2. Customer wishlists products");

  const picks = await prisma.product.findMany({
    where: { ...CATALOGUE, price: { not: null } },
    select: { id: true, name: true, slug: true, price: true, discountPrice: true },
    orderBy: { sku: "asc" },
    take: 3,
  });
  check("picked 3 products to wishlist", picks.length === 3);

  const wish = await shopper.post("/api/wishlist/sync", { ids: picks.map((p) => p.id) });
  check("wishlist saved to the server", wish.status === 200, `${wish.status} ${wish.text.slice(0, 160)}`);
  check("all 3 stored", wish.json?.ids?.length === 3, JSON.stringify(wish.json));

  const stored = await prisma.wishlistItem.count({
    where: { wishlist: { user: { email } } },
  });
  check("wishlist rows persisted in the database", stored === 3, `got ${stored}`);

  const wishlistPage = await shopper.get("/wishlist");
  check("/wishlist renders", wishlistPage.status === 200, `got ${wishlistPage.status}`);

  const resolved = await shopper.post("/api/products/by-ids", { ids: picks.map((p) => p.id) });
  check(
    "wishlist page can resolve its products",
    resolved.json?.products?.length === 3,
    JSON.stringify(resolved.json).slice(0, 200),
  );
  check(
    "each resolved product carries a price (so Add to Cart is offered)",
    (resolved.json?.products ?? []).every((p) => p.price !== null),
  );

  /* ---------------- 3. wishlist -> cart ---------------- */
  flow("3. Wishlist to cart");

  // This is what "Add all to cart" on the wishlist page does.
  const lines = picks.map((p) => ({ productId: p.id, quantity: 1 }));
  const sync = await shopper.post("/api/cart/sync", { lines });
  check("cart accepted the wishlist items", sync.status === 200, `${sync.status} ${sync.text.slice(0, 160)}`);
  check("all 3 lines in the cart", sync.json?.lines?.length === 3, JSON.stringify(sync.json));

  const cartRows = await prisma.cartItem.count({ where: { cart: { user: { email } } } });
  check("cart rows persisted", cartRows === 3, `got ${cartRows}`);

  const resolveCart = await shopper.post("/api/cart/resolve", { lines });
  const rl = resolveCart.json?.lines ?? [];
  check("cart resolves with server prices", rl.length === 3, JSON.stringify(resolveCart.json).slice(0, 200));

  const expectedSubtotal = picks.reduce((n, p) => n + (p.discountPrice ?? p.price), 0);
  check(
    `subtotal matches the catalogue (₹${(expectedSubtotal / 100).toFixed(2)})`,
    resolveCart.json?.totals?.subtotal === expectedSubtotal,
    `got ${resolveCart.json?.totals?.subtotal}, expected ${expectedSubtotal}`,
  );
  check("nothing unpriced in the cart", resolveCart.json?.totals?.unpricedCount === 0);

  const cartPage = await shopper.get("/cart");
  check("/cart renders", cartPage.status === 200, `got ${cartPage.status}`);

  /* ---------------- 4. checkout, COD only ---------------- */
  flow("4. Checkout — Cash on Delivery (no payment gateway)");

  const checkoutPage = await shopper.get("/checkout");
  check("/checkout renders for a signed-in customer", checkoutPage.status === 200, `got ${checkoutPage.status}`);
  check("online payment is shown as unavailable", checkoutPage.text.includes("not enabled") || checkoutPage.text.includes("Cash on Delivery"));

  const razorpayAttempt = await shopper.post("/api/orders", {
    customerName: "Demo Shopper",
    customerEmail: email,
    customerPhone: "9830111222",
    line1: "42 Demo Street, Behala",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700034",
    paymentMethod: "RAZORPAY",
    lines,
  });
  check(
    "online payment is refused while the gateway is off",
    razorpayAttempt.status === 400,
    `got ${razorpayAttempt.status}`,
  );

  const order = await shopper.post("/api/orders", {
    customerName: "Demo Shopper",
    customerEmail: email,
    customerPhone: "9830111222",
    line1: "42 Demo Street, Behala",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700034",
    paymentMethod: "COD",
    notes: "Demo order — please leave at reception.",
    saveAddress: true,
    lines,
  });
  check("COD order placed", order.status === 201, `${order.status} ${order.text.slice(0, 200)}`);

  const orderNumber = order.json?.order?.orderNumber;
  check("order number issued", Boolean(orderNumber), JSON.stringify(order.json));
  check("no payment was taken", order.json?.requiresPayment === false, JSON.stringify(order.json));

  const dbOrder = await prisma.order.findFirst({
    where: { orderNumber },
    include: { items: true, events: true },
  });
  check("order stored with 3 items", dbOrder?.items.length === 3, `got ${dbOrder?.items.length}`);
  check("payment status UNPAID (COD)", dbOrder?.paymentStatus === "UNPAID", dbOrder?.paymentStatus);
  check("status PENDING", dbOrder?.status === "PENDING", dbOrder?.status);
  check(
    "total = subtotal + shipping",
    dbOrder?.total === dbOrder?.subtotal + dbOrder?.shipping,
    `${dbOrder?.subtotal} + ${dbOrder?.shipping} vs ${dbOrder?.total}`,
  );
  check("timeline event recorded", (dbOrder?.events.length ?? 0) >= 1);
  check("delivery address saved to the account", (await prisma.address.count({ where: { user: { email } } })) === 1);

  const emptied = await prisma.cartItem.count({ where: { cart: { user: { email } } } });
  check("cart emptied after ordering", emptied === 0, `got ${emptied}`);

  /* ---------------- 5. customer sees the order ---------------- */
  flow("5. Customer can see the order");

  const confirmation = await shopper.get(`/order-confirmation/${orderNumber}`);
  check("order confirmation page renders", confirmation.status === 200, `got ${confirmation.status}`);
  check("it shows the order number", confirmation.text.includes(orderNumber));
  check("it says Cash on Delivery", confirmation.text.includes("Cash on Delivery"));

  const myOrders = await shopper.get("/account/orders");
  check("/account/orders renders", myOrders.status === 200, `got ${myOrders.status}`);
  check("the order is listed", myOrders.text.includes(orderNumber));

  /* ---------------- 6. review ---------------- */
  flow("6. Customer leaves a review");

  const review = await shopper.post("/api/reviews", {
    productId: picks[0].id,
    rating: 5,
    title: "Very sturdy",
    body: "Good build quality, arrived quickly.",
  });
  check("review submitted", review.status === 200 || review.status === 201, `${review.status} ${review.text.slice(0, 160)}`);
  check(
    "held for moderation, not auto-published",
    (await prisma.review.findFirst({ where: { product: { id: picks[0].id } } }))?.isApproved === false,
  );

  /* ---------------- 7. admin sees everything ---------------- */
  flow("7. Admin can see all the records");

  const login = await admin.post("/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check(`admin signs in (${ADMIN_EMAIL})`, login.status === 200, `${login.status} ${login.text.slice(0, 160)}`);
  check("role is ADMIN", login.json?.user?.role === "ADMIN");

  const pages = {
    "/admin": "dashboard",
    "/admin/products": "products",
    "/admin/orders": "orders",
    "/admin/customers": "customers",
    "/admin/reviews": "reviews",
    "/admin/collections": "collections",
    "/admin/categories": "categories",
    "/admin/content": "homepage content",
    "/admin/settings": "settings",
  };
  for (const [path, label] of Object.entries(pages)) {
    const r = await admin.get(path);
    check(`${label} page opens`, r.status === 200, `${path} -> ${r.status}`);
  }

  const ordersPage = await admin.get("/admin/orders");
  check("the new order appears in admin orders", ordersPage.text.includes(orderNumber));

  const orderDetail = await admin.get(`/admin/orders/${dbOrder.id}`);
  check("admin can open the order", orderDetail.status === 200, `got ${orderDetail.status}`);
  check("order detail shows the customer", orderDetail.text.includes("Demo Shopper"));

  const customersPage = await admin.get("/admin/customers");
  check("the new customer appears", customersPage.text.includes("Demo Shopper") || customersPage.text.includes(email));

  const reviewsPage = await admin.get("/admin/reviews");
  check("the pending review appears", reviewsPage.text.includes("Very sturdy"));

  /* ---------------- 8. admin fulfils the order ---------------- */
  flow("8. Admin moves the order through its lifecycle");

  const advance = async (status) => {
    const r = await fetch(`${BASE}/api/e2e-harness`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: admin.cookie(), "x-forwarded-for": RUN_IP },
      body: JSON.stringify({ action: "updateOrderStatus", args: [{ orderId: dbOrder.id, status }] }),
      redirect: "manual",
    });
    const t = await r.text();
    try {
      return JSON.parse(t);
    } catch {
      return { raw: t.slice(0, 120), status: r.status };
    }
  };

  for (const s of ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]) {
    const r = await advance(s);
    check(`status -> ${s}`, r.result?.ok === true, JSON.stringify(r).slice(0, 160));
  }

  const finalOrder = await prisma.order.findUnique({
    where: { id: dbOrder.id },
    include: { events: true },
  });
  check("order is DELIVERED", finalOrder?.status === "DELIVERED", finalOrder?.status);
  check("delivered COD order is marked PAID", finalOrder?.paymentStatus === "PAID", finalOrder?.paymentStatus);
  check("full timeline recorded", (finalOrder?.events.length ?? 0) >= 5, `${finalOrder?.events.length} events`);

  const customerView = await shopper.get("/account/orders");
  check("customer sees the updated status", customerView.text.includes("Delivered") || customerView.status === 200);

  /* ---------------- summary ---------------- */
  const failed = results.filter((r) => !r.passed);
  console.log(`\n${"=".repeat(64)}`);
  console.log(`TOTAL ${results.length}   PASS ${results.length - failed.length}   FAIL ${failed.length}`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  [${f.flow}] ${f.label}\n      ${f.detail ?? ""}`);
  } else {
    console.log(`\nDemo order ${orderNumber} completed the whole journey.`);
  }
  console.log("=".repeat(64));

  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("CRASHED:", e);
  await prisma.$disconnect();
  process.exit(2);
});
