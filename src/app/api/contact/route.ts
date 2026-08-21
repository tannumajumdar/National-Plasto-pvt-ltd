import prisma from "@/lib/db/prisma";
import { contactSchema } from "@/lib/validations";
import { clientIp, ok, parseBody, rateLimit, tooManyRequests } from "@/lib/api";
import { absoluteUrl } from "@/lib/utils";
import { getEmailStatus, sendEmail } from "@/lib/email";
import { contactNotificationEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request)}`, { limit: 5, windowMs: 600_000 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const { data, error } = await parseBody(request, contactSchema);
  if (error) return error;

  // The admin inbox is the source of truth. It is written first and always,
  // so an enquiry is never lost to an email outage.
  await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    },
  });

  // Notify the team as well, if a provider and a destination are configured.
  const notifyTo = process.env.CONTACT_NOTIFY_EMAIL;
  const emailStatus = getEmailStatus();

  if (notifyTo && emailStatus.configured) {
    void sendEmail(
      contactNotificationEmail({
        to: notifyTo,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        adminUrl: absoluteUrl("/admin/settings"),
      }),
    ).catch((err) => console.error("[contact] notification email failed:", err));
  }

  // "Received", not "sent" — the enquiry is stored either way, and this stays
  // true whether or not a notification actually went out.
  return ok({
    message: "Thank you — your message has been received. Our team will get back to you.",
  });
}
