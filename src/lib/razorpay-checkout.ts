/**
 * Browser-side Razorpay checkout.
 *
 * Loads Razorpay's script on demand — it is never bundled, and never loaded at
 * all unless a customer actually chooses online payment.
 *
 * The result of this module is NOT proof of payment. Whatever comes back from
 * the checkout widget has to be posted to /api/payments/verify, which
 * recomputes the signature server-side before anything is marked paid.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loader: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in a browser."));
  if (window.Razorpay) return Promise.resolve();

  // Cache the promise so two clicks do not inject two script tags.
  loader ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        loader = null;
        reject(new Error("Could not load the payment window. Check your connection."));
      },
      { once: true },
    );

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return loader;
}

export interface PayOptions {
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  orderNumber: string;
  customer: { name: string; email: string; phone: string };
}

export type PayOutcome =
  | { status: "completed"; response: RazorpayHandlerResponse }
  | { status: "dismissed" }
  | { status: "failed"; message: string };

/**
 * Opens the Razorpay checkout and resolves once the customer finishes,
 * dismisses it, or the payment fails. Never rejects for a normal dismissal —
 * abandoning payment is an ordinary outcome, not an error.
 */
export async function payWithRazorpay(options: PayOptions): Promise<PayOutcome> {
  await loadScript();

  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("The payment window failed to initialise.");

  return new Promise<PayOutcome>((resolve) => {
    let settled = false;
    const settle = (outcome: PayOutcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };

    const instance = new Razorpay({
      key: options.keyId,
      order_id: options.razorpayOrderId,
      amount: options.amountPaise,
      currency: "INR",
      name: "National Plasto Pvt. Ltd.",
      description: `Order ${options.orderNumber}`,
      prefill: {
        name: options.customer.name,
        email: options.customer.email,
        contact: options.customer.phone,
      },
      notes: { orderNumber: options.orderNumber },
      theme: { color: "#f59e0b" },
      handler: (response: RazorpayHandlerResponse) => settle({ status: "completed", response }),
      modal: {
        ondismiss: () => settle({ status: "dismissed" }),
      },
    });

    instance.on("payment.failed", (payload: unknown) => {
      const description = (payload as { error?: { description?: string } })?.error?.description;
      settle({ status: "failed", message: description ?? "The payment did not go through." });
    });

    instance.open();
  });
}
