import { randomBytes, createHash } from "crypto";

import prisma from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { clientIp, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";
import { absoluteUrl } from "@/lib/utils";
import { getEmailStatus, sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

/**
 * Issues a password-reset token.
 *
 * The response is deliberately identical whether or not the email exists, so
 * this cannot be used to discover which addresses have accounts — that is also
 * why a delivery failure is logged rather than reported to the caller.
 *
 * Delivery goes through src/lib/email.ts. With no provider configured the
 * console driver prints the message instead of sending it, and the link is
 * additionally returned in the response outside production so the flow stays
 * testable.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`forgot:${clientIp(request)}`, { limit: 5, windowMs: 900_000 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, forgotPasswordSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, name: true },
  });

  const emailStatus = getEmailStatus();
  let devLink: string | undefined;

  if (user) {
    const raw = randomBytes(32).toString("base64url");
    // Only the hash is stored, so a database leak cannot be used to reset.
    const tokenHash = createHash("sha256").update(raw).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const link = absoluteUrl(`/reset-password?token=${raw}`);

    // Send if a provider is configured; the console driver logs it instead.
    // Failure is not surfaced to the caller — that would reveal whether the
    // account exists, which the identical-response rule below exists to hide.
    const sent = await sendEmail(
      passwordResetEmail({ to: data.email, name: user.name, link }),
    );
    if (!sent.ok) {
      console.error(`[forgot-password] could not email ${data.email}:`, sent.error);
    }

    // Outside production the link is also returned, so the flow is testable
    // with no provider configured.
    if (process.env.NODE_ENV !== "production") devLink = link;
  }

  return ok({
    message:
      "If an account exists for that email, a password reset link has been issued.",
    emailConfigured: emailStatus.configured,
    ...(devLink ? { devResetLink: devLink } : {}),
  });
}
