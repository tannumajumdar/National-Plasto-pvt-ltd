/**
 * End-to-end harness for the new category admin and inline stock editing.
 *
 * Run:  node scripts/e2e-categories.mjs
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE ?? "http://localhost:3000";
const prisma = new PrismaClient();
const RUN_IP = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

// Overridable so the suite keeps working after the seeded password is changed.
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
}

let cookie = "";
async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ email, password }),
  });
  cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  if (!res.ok) throw new Error(`login failed ${res.status}`);
}

async function call(action, ...args) {
  const res = await fetch(`${BASE}/api/e2e-harness`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ action, args }),
    redirect: "manual",
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function main() {
  await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const stamp = Date.now().toString(36);

  /* ---------------- Page renders ---------------- */
  flow("Category admin page");

  const page = await fetch(`${BASE}/admin/categories`, { headers: { cookie, "x-forwarded-for": RUN_IP }, redirect: "manual" });
  check("/admin/categories renders for admin", page.status === 200, `got ${page.status}`);
  const html = await page.text();
  check("page lists a seeded category", html.includes("Storage &amp; Racks") || html.includes("Storage & Racks"));
  check("page shows the Add category button", html.includes("Add category"));

  const anon = await fetch(`${BASE}/admin/categories`, { redirect: "manual" });
  check(
    "anonymous redirected to /admin/login",
    anon.status === 307 && (anon.headers.get("location") ?? "").includes("/admin/login"),
    `${anon.status} -> ${anon.headers.get("location")}`,
  );

  const nav = await fetch(`${BASE}/admin`, { headers: { cookie, "x-forwarded-for": RUN_IP } }).then((r) => r.text());
  check("Categories appears in the admin sidebar", nav.includes("/admin/categories"));

  /* ---------------- Create ---------------- */
  flow("Category create");

  const created = await call("saveCategory", null, {
    name: `ZZ Cat ${stamp}`,
    slug: `zz-cat-${stamp}`,
    description: "Created by the e2e harness.",
    sortOrder: 12,
    isActive: true,
  });
  check("saveCategory create ok", created.result?.ok === true, JSON.stringify(created).slice(0, 250));
  const catId = created.result?.id;
  check("returns new id", Boolean(catId));

  const row = catId ? await prisma.category.findUnique({ where: { id: catId } }) : null;
  check("name persisted", row?.name === `ZZ Cat ${stamp}`, row?.name);
  check("sortOrder persisted", row?.sortOrder === 12, `got ${row?.sortOrder}`);
  check("isActive persisted", row?.isActive === true);

  /* ---------------- Uniqueness ---------------- */
  flow("Category uniqueness");

  const dupSlug = await call("saveCategory", null, {
    name: `ZZ Other ${stamp}`,
    slug: `zz-cat-${stamp}`,
  });
  check("duplicate slug rejected", dupSlug.result?.ok === false, JSON.stringify(dupSlug.result));
  check("slug field error", Boolean(dupSlug.result?.fields?.slug), JSON.stringify(dupSlug.result?.fields));

  const dupName = await call("saveCategory", null, {
    name: `ZZ Cat ${stamp}`,
    slug: `zz-cat-other-${stamp}`,
  });
  check("duplicate name rejected", dupName.result?.ok === false, JSON.stringify(dupName.result));
  check("name field error", Boolean(dupName.result?.fields?.name), JSON.stringify(dupName.result?.fields));

  const clashSeeded = await call("saveCategory", catId, { name: "Chairs", slug: "chairs" });
  check("cannot rename onto a seeded category", clashSeeded.result?.ok === false, JSON.stringify(clashSeeded.result));

  const selfSave = await call("saveCategory", catId, {
    name: `ZZ Cat ${stamp}`,
    slug: `zz-cat-${stamp}`,
    sortOrder: 3,
  });
  check("saving a category onto its own slug is allowed", selfSave.result?.ok === true, JSON.stringify(selfSave.result));
  check(
    "edit persisted",
    (await prisma.category.findUnique({ where: { id: catId } }))?.sortOrder === 3,
  );

  const badSlug = await call("saveCategory", null, { name: "Bad", slug: "Not A Slug!" });
  check("invalid slug rejected", badSlug.result?.ok === false, JSON.stringify(badSlug.result?.fields));

  const noName = await call("saveCategory", null, { name: "", slug: "x" });
  check("empty name rejected", noName.result?.ok === false, JSON.stringify(noName.result?.fields));

  /* ---------------- Toggle ---------------- */
  flow("Category activation toggle");

  await call("toggleCategoryActive", catId, false);
  check("deactivated", (await prisma.category.findUnique({ where: { id: catId } }))?.isActive === false);
  await call("toggleCategoryActive", catId, true);
  check("reactivated", (await prisma.category.findUnique({ where: { id: catId } }))?.isActive === true);

  /* ---------------- Delete with products attached ---------------- */
  flow("Category delete unassigns products rather than deleting them");

  const collection = await prisma.collection.findFirstOrThrow({ where: { slug: "next" } });
  const prod = await prisma.product.create({
    data: {
      name: `ZZ CatProd ${stamp}`,
      slug: `zz-catprod-${stamp}`,
      sku: `ZZCATP-${stamp}`,
      collectionId: collection.id,
      categoryId: catId,
      isPublished: true,
    },
    select: { id: true },
  });
  check("product attached to the category", Boolean(prod.id));

  const del = await call("deleteCategory", catId);
  check("deleteCategory ok", del.result?.ok === true, JSON.stringify(del.result));
  check(
    "message names the affected product count",
    /1 products? (is|are) now uncategorised|1 products are now uncategorised/.test(del.result?.message ?? ""),
    del.result?.message,
  );
  check("category row gone", (await prisma.category.count({ where: { id: catId } })) === 0);

  const survivor = await prisma.product.findUnique({ where: { id: prod.id } });
  check("product NOT deleted with the category", survivor !== null);
  check("product categoryId set to null", survivor?.categoryId === null, `got ${survivor?.categoryId}`);

  const delMissing = await call("deleteCategory", "no-such-category");
  check("deleting a missing category handled", delMissing.result?.ok === false, JSON.stringify(delMissing.result));

  /* ---------------- Inline stock editing ---------------- */
  flow("Inline stock editing (updateStock wired to the products table)");

  await call("updateStock", prod.id, 25);
  check("stock set to 25", (await prisma.product.findUnique({ where: { id: prod.id } }))?.stock === 25);

  await call("updateStock", prod.id, 0);
  check("stock set to 0", (await prisma.product.findUnique({ where: { id: prod.id } }))?.stock === 0);

  const neg = await call("updateStock", prod.id, -1);
  check("negative rejected", neg.result?.ok === false, JSON.stringify(neg.result));
  check("stock unchanged after rejection", (await prisma.product.findUnique({ where: { id: prod.id } }))?.stock === 0);

  {
    /* ---------------- Inline price editing ---------------- */
    flow("Inline price editing — turning “Price on request” into a sellable product");

    // The unpriced fixture, not a catalogue product: demo prices
    // (scripts/demo-data.ts) may have been applied to the whole catalogue, and
    // this block asserts the unpriced -> priced -> unpriced round trip.
    const seeded = await prisma.product.findFirstOrThrow({ where: { sku: "ZZTEST-D" } });
    const originalPrice = seeded.price;
    const originalStock = seeded.stock;

    check("the unpriced fixture starts with no price", originalPrice === null, `got ${originalPrice}`);

    const setPrice = await call("updatePrice", seeded.id, 899);
    check("updatePrice ok", setPrice.result?.ok === true, JSON.stringify(setPrice.result));

    let priced = await prisma.product.findUnique({ where: { id: seeded.id } });
    check("rupees converted to paise (899 -> 89900)", priced?.price === 89900, `got ${priced?.price}`);
    check("hasPrice sort key set", priced?.hasPrice === true, `got ${priced?.hasPrice}`);
    check("sortPrice denormalised", priced?.sortPrice === 89900, `got ${priced?.sortPrice}`);
    check(
      "still needsReview (no description or image yet)",
      priced?.needsReview === true,
      "a price alone does not make a product complete",
    );

    const paise = await call("updatePrice", seeded.id, 1234.56);
    check("fractional rupees round to whole paise", paise.result?.ok === true, JSON.stringify(paise.result));
    priced = await prisma.product.findUnique({ where: { id: seeded.id } });
    check("1234.56 -> 123456 paise", priced?.price === 123456, `got ${priced?.price}`);

    const neg = await call("updatePrice", seeded.id, -5);
    check("negative price rejected", neg.result?.ok === false, JSON.stringify(neg.result));

    const huge = await call("updatePrice", seeded.id, 99_999_999);
    check("absurd price rejected", huge.result?.ok === false, JSON.stringify(huge.result));

    const missing = await call("updatePrice", "no-such-product", 100);
    check("missing product handled", missing.result?.ok === false, JSON.stringify(missing.result));

    // A markdown above the new price must not survive.
    await prisma.product.update({ where: { id: seeded.id }, data: { discountPrice: 100000 } });
    const lower = await call("updatePrice", seeded.id, 500);
    priced = await prisma.product.findUnique({ where: { id: seeded.id } });
    check("stale discount above the new price is cleared", priced?.discountPrice === null, `got ${priced?.discountPrice}`);
    check("message explains the discount removal", /discount/i.test(lower.result?.message ?? ""), lower.result?.message);

    // The storefront must now actually offer the product for sale.
    await call("updateStock", seeded.id, 12);
    const detail = await fetch(`${BASE}/products/${seeded.slug}`, { headers: { "x-forwarded-for": RUN_IP } });
    const detailHtml = await detail.text();
    check(
      "product page offers Add to Cart once priced",
      detailHtml.includes("Add to Cart") && !detailHtml.includes("Send Enquiry"),
      `status ${detail.status}`,
    );

    const resolved = await fetch(`${BASE}/api/cart/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
      body: JSON.stringify({ lines: [{ productId: seeded.id, quantity: 2 }] }),
    }).then((r) => r.json());
    check("cart resolves it at the price just set", resolved.lines?.[0]?.unitPrice === 50000, JSON.stringify(resolved.lines?.[0]));
    check("cart subtotal is correct", resolved.totals?.subtotal === 100000, JSON.stringify(resolved.totals));

    // Clearing the price sends it back to "Price on request".
    const cleared = await call("updatePrice", seeded.id, null);
    check("price can be cleared", cleared.result?.ok === true, JSON.stringify(cleared.result));
    priced = await prisma.product.findUnique({ where: { id: seeded.id } });
    check("price is null again", priced?.price === null, `got ${priced?.price}`);
    check("hasPrice cleared", priced?.hasPrice === false, `got ${priced?.hasPrice}`);
    check("needsReview raised again", priced?.needsReview === true);

    const detail2 = await fetch(`${BASE}/products/${seeded.slug}`, { headers: { "x-forwarded-for": RUN_IP } });
    const detail2Html = await detail2.text();
    // Assert on the purchase panel's own CTA, not the absence of "Add to Cart"
    // anywhere on the page: the related-products grid below carries its own
    // Add to Cart buttons for other (priced) products.
    check(
      "product page reverts to an enquiry",
      detail2Html.includes("Send Enquiry"),
      "purchase panel should offer Send Enquiry once the price is cleared",
    );

    // Leave the catalogue exactly as it was — no invented prices persist.
    await prisma.product.update({
      where: { id: seeded.id },
      data: { price: originalPrice, stock: originalStock, discountPrice: null },
    });
    const restored = await prisma.product.findUnique({ where: { id: seeded.id } });
    check(
      "fixture product restored to its original unpriced state",
      restored?.price === originalPrice && restored?.stock === originalStock,
      JSON.stringify({ price: restored?.price, stock: restored?.stock }),
    );
  }

  const productsPage = await fetch(`${BASE}/admin/products`, { headers: { cookie, "x-forwarded-for": RUN_IP } });
  const pHtml = await productsPage.text();
  check("/admin/products still renders", productsPage.status === 200, `got ${productsPage.status}`);
  check("stock cells are now clickable buttons", pHtml.includes("Click to edit stock"), "StockCell not found in markup");
  check("price cells are now clickable buttons", pHtml.includes("Click to edit the price"), "PriceCell not found in markup");

  /* ---------------- Non-admin blocked ---------------- */
  flow("Category action authorisation");

  const email = `e2e-cat-${stamp}@example.com`;
  await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ name: "Cat Tester", email, password: "Passw0rdTest", confirmPassword: "Passw0rdTest" }),
  });
  const adminCookie = cookie;
  await login(email, "Passw0rdTest");
  const blocked = await fetch(`${BASE}/api/e2e-harness`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-forwarded-for": RUN_IP },
    body: JSON.stringify({ action: "saveCategory", args: [null, { name: "Hack", slug: "hack" }] }),
    redirect: "manual",
  });
  check("non-admin cannot create categories", blocked.status >= 300, `got ${blocked.status}`);
  check("no category was created", (await prisma.category.count({ where: { slug: "hack" } })) === 0);
  cookie = adminCookie;

  const catPageAsUser = await fetch(`${BASE}/admin/categories`, {
    headers: {
      cookie: (
        await fetch(`${BASE}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": RUN_IP },
          body: JSON.stringify({ email, password: "Passw0rdTest" }),
        })
      ).headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; "),
    },
    redirect: "manual",
  });
  check(
    "non-admin blocked from /admin/categories",
    catPageAsUser.status === 307 && (catPageAsUser.headers.get("location") ?? "").includes("forbidden"),
    `${catPageAsUser.status} -> ${catPageAsUser.headers.get("location")}`,
  );

  /* cleanup */
  await prisma.product.deleteMany({ where: { sku: { startsWith: "ZZCATP-" } } });
  await prisma.user.deleteMany({ where: { email } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: "zz-cat" } } });

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
  console.error("CRASHED:", e);
  await prisma.$disconnect();
  process.exit(2);
});
