import prisma from "@/lib/db/prisma";
import { contactSchema } from "@/lib/validations";
import { clientIp, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request)}`, { limit: 5, windowMs: 600_000 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, contactSchema);
  if (error) return error;

  await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    },
  });

  // Stored for the admin inbox. No email is dispatched — no provider is
  // configured — so the confirmation deliberately says "received", not "sent".
  return ok({
    message: "Thank you — your message has been received. Our team will get back to you.",
  });
}
