import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Database,
  HardDrive,
  Mail,
  Server,
  Shield,
} from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { MessageInbox } from "@/components/admin/message-inbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { getPaymentConfig } from "@/lib/payments";
import { SITE } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { FLAT_SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const payments = getPaymentConfig();

  const rows = await prisma.contactMessage.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 60,
  });

  const messages = rows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  }));

  /* Integration status is reported honestly — nothing claims to be working
     that has not actually been configured. */
  const integrations = [
    {
      icon: CreditCard,
      name: "Online payments (Razorpay)",
      configured: payments.onlineEnabled,
      detail: payments.onlineEnabled
        ? "Razorpay keys are present and online payment is enabled."
        : "Not configured. Orders can still be placed with Cash on Delivery. To enable online payment, set PAYMENTS_ENABLED=true with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then implement createRazorpayOrder() and verifyRazorpaySignature() in src/lib/payments.ts.",
    },
    {
      icon: Mail,
      name: "Transactional email",
      configured: false,
      detail:
        "No email provider is wired up. Contact enquiries are saved to the inbox below, and password-reset links are logged to the server console in development instead of being emailed.",
    },
    {
      icon: HardDrive,
      name: "Image storage",
      configured: true,
      detail:
        "Uploads are written to public/uploads and served directly. Back this folder up with your database, or swap in a CDN driver later.",
    },
    {
      icon: Database,
      name: "Database",
      configured: true,
      detail: "MySQL via Prisma. Schema is managed with prisma migrate.",
    },
  ];

  return (
    <>
      <AdminTopbar
        title="Settings"
        description="Store configuration, integrations and enquiries"
        crumbs={[{ label: "Settings" }]}
        menuSlot={<AdminMenuButton />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Store info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="size-4 text-accent" />
                Store
              </CardTitle>
              <CardDescription>
                Editable content lives in{" "}
                <Link href="/admin/content" className="font-medium text-accent hover:underline">
                  Homepage &amp; Content
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <Row label="Store name" value={SITE.name} />
                <Row label="Location" value={`${SITE.city}, ${SITE.state}`} />
                <Row label="Currency" value="Indian Rupee (₹)" />
                <Row label="Free shipping above" value={formatINR(FREE_SHIPPING_THRESHOLD)} />
                <Row label="Flat shipping rate" value={formatINR(FLAT_SHIPPING_RATE)} />
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Shipping thresholds are defined in{" "}
                <code className="rounded bg-secondary px-1 py-0.5">src/lib/constants.ts</code>.
              </p>
            </CardContent>
          </Card>

          {/* Signed-in admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4 text-accent" />
                Your account
              </CardTitle>
              <CardDescription>Currently signed in as an administrator.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <Row label="Name" value={admin.name} />
                <Row label="Email" value={admin.email} />
                <Row label="Role" value="Administrator" />
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Change your password from{" "}
                <Link href="/account" className="font-medium text-accent hover:underline">
                  your profile
                </Link>
                . If you are still using the seeded password, change it now.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
            <CardDescription>
              What is actually configured on this installation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {integrations.map((item) => (
                <li key={item.name} className="flex gap-4 rounded-xl border border-border p-4">
                  <span
                    className={
                      item.configured
                        ? "grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                        : "grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400"
                    }
                  >
                    <item.icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.name}</p>
                      <Badge variant={item.configured ? "success" : "warning"}>
                        {item.configured ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            Configured
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="size-3" />
                            Not configured
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Enquiries */}
        <Card id="messages">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-accent" />
              Contact enquiries
            </CardTitle>
            <CardDescription>
              Messages submitted through the contact form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageInbox messages={messages} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
