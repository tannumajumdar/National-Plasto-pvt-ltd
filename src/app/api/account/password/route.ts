import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validations";
import { clientIp, fail, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const limit = rateLimit(`pwchange:${user.id}:${clientIp(request)}`, {
    limit: 6,
    windowMs: 900_000,
  });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, changePasswordSchema);
  if (error) return error;

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return fail("Account not found.", 404);

  const valid = await verifyPassword(data.currentPassword, record.passwordHash);
  if (!valid) {
    return fail("Your current password is incorrect.", 400, {
      fields: { currentPassword: "Incorrect password." },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(data.password) },
  });

  return ok({ message: "Password updated." });
}
