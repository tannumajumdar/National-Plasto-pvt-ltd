import { createHash } from "crypto";

import prisma from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validations";
import { clientIp, fail, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(`reset:${clientIp(request)}`, { limit: 10, windowMs: 900_000 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, resetPasswordSchema);
  if (error) return error;

  const tokenHash = createHash("sha256").update(data.token).digest("hex");

  const user = await prisma.user.findFirst({
    where: { resetToken: tokenHash, resetTokenExpiry: { gt: new Date() } },
    select: { id: true },
  });

  if (!user) {
    return fail("This reset link is invalid or has expired. Request a new one.", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(data.password),
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return ok({ message: "Your password has been reset. You can now sign in." });
}
