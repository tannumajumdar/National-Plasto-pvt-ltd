import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PageHeader } from "@/components/layout/page-header";
import prisma from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { getPaymentConfig } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    take: 4,
    select: {
      id: true, label: true, fullName: true, phone: true,
      line1: true, line2: true, city: true, state: true, pincode: true,
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Almost there"
        title="Checkout"
        crumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />

      <div className="container-page py-10 lg:py-14">
        <CheckoutForm
          user={{ name: user.name, email: user.email, phone: user.phone }}
          addresses={addresses}
          paymentConfig={getPaymentConfig()}
        />
      </div>
    </>
  );
}
