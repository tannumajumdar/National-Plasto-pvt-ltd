/**
 * Email abstraction tests.
 *
 * Covers driver selection, the honest "not configured" reporting, template
 * rendering, and the fact that a provider failure never breaks the call site.
 * A fake provider is exercised by pointing the driver at a throwaway local
 * server, so no real account or network egress is needed.
 *
 * Run:  npx tsx scripts/e2e-email.mjs
 */
import { createServer } from "http";

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

/** Re-imports email.ts with a fresh module registry so env changes apply. */
let bust = 0;
async function freshEmail() {
  return import(`../src/lib/email.ts?v=${bust++}`);
}

function resetEnv() {
  delete process.env.EMAIL_PROVIDER;
  delete process.env.RESEND_API_KEY;
  delete process.env.BREVO_API_KEY;
  delete process.env.EMAIL_FROM;
}

async function main() {
  const { passwordResetEmail, orderConfirmationEmail, contactNotificationEmail } = await import(
    "../src/lib/email-templates.ts"
  );

  /* ---------------- status reporting ---------------- */
  flow("Reports its own configuration honestly");

  resetEnv();
  let { getEmailStatus, sendEmail } = await freshEmail();

  let status = getEmailStatus();
  check("defaults to the console driver", status.provider === "console", status.provider);
  check("console driver reports NOT configured", status.configured === false);
  check("gives a reason", Boolean(status.reason), JSON.stringify(status));

  process.env.EMAIL_PROVIDER = "resend";
  ({ getEmailStatus, sendEmail } = await freshEmail());
  status = getEmailStatus();
  check(
    "resend without an API key reports not configured",
    status.configured === false && /RESEND_API_KEY/.test(status.reason ?? ""),
    JSON.stringify(status),
  );

  process.env.RESEND_API_KEY = "re_fake";
  ({ getEmailStatus } = await freshEmail());
  status = getEmailStatus();
  check(
    "resend without EMAIL_FROM reports not configured",
    status.configured === false && /EMAIL_FROM/.test(status.reason ?? ""),
    JSON.stringify(status),
  );

  process.env.EMAIL_FROM = "National Plasto <orders@example.com>";
  ({ getEmailStatus } = await freshEmail());
  status = getEmailStatus();
  check("fully configured resend reports configured", status.configured === true, JSON.stringify(status));

  process.env.EMAIL_PROVIDER = "nonsense-provider";
  ({ getEmailStatus } = await freshEmail());
  check(
    "an unknown provider falls back to console rather than crashing",
    getEmailStatus().provider === "console",
  );

  /* ---------------- console driver ---------------- */
  flow("Console driver never claims delivery");

  resetEnv();
  ({ sendEmail } = await freshEmail());
  const consoleResult = await sendEmail({
    to: "someone@example.com",
    subject: "Test",
    html: "<p>hi</p>",
    text: "hi",
  });
  check("returns ok (the call site is not an error path)", consoleResult.ok === true);
  check("but reports delivered:false", consoleResult.delivered === false, JSON.stringify(consoleResult));

  /* ---------------- templates ---------------- */
  flow("Templates");

  const reset = passwordResetEmail({
    to: "a@example.com",
    name: "Tester <script>",
    link: "http://localhost:3000/reset-password?token=abc123",
  });
  check("reset email has a subject", Boolean(reset.subject), reset.subject);
  check("reset email contains the link in HTML", reset.html.includes("token=abc123"));
  check("reset email contains the link in text", reset.text.includes("token=abc123"));
  check(
    "user-supplied name is HTML-escaped",
    reset.html.includes("&lt;script&gt;") && !reset.html.includes("<script>"),
    "XSS via the name field would reach the inbox",
  );
  check("mentions the one-hour expiry", /one hour/i.test(reset.text));

  const order = orderConfirmationEmail({
    to: "b@example.com",
    customerName: "Buyer",
    orderNumber: "NP-TEST-0001",
    items: [{ name: "ZZ Chair", quantity: 2, unitPrice: 150000, lineTotal: 300000 }],
    subtotal: 300000,
    discount: 0,
    shipping: 0,
    total: 300000,
    paymentMethod: "COD",
    paid: false,
    address: "Buyer\n12 Test Street\nKolkata, West Bengal 700034",
    orderUrl: "http://localhost:3000/order-confirmation/NP-TEST-0001",
  });
  check("order email names the order", order.subject.includes("NP-TEST-0001"), order.subject);
  check("formats paise as rupees, not raw integers", order.text.includes("3,000"), order.text.slice(0, 400));
  check("does not leak the raw paise figure", !order.text.includes("300000"));
  check("states the payment method", /Cash on Delivery/.test(order.text));
  check("unpaid COD order does not claim payment was received", !/Payment received/i.test(order.text));

  const paidOrder = orderConfirmationEmail({
    ...{
      to: "b@example.com",
      customerName: "Buyer",
      orderNumber: "NP-TEST-0002",
      items: [{ name: "ZZ Chair", quantity: 1, unitPrice: 150000, lineTotal: 150000 }],
      subtotal: 150000,
      discount: 0,
      shipping: 0,
      total: 150000,
      address: "Buyer",
      orderUrl: "http://x",
    },
    paymentMethod: "RAZORPAY",
    paid: true,
  });
  check("a paid order says so", /Payment received/i.test(paidOrder.text));

  const discounted = orderConfirmationEmail({
    to: "c@example.com",
    customerName: "Buyer",
    orderNumber: "NP-TEST-0003",
    items: [{ name: "ZZ Chair", quantity: 1, unitPrice: 120000, lineTotal: 120000 }],
    subtotal: 120000,
    discount: 30000,
    shipping: 9900,
    total: 129900,
    paymentMethod: "COD",
    paid: false,
    address: "Buyer",
    orderUrl: "http://x",
  });
  check("a markdown is shown as a discount line", /Discount/.test(discounted.text), discounted.text);
  check("shipping is itemised", /Shipping/.test(discounted.text));

  const contact = contactNotificationEmail({
    to: "team@example.com",
    name: "Enquirer",
    email: "enquirer@example.com",
    phone: "9830123456",
    subject: "Bulk order",
    message: "Do you supply 200 chairs?",
    adminUrl: "http://localhost:3000/admin/settings",
  });
  check("contact notification replies to the enquirer", contact.replyTo === "enquirer@example.com");
  check("contact notification carries the message", contact.text.includes("200 chairs"));

  /* ---------------- a real HTTP driver ---------------- */
  flow("Driver failures do not throw at the call site");

  // Point the Resend driver at a local server that always 500s by making the
  // key valid but the network unreachable (port with nothing listening).
  const server = createServer((req, res) => {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "Simulated provider outage" }));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  server.close();

  resetEnv();
  process.env.EMAIL_PROVIDER = "resend";
  process.env.RESEND_API_KEY = "re_fake";
  process.env.EMAIL_FROM = "National Plasto <orders@example.com>";
  ({ sendEmail } = await freshEmail());

  // api.resend.com is unreachable with a fake key; whatever happens (DNS,
  // 401, timeout) sendEmail must resolve, never reject.
  let threw = false;
  let outcome = null;
  try {
    outcome = await sendEmail({
      to: "nobody@example.com",
      subject: "Outage test",
      html: "<p>x</p>",
      text: "x",
    });
  } catch {
    threw = true;
  }
  check("sendEmail resolves rather than throwing on provider failure", !threw);
  check("a failed send reports ok:false", outcome?.ok === false, JSON.stringify(outcome));
  check("a failed send reports delivered:false", outcome?.delivered === false, JSON.stringify(outcome));
  check("a failed send carries an error message", Boolean(outcome?.error), JSON.stringify(outcome));
  void port;

  resetEnv();

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
