/**
 * End-to-end harness for the admin server actions.
 *
 * Calls the real action functions through /api/e2e-harness with a genuine admin
 * session cookie, then verifies the resulting database state directly.
 *
 * Run:  node scripts/e2e-actions.mjs
 */
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const prisma = new PrismaClient();
const RUN_IP = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

// Overridable so the suite keeps working after the seeded password is changed.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@nationalplasto.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@12345";

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
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${label}`);
  if (!passed && detail !== undefined) console.log(`        ${detail}`);
  return passed;
}

/* ------------------------------------------------------------------ */

let cookie = "";

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ email, password }),
  });
  const jar = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]);
  cookie = jar.join("; ");
  if (!res.ok) throw new Error(`admin login failed: ${res.status} ${await res.text()}`);
}

async function call(action, ...args) {
  const res = await fetch(`${BASE}/api/e2e-harness`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ action, args }),
    redirect: "manual",
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`harness returned non-JSON (${res.status}): ${text.slice(0, 300)}`);
  }
  return json;
}

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

/* ------------------------------------------------------------------ */

async function main() {
  await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const collection = await prisma.collection.findFirstOrThrow({ where: { slug: "next" } });
  const category = await prisma.category.findFirstOrThrow({ where: { slug: "chairs" } });
  const stamp = Date.now().toString(36);

  const base = {
    name: `ZZ Action Product ${stamp}`,
    slug: `zz-action-${stamp}`,
    sku: `ZZACT-${stamp}`,
    collectionId: collection.id,
    categoryId: category.id,
    stock: 5,
    price: 1200,
    images: [],
    features: [],
    specifications: [],
  };

  /* ---------------- 1. Product create ---------------- */
  flow("1. Admin product create");

  const created = await call("createProduct", base);
  check("createProduct ok", created.result?.ok === true, JSON.stringify(created).slice(0, 300));
  const productId = created.result?.id;
  check("returns new id", Boolean(productId), JSON.stringify(created.result));

  const row = productId
    ? await prisma.product.findUnique({ where: { id: productId } })
    : null;
  check("price stored as paise (₹1200 -> 120000)", row?.price === 120000, `got ${row?.price}`);
  check("needsReview true (no description/image)", row?.needsReview === true, `got ${row?.needsReview}`);
  check("stock stored", row?.stock === 5, `got ${row?.stock}`);

  /* ---------------- 2. Slug / SKU collisions ---------------- */
  flow("2. Slug and SKU uniqueness collisions");

  const dupSlug = await call("createProduct", { ...base, sku: `ZZACT-OTHER-${stamp}` });
  check("duplicate slug rejected", dupSlug.result?.ok === false, JSON.stringify(dupSlug.result));
  check("slug field error returned", Boolean(dupSlug.result?.fields?.slug), JSON.stringify(dupSlug.result?.fields));

  const dupSku = await call("createProduct", { ...base, slug: `zz-action-other-${stamp}` });
  check("duplicate SKU rejected", dupSku.result?.ok === false, JSON.stringify(dupSku.result));
  check("sku field error returned", Boolean(dupSku.result?.fields?.sku), JSON.stringify(dupSku.result?.fields));

  const seeded = await prisma.product.findFirstOrThrow({ where: { sku: "NP-NXT-001" } });
  const stealSlug = await call("updateProduct", productId, { ...base, slug: seeded.slug });
  check(
    "update onto another product's slug rejected",
    stealSlug.result?.ok === false && Boolean(stealSlug.result?.fields?.slug),
    JSON.stringify(stealSlug.result),
  );

  const sameSlugSelf = await call("updateProduct", productId, { ...base, stock: 7 });
  check("update keeping own slug allowed", sameSlugSelf.result?.ok === true, JSON.stringify(sameSlugSelf.result));

  /* ---------------- 3. Validation ---------------- */
  flow("3. Product validation");

  const badSlug = await call("createProduct", { ...base, slug: "Not A Slug!", sku: `ZZV1-${stamp}` });
  check("uppercase/spacey slug rejected", badSlug.result?.ok === false, JSON.stringify(badSlug.result?.fields));

  const badDiscount = await call("createProduct", {
    ...base,
    slug: `zz-v2-${stamp}`,
    sku: `ZZV2-${stamp}`,
    price: 100,
    discountPrice: 200,
  });
  check(
    "discount above price rejected",
    badDiscount.result?.ok === false,
    JSON.stringify(badDiscount.result?.fields),
  );

  const discountNoPrice = await call("createProduct", {
    ...base,
    slug: `zz-v3-${stamp}`,
    sku: `ZZV3-${stamp}`,
    price: "",
    discountPrice: 200,
  });
  check(
    "discount without a price rejected",
    discountNoPrice.result?.ok === false,
    JSON.stringify(discountNoPrice.result?.fields),
  );

  /* ---------------- 4. Image upload + orphan cleanup ---------------- */
  flow("4. Image upload and orphan cleanup");

  // 1x1 transparent PNG
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  async function upload(name, type = "image/png") {
    const fd = new FormData();
    fd.append("file", new Blob([png], { type }), name);
    const res = await fetch(`${BASE}/api/upload`, { method: "POST", headers: { cookie, "x-forwarded-for": RUN_IP }, body: fd });
    return { status: res.status, json: await res.json().catch(() => null) };
  }

  const anonUpload = await fetch(`${BASE}/api/upload`, { method: "POST", body: new FormData() });
  check("upload requires auth", anonUpload.status === 401 || anonUpload.status === 403, `got ${anonUpload.status}`);

  const up1 = await upload("one.png");
  const up2 = await upload("two.png");
  check("upload 1 succeeded", up1.status === 201 && Boolean(up1.json?.urls?.[0]), JSON.stringify(up1).slice(0, 250));
  check("upload 2 succeeded", up2.status === 201 && Boolean(up2.json?.urls?.[0]), JSON.stringify(up2).slice(0, 250));

  const url1 = up1.json?.urls?.[0];
  const url2 = up2.json?.urls?.[0];
  const diskPath = (u) => path.join(process.cwd(), "public", u.replace(/^\//, ""));

  check("file 1 written to disk", url1 ? await exists(diskPath(url1)) : false, url1);
  check("file 2 written to disk", url2 ? await exists(diskPath(url2)) : false, url2);

  const badType = await upload("evil.txt", "text/plain");
  check("non-image rejected", badType.status >= 400, `got ${badType.status}`);

  // Attach both, then edit down to one — the dropped file must be deleted.
  await call("updateProduct", productId, {
    ...base,
    description: "A described product.",
    images: [url1, url2],
  });
  const withImages = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });
  check("two images attached", withImages?.images.length === 2, `got ${withImages?.images.length}`);
  check(
    "needsReview cleared once price+description+image present",
    withImages?.needsReview === false,
    `got ${withImages?.needsReview}`,
  );

  await call("updateProduct", productId, {
    ...base,
    description: "A described product.",
    images: [url1],
  });
  check("orphaned file deleted from disk on edit", !(await exists(diskPath(url2))), url2);
  check("kept file still on disk", await exists(diskPath(url1)), url1);

  /* ---------------- 5. Inline stock edit ---------------- */
  flow("5. updateStock action");

  const st1 = await call("updateStock", productId, 42);
  check("updateStock ok", st1.result?.ok === true, JSON.stringify(st1.result));
  check(
    "stock persisted as 42",
    (await prisma.product.findUnique({ where: { id: productId } }))?.stock === 42,
  );

  const stNeg = await call("updateStock", productId, -5);
  check("negative stock rejected", stNeg.result?.ok === false, JSON.stringify(stNeg.result));

  const stHuge = await call("updateStock", productId, 9_999_999);
  check("absurd stock rejected", stHuge.result?.ok === false, JSON.stringify(stHuge.result));

  const stFloat = await call("updateStock", productId, 7.9);
  check("fractional stock floored to 7", stFloat.result?.ok === true, JSON.stringify(stFloat.result));
  check(
    "stock is 7 after floor",
    (await prisma.product.findUnique({ where: { id: productId } }))?.stock === 7,
  );

  /* ---------------- 6. Bulk actions ---------------- */
  flow("6. Bulk product actions");

  const bulkIds = [];
  for (let i = 0; i < 3; i++) {
    const r = await call("createProduct", {
      ...base,
      name: `ZZ Bulk ${stamp}-${i}`,
      slug: `zz-bulk-${stamp}-${i}`,
      sku: `ZZBULK-${stamp}-${i}`,
    });
    if (r.result?.id) bulkIds.push(r.result.id);
  }
  check("3 bulk fixtures created", bulkIds.length === 3, `got ${bulkIds.length}`);

  await call("bulkUpdateProducts", { ids: bulkIds, action: "unpublish" });
  check(
    "bulk unpublish applied",
    (await prisma.product.count({ where: { id: { in: bulkIds }, isPublished: false } })) === 3,
  );

  await call("bulkUpdateProducts", { ids: bulkIds, action: "feature" });
  check(
    "bulk feature applied",
    (await prisma.product.count({ where: { id: { in: bulkIds }, isFeatured: true } })) === 3,
  );

  const badBulk = await call("bulkUpdateProducts", { ids: bulkIds, action: "explode" });
  check("unknown bulk action rejected", badBulk.result?.ok === false, JSON.stringify(badBulk.result));

  const emptyBulk = await call("bulkUpdateProducts", { ids: [], action: "publish" });
  check("empty bulk id list rejected", emptyBulk.result?.ok === false, JSON.stringify(emptyBulk.result));

  await call("bulkUpdateProducts", { ids: bulkIds, action: "delete" });
  check("bulk delete removed all 3", (await prisma.product.count({ where: { id: { in: bulkIds } } })) === 0);

  /* ---------------- 7. Delete + image cleanup ---------------- */
  flow("7. Product delete and image cleanup");

  const del = await call("deleteProduct", productId);
  check("deleteProduct ok", del.result?.ok === true, JSON.stringify(del.result));
  check("product row gone", (await prisma.product.count({ where: { id: productId } })) === 0);
  check("its image removed from disk", !(await exists(diskPath(url1))), url1);

  const delMissing = await call("deleteProduct", "no-such-id");
  check("deleting a missing product is handled", delMissing.result?.ok === false, JSON.stringify(delMissing.result));

  /* ---------------- 8. Order status + stock restore ---------------- */
  flow("8. Order status change and stock restore");

  const order = await prisma.order.findFirst({
    where: { customerEmail: { startsWith: "e2e-" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  if (!order) throw new Error("no e2e order found — run scripts/e2e-http.mjs first");

  const stockBefore = Object.fromEntries(
    await Promise.all(
      order.items.map(async (i) => [
        i.productId,
        (await prisma.product.findUnique({ where: { id: i.productId } }))?.stock,
      ]),
    ),
  );

  const conf = await call("updateOrderStatus", { orderId: order.id, status: "CONFIRMED" });
  check("status -> CONFIRMED", conf.result?.ok === true, JSON.stringify(conf.result));
  check(
    "confirming does not touch stock",
    (await prisma.product.findUnique({ where: { id: order.items[0].productId } }))?.stock ===
      stockBefore[order.items[0].productId],
  );

  const noop = await call("updateOrderStatus", { orderId: order.id, status: "CONFIRMED" });
  check("repeat same status is a no-op", noop.result?.message === "Status unchanged.", JSON.stringify(noop.result));

  const cancel = await call("updateOrderStatus", { orderId: order.id, status: "CANCELLED", note: "e2e" });
  check("status -> CANCELLED", cancel.result?.ok === true, JSON.stringify(cancel.result));

  for (const item of order.items) {
    const after = (await prisma.product.findUnique({ where: { id: item.productId } }))?.stock;
    check(
      `stock restored for ${item.name} (${stockBefore[item.productId]} + ${item.quantity} = ${after})`,
      after === stockBefore[item.productId] + item.quantity,
      `expected ${stockBefore[item.productId] + item.quantity}, got ${after}`,
    );
  }

  const cancelAgain = await call("updateOrderStatus", { orderId: order.id, status: "CANCELLED" });
  check("re-cancel is a no-op", cancelAgain.result?.message === "Status unchanged.", JSON.stringify(cancelAgain.result));
  for (const item of order.items) {
    const after = (await prisma.product.findUnique({ where: { id: item.productId } }))?.stock;
    check(
      `no double restock for ${item.name}`,
      after === stockBefore[item.productId] + item.quantity,
      `got ${after}`,
    );
  }

  const uncancel = await call("updateOrderStatus", { orderId: order.id, status: "PROCESSING" });
  check("un-cancel allowed", uncancel.result?.ok === true, JSON.stringify(uncancel.result));
  for (const item of order.items) {
    const after = (await prisma.product.findUnique({ where: { id: item.productId } }))?.stock;
    check(
      `stock re-deducted for ${item.name}`,
      after === stockBefore[item.productId],
      `expected ${stockBefore[item.productId]}, got ${after}`,
    );
  }

  const delivered = await call("updateOrderStatus", { orderId: order.id, status: "DELIVERED" });
  check("status -> DELIVERED", delivered.result?.ok === true, JSON.stringify(delivered.result));
  const deliveredRow = await prisma.order.findUnique({ where: { id: order.id } });
  check("DELIVERED marks COD order PAID", deliveredRow?.paymentStatus === "PAID", `got ${deliveredRow?.paymentStatus}`);

  const events = await prisma.orderEvent.count({ where: { orderId: order.id } });
  check("timeline events appended", events >= 5, `got ${events}`);

  const badStatus = await call("updateOrderStatus", { orderId: order.id, status: "TELEPORTED" });
  check("invalid status rejected", badStatus.result?.ok === false, JSON.stringify(badStatus.result));

  const missingOrder = await call("updateOrderStatus", { orderId: "nope", status: "SHIPPED" });
  check("missing order handled", missingOrder.result?.ok === false, JSON.stringify(missingOrder.result));

  /* ---- untracked-stock product through cancel ---- */
  flow("8b. Cancel with a trackStock:false product");

  const untracked = await prisma.product.findFirst({ where: { sku: "ZZTEST-C" } });
  if (untracked) {
    const before = untracked.stock;
    const u = await prisma.user.findFirstOrThrow({ where: { email: { startsWith: "e2e-" } } });
    const probe = await prisma.order.create({
      data: {
        orderNumber: `ZZ-UNTRACKED-${stamp}`,
        userId: u.id,
        customerName: "E2E",
        customerEmail: `e2e-untracked-${stamp}@example.com`,
        customerPhone: "9830123456",
        shipLine1: "1 Test Road",
        shipCity: "Kolkata",
        shipState: "West Bengal",
        shipPincode: "700034",
        subtotal: 50000,
        discount: 0,
        shipping: 9900,
        total: 59900,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        items: {
          create: {
            productId: untracked.id,
            name: untracked.name,
            slug: untracked.slug,
            collectionName: "NEXT",
            unitPrice: 50000,
            quantity: 4,
            lineTotal: 200000,
          },
        },
      },
      select: { id: true },
    });

    await call("updateOrderStatus", { orderId: probe.id, status: "CANCELLED" });
    const afterCancel = (await prisma.product.findUnique({ where: { id: untracked.id } }))?.stock;
    check(
      `untracked product stock unchanged by cancel (was ${before})`,
      afterCancel === before,
      `expected ${before}, got ${afterCancel} — checkout skips trackStock:false when deducting, so restoring it invents inventory`,
    );
  }

  /* ---- negative stock via un-cancel ---- */
  flow("8c. Un-cancel when stock is no longer available");

  const probeProduct = await prisma.product.findFirstOrThrow({ where: { sku: "ZZTEST-A" } });
  const u2 = await prisma.user.findFirstOrThrow({ where: { email: { startsWith: "e2e-" } } });
  const probe2 = await prisma.order.create({
    data: {
      orderNumber: `ZZ-NEG-${stamp}`,
      userId: u2.id,
      customerName: "E2E",
      customerEmail: `e2e-neg-${stamp}@example.com`,
      customerPhone: "9830123456",
      shipLine1: "1 Test Road",
      shipCity: "Kolkata",
      shipState: "West Bengal",
      shipPincode: "700034",
      subtotal: 150000,
      discount: 0,
      shipping: 0,
      total: 150000,
      status: "CANCELLED",
      paymentStatus: "UNPAID",
      paymentMethod: "COD",
      items: {
        create: {
          productId: probeProduct.id,
          name: probeProduct.name,
          slug: probeProduct.slug,
          collectionName: "NEXT",
          unitPrice: 150000,
          quantity: 5,
          lineTotal: 750000,
        },
      },
    },
    select: { id: true },
  });

  await prisma.product.update({ where: { id: probeProduct.id }, data: { stock: 1 } });
  const unc = await call("updateOrderStatus", { orderId: probe2.id, status: "PROCESSING" });
  const negStock = (await prisma.product.findUnique({ where: { id: probeProduct.id } }))?.stock;
  check(
    "un-cancelling beyond available stock does not go negative",
    typeof negStock === "number" && negStock >= 0,
    `stock is ${negStock} after un-cancelling an order for 5 units with only 1 in stock (action result: ${JSON.stringify(unc.result)})`,
  );

  /* ---------------- 9. Review moderation ---------------- */
  flow("9. Review moderation and rating recalculation");

  const review = await prisma.review.findFirst({
    where: { product: { sku: "ZZTEST-A" } },
    orderBy: { createdAt: "desc" },
  });
  if (review) {
    const pBefore = await prisma.product.findUnique({ where: { id: review.productId } });
    check("rating starts at 0 while unapproved", pBefore?.ratingAvg === 0, `got ${pBefore?.ratingAvg}`);
    check("reviewCount starts at 0", pBefore?.reviewCount === 0, `got ${pBefore?.reviewCount}`);

    const appr = await call("moderateReview", { id: review.id, action: "approve" });
    check("approve ok", appr.result?.ok === true, JSON.stringify(appr.result));

    const pAfter = await prisma.product.findUnique({ where: { id: review.productId } });
    check("ratingAvg recomputed to 5", pAfter?.ratingAvg === 5, `got ${pAfter?.ratingAvg}`);
    check("reviewCount recomputed to 1", pAfter?.reviewCount === 1, `got ${pAfter?.reviewCount}`);

    await call("moderateReview", { id: review.id, action: "unapprove" });
    const pUn = await prisma.product.findUnique({ where: { id: review.productId } });
    check("unapprove resets rating to 0", pUn?.ratingAvg === 0, `got ${pUn?.ratingAvg}`);
    check("unapprove resets count to 0", pUn?.reviewCount === 0, `got ${pUn?.reviewCount}`);

    await call("moderateReview", { id: review.id, action: "approve" });
    const delR = await call("moderateReview", { id: review.id, action: "delete" });
    check("delete ok", delR.result?.ok === true, JSON.stringify(delR.result));
    const pDel = await prisma.product.findUnique({ where: { id: review.productId } });
    check("rating recomputed after delete", pDel?.ratingAvg === 0 && pDel?.reviewCount === 0, JSON.stringify(pDel));

    const missingR = await call("moderateReview", { id: "nope", action: "approve" });
    check("missing review handled", missingR.result?.ok === false, JSON.stringify(missingR.result));
  } else {
    check("review fixture present", false, "no review found — run scripts/e2e-http.mjs first");
  }

  /* ---------------- 10. Customer activation ---------------- */
  flow("10. Customer activation guards");

  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const self = await call("setCustomerActive", { id: admin.id, isActive: false });
  check("admin cannot deactivate themselves", self.result?.ok === false, JSON.stringify(self.result));
  check(
    "admin account still active",
    (await prisma.user.findUnique({ where: { id: admin.id } }))?.isActive === true,
  );

  const customer = await prisma.user.findFirst({ where: { email: { startsWith: "e2e-" } } });
  if (customer) {
    await call("setCustomerActive", { id: customer.id, isActive: false });
    check(
      "customer deactivated",
      (await prisma.user.findUnique({ where: { id: customer.id } }))?.isActive === false,
    );

    const blocked = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
      body: JSON.stringify({ email: customer.email, password: "Passw0rdTest" }),
    });
    check("deactivated customer cannot log in (403)", blocked.status === 403, `got ${blocked.status}`);

    await call("setCustomerActive", { id: customer.id, isActive: true });
    check(
      "customer reactivated",
      (await prisma.user.findUnique({ where: { id: customer.id } }))?.isActive === true,
    );
  }

  /* ---------------- 11. Non-admin cannot reach actions ---------------- */
  flow("11. Action authorisation");

  const before = cookie;
  const userRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ email: customer?.email, password: "Passw0rdTest" }),
  });
  cookie = (userRes.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const asUser = await fetch(`${BASE}/api/e2e-harness`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ action: "updateStock", args: ["x", 1] }),
    redirect: "manual",
  });
  check(
    "non-admin blocked from admin actions",
    asUser.status === 307 || asUser.status === 302 || asUser.status >= 400,
    `got ${asUser.status}`,
  );
  cookie = before;

  /* ---------------- summary ---------------- */
  const failed = results.filter((r) => !r.passed);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL ${results.length}   PASS ${results.length - failed.length}   FAIL ${failed.length}`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  [${f.flow}] ${f.label}\n      ${f.detail ?? ""}`);
  }
  console.log("=".repeat(60));
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("HARNESS CRASHED:", e);
  await prisma.$disconnect();
  process.exit(2);
});
