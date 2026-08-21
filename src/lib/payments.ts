/**
 * Razorpay integration.
 *
 * The flow is implemented end to end but stays switched OFF until
 * PAYMENTS_ENABLED is "true" AND both keys are present — no keys are bundled,
 * and nothing here fabricates a successful payment.
 *
 * The security rule that shapes this file: an order becomes PAID only when
 * `verifyRazorpaySignature` recomputes Razorpay's HMAC and it matches. The
 * browser's success callback is not evidence of anything, because anyone can
 * post that callback's payload to our endpoint.
 */

import { createHmac, timingSafeEqual } from "crypto";

export type PaymentMethodValue = "COD" | "RAZORPAY";

export interface PaymentConfig {
  /** True only when online payment is fully configured. */
  onlineEnabled: boolean;
  /** Public key id, safe to expose to the browser. Empty when not configured. */
  publicKeyId: string;
  methods: {
    value: PaymentMethodValue;
    label: string;
    description: string;
    available: boolean;
    unavailableReason?: string;
  }[];
}

export function getPaymentConfig(): PaymentConfig {
  const flagOn = process.env.PAYMENTS_ENABLED === "true";
  const hasKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const onlineEnabled = flagOn && hasKeys;

  return {
    onlineEnabled,
    publicKeyId: onlineEnabled ? (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "") : "",
    methods: [
      {
        value: "COD",
        label: "Cash on Delivery",
        description: "Pay in cash when your order is delivered.",
        available: true,
      },
      {
        value: "RAZORPAY",
        label: "Pay Online (Razorpay)",
        description: onlineEnabled
          ? "Cards, UPI, net banking and wallets via Razorpay."
          : "Card, UPI and net banking payments.",
        available: onlineEnabled,
        unavailableReason: onlineEnabled
          ? undefined
          : !flagOn
            ? "Online payment is not enabled yet."
            : "Razorpay keys have not been configured.",
      },
    ],
  };
}

/** Server-side guard — never trust the method sent by the browser. */
export function assertMethodAllowed(method: PaymentMethodValue): {
  allowed: boolean;
  reason?: string;
} {
  if (method === "COD") return { allowed: true };

  const { onlineEnabled } = getPaymentConfig();
  if (!onlineEnabled) {
    return {
      allowed: false,
      reason:
        "Online payment is not configured. Set PAYMENTS_ENABLED=true and provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the server.",
    };
  }
  return { allowed: true };
}

/** Thrown when Razorpay is called but not usable, or refuses the request. */
export class PaymentError extends Error {}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

function razorpayCredentials(): { keyId: string; keySecret: string } {
  const { onlineEnabled } = getPaymentConfig();
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";

  if (!onlineEnabled || !keyId || !keySecret) {
    throw new PaymentError(
      "Razorpay is not configured. Set PAYMENTS_ENABLED=true with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the server.",
    );
  }
  return { keyId, keySecret };
}

/**
 * Creates a Razorpay order for the given amount, in paise.
 *
 * The amount is always the server-computed order total — never a figure the
 * browser supplied. Returns the real Razorpay order, whose `id` the checkout
 * script needs. This records an *intent to pay*; nothing here marks anything
 * paid. Only `verifyRazorpaySignature` can justify that.
 */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
): Promise<RazorpayOrder> {
  const { keyId, keySecret } = razorpayCredentials();

  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    // Razorpay's own floor is ₹1. Catching it here gives a clearer error than
    // a 400 from their API.
    throw new PaymentError("Order amount must be a whole number of paise, at least 100 (₹1).");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  let response: Response;
  try {
    response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        // Razorpay caps the receipt at 40 characters.
        receipt: receipt.slice(0, 40),
        payment_capture: 1,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new PaymentError(
      `Could not reach Razorpay: ${err instanceof Error ? err.message : "network error"}`,
    );
  }

  const body = (await response.json().catch(() => null)) as
    | (RazorpayOrder & { error?: { description?: string } })
    | null;

  if (!response.ok || !body?.id) {
    throw new PaymentError(
      body?.error?.description ?? `Razorpay rejected the order request (HTTP ${response.status}).`,
    );
  }

  return {
    id: body.id,
    amount: body.amount,
    currency: body.currency,
    receipt: body.receipt,
    status: body.status,
  };
}

/**
 * Verifies a Razorpay payment signature.
 *
 * Razorpay signs `${orderId}|${paymentId}` with HMAC-SHA256 keyed on the
 * secret. Recomputing that and comparing is the ONLY thing that proves a
 * payment happened — the browser's success callback proves nothing, since
 * anyone can post to our endpoint.
 *
 * The comparison is timing-safe, and returns a boolean rather than throwing on
 * mismatch so callers must decide explicitly what a failed payment means.
 */
export async function verifyRazorpaySignature(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<boolean> {
  const { keySecret } = razorpayCredentials();

  const { razorpayOrderId, razorpayPaymentId, signature } = args;
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;

  const expected = createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself leak a bit
  // of information, so compare lengths first and bail on the cheap check.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/**
 * Verifies a Razorpay webhook payload.
 *
 * Webhooks are signed over the RAW request body with RAZORPAY_WEBHOOK_SECRET —
 * a different secret from the API key, and a different payload from the
 * checkout signature above. Pass the body exactly as received; re-serialising
 * parsed JSON will not match.
 */
export function verifyRazorpayWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
