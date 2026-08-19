import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { WishlistView } from "@/components/products/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you have saved from the National Plasto catalogue.",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Saved for later"
        title="My Wishlist"
        crumbs={[{ label: "Wishlist" }]}
      />

      <div className="container-page py-10 lg:py-14">
        <WishlistView />
      </div>
    </>
  );
}
