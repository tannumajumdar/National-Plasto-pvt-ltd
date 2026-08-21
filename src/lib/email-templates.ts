import "server-only";

import type { EmailMessage } from "@/lib/email";
import { formatINR } from "@/lib/utils";

/**
 * Transactional email bodies.
 *
 * Plain, table-free HTML with a text alternative alongside — the two must say
 * the same thing, since plenty of clients show only the text part. Nothing
 * here invents company details: the address and phone shown are whatever the
 * caller passes in from the admin-editable contact content.
 */

const BRAND = "National Plasto Pvt. Ltd.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f5f5f4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 28px;border-bottom:1px solid #e7e5e4;">
      <strong style="font-size:16px;letter-spacing:-0.01em;">${BRAND}</strong>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${escapeHtml(heading)}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e7e5e4;font-size:12px;color:#78716c;">
      This is an automated message from ${BRAND}.
    </div>
  </div>
</body></html>`;
}

/* ------------------------------------------------------------------ */

export function passwordResetEmail(args: { to: string; name: string; link: string }): EmailMessage {
  const { to, name, link } = args;

  return {
    to,
    subject: "Reset your National Plasto password",
    html: layout(
      "Reset your password",
      `<p style="margin:0 0 16px;line-height:1.6;">Hello ${escapeHtml(name)},</p>
       <p style="margin:0 0 20px;line-height:1.6;">We received a request to reset your password. This link expires in one hour and can be used once.</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;">Choose a new password</a></p>
       <p style="margin:0 0 8px;line-height:1.6;font-size:13px;color:#78716c;">If the button does not work, paste this into your browser:</p>
       <p style="margin:0 0 20px;font-size:13px;word-break:break-all;color:#57534e;">${escapeHtml(link)}</p>
       <p style="margin:0;line-height:1.6;font-size:13px;color:#78716c;">If you did not ask for this, you can ignore this email — your password will not change.</p>`,
    ),
    text: [
      `Hello ${name},`,
      "",
      "We received a request to reset your National Plasto password.",
      "This link expires in one hour and can be used once:",
      "",
      link,
      "",
      "If you did not ask for this, ignore this email — your password will not change.",
    ].join("\n"),
  };
}

/* ------------------------------------------------------------------ */

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export function orderConfirmationEmail(args: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paid: boolean;
  address: string;
  orderUrl: string;
}): EmailMessage {
  const {
    to, customerName, orderNumber, items,
    subtotal, discount, shipping, total,
    paymentMethod, paid, address, orderUrl,
  } = args;

  const methodLabel = paymentMethod === "COD" ? "Cash on Delivery" : "Online payment";
  const paymentLine = paid
    ? "Payment received, thank you."
    : paymentMethod === "COD"
      ? "Please keep the amount ready for the delivery agent."
      : "No payment has been collected yet. Our team will be in touch.";

  const rowsHtml = items
    .map(
      (i) =>
        `<tr>
           <td style="padding:8px 0;border-bottom:1px solid #f5f5f4;">${escapeHtml(i.name)}<br><span style="color:#78716c;font-size:13px;">${formatINR(i.unitPrice)} &times; ${i.quantity}</span></td>
           <td style="padding:8px 0;border-bottom:1px solid #f5f5f4;text-align:right;white-space:nowrap;">${formatINR(i.lineTotal)}</td>
         </tr>`,
    )
    .join("");

  const totalsHtml = [
    ["Subtotal", formatINR(subtotal)],
    ...(discount > 0 ? [["Discount", `- ${formatINR(discount)}`]] : []),
    ["Shipping", shipping === 0 ? "Free" : formatINR(shipping)],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 0;color:#78716c;">${label}</td><td style="padding:4px 0;text-align:right;">${value}</td></tr>`,
    )
    .join("");

  return {
    to,
    subject: `Order ${orderNumber} confirmed — ${BRAND}`,
    html: layout(
      "Thank you for your order",
      `<p style="margin:0 0 16px;line-height:1.6;">Hello ${escapeHtml(customerName)}, we have recorded your order <strong>${escapeHtml(orderNumber)}</strong>.</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 12px;">${rowsHtml}</table>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 20px;">
         ${totalsHtml}
         <tr><td style="padding:10px 0 0;font-weight:700;border-top:1px solid #e7e5e4;">Total</td>
             <td style="padding:10px 0 0;font-weight:700;text-align:right;border-top:1px solid #e7e5e4;">${formatINR(total)}</td></tr>
       </table>
       <p style="margin:0 0 6px;font-weight:600;font-size:14px;">Delivery address</p>
       <p style="margin:0 0 20px;line-height:1.6;font-size:14px;color:#57534e;">${escapeHtml(address).replace(/\n/g, "<br>")}</p>
       <p style="margin:0 0 20px;line-height:1.6;font-size:14px;"><strong>${methodLabel}.</strong> ${escapeHtml(paymentLine)}</p>
       <p style="margin:0;"><a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;">View your order</a></p>`,
    ),
    text: [
      `Hello ${customerName},`,
      "",
      `We have recorded your order ${orderNumber}.`,
      "",
      ...items.map((i) => `  ${i.name} — ${formatINR(i.unitPrice)} x ${i.quantity} = ${formatINR(i.lineTotal)}`),
      "",
      `  Subtotal: ${formatINR(subtotal)}`,
      ...(discount > 0 ? [`  Discount: -${formatINR(discount)}`] : []),
      `  Shipping: ${shipping === 0 ? "Free" : formatINR(shipping)}`,
      `  Total:    ${formatINR(total)}`,
      "",
      "Delivery address:",
      address,
      "",
      `${methodLabel}. ${paymentLine}`,
      "",
      `View your order: ${orderUrl}`,
    ].join("\n"),
  };
}

/* ------------------------------------------------------------------ */

export function contactNotificationEmail(args: {
  to: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  adminUrl: string;
}): EmailMessage {
  const { to, name, email, phone, subject, message, adminUrl } = args;

  return {
    to,
    // Reply goes straight back to the enquirer, not to the site mailbox.
    replyTo: email,
    subject: `Website enquiry: ${subject}`,
    html: layout(
      "New website enquiry",
      `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 20px;">
         <tr><td style="padding:6px 0;color:#78716c;width:90px;">From</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
         <tr><td style="padding:6px 0;color:#78716c;">Email</td><td style="padding:6px 0;">${escapeHtml(email)}</td></tr>
         ${phone ? `<tr><td style="padding:6px 0;color:#78716c;">Phone</td><td style="padding:6px 0;">${escapeHtml(phone)}</td></tr>` : ""}
         <tr><td style="padding:6px 0;color:#78716c;">Subject</td><td style="padding:6px 0;">${escapeHtml(subject)}</td></tr>
       </table>
       <p style="margin:0 0 20px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
       <p style="margin:0;"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;">Open the admin inbox</a></p>`,
    ),
    text: [
      "New website enquiry",
      "",
      `From:    ${name}`,
      `Email:   ${email}`,
      ...(phone ? [`Phone:   ${phone}`] : []),
      `Subject: ${subject}`,
      "",
      message,
      "",
      `Admin inbox: ${adminUrl}`,
    ].join("\n"),
  };
}
