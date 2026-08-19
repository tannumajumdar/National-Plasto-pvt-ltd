import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review the products in your National Plasto cart before checking out.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const user = await getCurrentUser();

  return (
    <>
      <PageHeader
        eyebrow="Your order"
        title="Shopping Cart"
        crumbs={[{ label: "Cart" }]}
      />

      <div className="container-page py-10 lg:py-14">
        <CartView signedIn={Boolean(user)} />
      </div>
    </>
  );
}
