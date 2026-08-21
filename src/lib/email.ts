import "server-only";

/**
 * Transactional email.
 *
 * One small abstraction over whichever provider the client ends up buying, so
 * the call sites never change. Drivers talk to plain REST APIs over `fetch` —
 * no SDK, so switching providers costs nothing and adds no dependencies.
 *
 * Selected with EMAIL_PROVIDER:
 *
 *   console  (default) — logs the message to the server console. Nothing is
 *                        delivered. This is honest, not a stub that pretends.
 *   resend             — https://resend.com, needs RESEND_API_KEY
 *   brevo              — https://brevo.com,  needs BREVO_API_KEY
 *
 * Every driver also needs EMAIL_FROM, e.g.
 *   EMAIL_FROM="National Plasto <orders@nationalplasto.com>"
 *
 * Sending NEVER throws. A failed email must not roll back a paid order or a
 * successful registration, so callers get a result object and decide.
 */

export type EmailProvider = "console" | "resend" | "brevo";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  /** True when a real provider accepted the message. */
  delivered: boolean;
  provider: EmailProvider;
  id?: string;
  error?: string;
}

export interface EmailStatus {
  provider: EmailProvider;
  configured: boolean;
  from: string;
  reason?: string;
}

function providerName(): EmailProvider {
  const raw = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();
  return raw === "resend" || raw === "brevo" ? raw : "console";
}

/** What Admin → Settings → Integrations reports. Never guesses. */
export function getEmailStatus(): EmailStatus {
  const provider = providerName();
  const from = process.env.EMAIL_FROM ?? "";

  if (provider === "console") {
    return {
      provider,
      configured: false,
      from,
      reason:
        "No email provider is configured. Messages are written to the server console instead of being delivered.",
    };
  }

  const key = provider === "resend" ? process.env.RESEND_API_KEY : process.env.BREVO_API_KEY;
  if (!key) {
    return {
      provider,
      configured: false,
      from,
      reason: `EMAIL_PROVIDER is "${provider}" but ${
        provider === "resend" ? "RESEND_API_KEY" : "BREVO_API_KEY"
      } is not set.`,
    };
  }
  if (!from) {
    return { provider, configured: false, from, reason: "EMAIL_FROM is not set." };
  }

  return { provider, configured: true, from };
}

/** Splits `Name <addr@example.com>` into its parts. */
function parseFrom(value: string): { name: string; email: string } {
  const match = /^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/.exec(value);
  if (match) return { name: match[1] || "National Plasto", email: match[2] };
  return { name: "National Plasto", email: value.trim() };
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const status = getEmailStatus();

  if (!status.configured) {
    console.info(
      `\n[email:${status.provider}] NOT DELIVERED — ${status.reason}\n` +
        `  to:      ${message.to}\n` +
        `  subject: ${message.subject}\n` +
        `${message.text
          .split("\n")
          .map((l) => `  | ${l}`)
          .join("\n")}\n`,
    );
    return { ok: true, delivered: false, provider: status.provider };
  }

  try {
    return status.provider === "resend"
      ? await sendViaResend(message, status.from)
      : await sendViaBrevo(message, status.from);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown email error";
    console.error(`[email:${status.provider}] send failed:`, error);
    return { ok: false, delivered: false, provider: status.provider, error };
  }
}

async function sendViaResend(message: EmailMessage, from: string): Promise<SendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!res.ok) {
    return {
      ok: false,
      delivered: false,
      provider: "resend",
      error: body?.message ?? `Resend returned HTTP ${res.status}`,
    };
  }
  return { ok: true, delivered: true, provider: "resend", id: body?.id };
}

async function sendViaBrevo(message: EmailMessage, from: string): Promise<SendResult> {
  const sender = parseFrom(from);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY ?? "",
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await res.json().catch(() => null)) as
    | { messageId?: string; message?: string }
    | null;
  if (!res.ok) {
    return {
      ok: false,
      delivered: false,
      provider: "brevo",
      error: body?.message ?? `Brevo returned HTTP ${res.status}`,
    };
  }
  return { ok: true, delivered: true, provider: "brevo", id: body?.messageId };
}
