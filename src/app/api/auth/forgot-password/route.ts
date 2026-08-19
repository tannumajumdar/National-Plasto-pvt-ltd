import { randomBytes, createHash } from "crypto";

import prisma from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { clientIp, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Issues a password-reset token.
 *
 * No email provider is configured in this project, so nothing is actually
 * delivered. The response is deliberately identical whether or not the email
 * exists (no account enumeration), and the reset link is returned/logged ONLY
 * outside production so the flow is testable. Wire an email service here
 * before going live.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`forgot:${clientIp(request)}`, { limit: 5, windowMs: 900_000 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, forgotPasswordSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

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
    if (process.env.NODE_ENV !== "production") {
      console.info(`[forgot-password] reset link for ${data.email}: ${link}`);
      devLink = link;
    }
  }

  return ok({
    message:
      "If an account exists for that email, a password reset link has been issued.",
    emailConfigured: false,
    ...(devLink ? { devResetLink: devLink } : {}),
  });
}
