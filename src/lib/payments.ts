/**
 * Payment configuration.
 *
 * Razorpay is wired as an architecture, not as a working integration: no keys
 * are bundled and nothing fabricates a successful payment. Online payment
 * stays unavailable until PAYMENTS_ENABLED is "true" AND both Razorpay keys
 * are present, at which point `createRazorpayOrder` below is the single place
 * that needs implementing.
 */

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

/**
 * Creates a Razorpay order for the given amount (paise).
 *
 * INTENTIONALLY UNIMPLEMENTED. Implement against the Razorpay Orders API and
 * return the real order id; the checkout flow will then hand it to the
 * Razorpay checkout script. Do not stub a success response here — an order
 * must never be marked paid without a verified payment.
 */
export async function createRazorpayOrder(_amountPaise: number, _receipt: string): Promise<never> {
  throw new Error(
    "Razorpay order creation is not implemented. Implement createRazorpayOrder() in src/lib/payments.ts before enabling online payments.",
  );
}

/**
 * Verifies a Razorpay payment signature.
 *
 * INTENTIONALLY UNIMPLEMENTED. Verify the HMAC-SHA256 of
 * `${razorpayOrderId}|${razorpayPaymentId}` using RAZORPAY_KEY_SECRET before
 * marking any order as paid.
 */
export async function verifyRazorpaySignature(_args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<never> {
  throw new Error(
    "Razorpay signature verification is not implemented. Implement verifyRazorpaySignature() in src/lib/payments.ts before enabling online payments.",
  );
}
