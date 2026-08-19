import prisma from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validations";
import { clientIp, fail, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";

export async function POST(request: Request) {
  const limit = rateLimit(`register:${clientIp(request)}`, { limit: 5, windowMs: 600_000 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, registerSchema);
  if (error) return error;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return fail("An account with this email already exists.", 409, {
      fields: { email: "This email is already registered." },
    });
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      passwordHash: await hashPassword(data.password),
      role: "USER",
      cart: { create: {} },
      wishlist: { create: {} },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  await createSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return ok({ user }, { status: 201 });
}
