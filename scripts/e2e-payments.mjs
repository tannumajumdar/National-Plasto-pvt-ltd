/**
 * Razorpay signature verification tests.
 *
 * Runs in-process against the real implementation with throwaway keys — no
 * network, no Razorpay account needed. This is the security-critical half of
 * the integration, so it is tested independently of the HTTP flow.
 *
 * Run:  npx tsx scripts/e2e-payments.mjs
 */
import { createHmac } from "crypto";

const results = [];
function check(label, condition, detail) {
  const passed = Boolean(condition);
  results.push({ label, passed, detail });
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${label}`);
  if (!passed && detail !== undefined) console.log(`        ${detail}`);
}

const KEY_ID = "rzp_test_e2eFAKEKEYID";
const KEY_SECRET = "e2e_fake_secret_do_not_use";
const WEBHOOK_SECRET = "e2e_fake_webhook_secret";

async function main() {
  console.log("\n=== Razorpay signature verification ===");

  // Configure BEFORE importing: getPaymentConfig reads process.env at call time,
  // but being explicit here documents what the module needs.
  process.env.PAYMENTS_ENABLED = "true";
  process.env.RAZORPAY_KEY_ID = KEY_ID;
  process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

  const { verifyRazorpaySignature, verifyRazorpayWebhook, createRazorpayOrder, PaymentError } =
    await import("../src/lib/payments.ts");

  const orderId = "order_e2eABC123";
  const paymentId = "pay_e2eXYZ789";

  const good = createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");

  check(
    "a genuine signature verifies",
    await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: good,
    }),
    "correct HMAC was rejected",
  );

  check(
    "a tampered signature is rejected",
    !(await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: good.slice(0, -1) + (good.endsWith("a") ? "b" : "a"),
    })),
    "a forged signature was accepted",
  );

  check(
    "a signature for a DIFFERENT order is rejected",
    !(await verifyRazorpaySignature({
      razorpayOrderId: "order_somethingElse",
      razorpayPaymentId: paymentId,
      signature: good,
    })),
    "signature replay across orders was accepted",
  );

  check(
    "a signature for a different payment id is rejected",
    !(await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: "pay_different",
      signature: good,
    })),
  );

  const wrongKey = createHmac("sha256", "some_other_secret")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  check(
    "a signature made with the wrong secret is rejected",
    !(await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: wrongKey,
    })),
  );

  check(
    "an empty signature is rejected",
    !(await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: "",
    })),
  );

  check(
    "a short signature is rejected without throwing",
    !(await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: "abc",
    })),
    "length mismatch must not crash timingSafeEqual",
  );

  check(
    "a long signature is rejected without throwing",
    !(await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: good + "deadbeef",
    })),
  );

  /* ---------------- webhook ---------------- */
  console.log("\n=== Razorpay webhook verification ===");

  const rawBody = JSON.stringify({ event: "payment.captured", payload: { id: paymentId } });
  const webhookSig = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");

  check("a genuine webhook signature verifies", verifyRazorpayWebhook(rawBody, webhookSig));
  check("a tampered webhook body is rejected", !verifyRazorpayWebhook(rawBody + " ", webhookSig));
  check("an empty webhook signature is rejected", !verifyRazorpayWebhook(rawBody, ""));
  check(
    "the checkout secret does not validate webhooks",
    !verifyRazorpayWebhook(
      rawBody,
      createHmac("sha256", KEY_SECRET).update(rawBody).digest("hex"),
    ),
  );

  /* ---------------- disabled state ---------------- */
  console.log("\n=== Refuses to operate unconfigured ===");

  process.env.PAYMENTS_ENABLED = "false";
  let threw = null;
  try {
    await verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: good,
    });
  } catch (e) {
    threw = e;
  }
  check(
    "verification throws PaymentError when payments are disabled",
    threw instanceof PaymentError,
    `got ${threw}`,
  );

  let orderThrew = null;
  try {
    await createRazorpayOrder(150000, "NP-TEST");
  } catch (e) {
    orderThrew = e;
  }
  check(
    "order creation throws PaymentError when payments are disabled",
    orderThrew instanceof PaymentError,
    `got ${orderThrew}`,
  );

  process.env.PAYMENTS_ENABLED = "true";
  let tinyThrew = null;
  try {
    await createRazorpayOrder(50, "NP-TEST");
  } catch (e) {
    tinyThrew = e;
  }
  check(
    "an amount below ₹1 is refused before any network call",
    tinyThrew instanceof PaymentError,
    `got ${tinyThrew}`,
  );

  let floatThrew = null;
  try {
    await createRazorpayOrder(1500.5, "NP-TEST");
  } catch (e) {
    floatThrew = e;
  }
  check(
    "a fractional paise amount is refused",
    floatThrew instanceof PaymentError,
    `got ${floatThrew}`,
  );

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL ${results.length}   PASS ${results.length - failed.length}   FAIL ${failed.length}`);
  if (failed.length) for (const f of failed) console.log(`  FAIL ${f.label}: ${f.detail ?? ""}`);
  console.log("=".repeat(60));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("CRASHED:", e);
  process.exit(2);
});
