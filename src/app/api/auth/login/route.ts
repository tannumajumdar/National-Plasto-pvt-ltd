import prisma from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations";
import { clientIp, fail, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";

export async function POST(request: Request) {
  const limit = rateLimit(`login:${clientIp(request)}`, { limit: 10, windowMs: 300_000 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, loginSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Identical response for unknown email and wrong password, so the endpoint
  // cannot be used to enumerate registered accounts.
  const valid = user ? await verifyPassword(data.password, user.passwordHash) : false;
  if (!user || !valid) return fail("Incorrect email or password.", 401);

  if (!user.isActive) {
    return fail("This account has been deactivated. Please contact support.", 403);
  }

  await createSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return ok({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
