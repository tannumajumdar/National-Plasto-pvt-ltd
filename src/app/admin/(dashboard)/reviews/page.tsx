import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { EmptyState } from "@/components/ui/empty-state";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  const rows = await prisma.review.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true, rating: true, title: true, body: true,
      isApproved: true, createdAt: true,
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  const reviews = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isApproved: r.isApproved,
    createdAt: r.createdAt.toISOString(),
    authorName: r.user.name,
    authorEmail: r.user.email,
    productName: r.product.name,
    productSlug: r.product.slug,
  }));

  const pending = reviews.filter((r) => !r.isApproved).length;

  return (
    <>
      <AdminTopbar
        title="Reviews"
        description={
          pending > 0
            ? `${pending} awaiting approval`
            : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`
        }
        crumbs={[{ label: "Reviews" }]}
        menuSlot={<AdminMenuButton />}
      />

      <div className="p-5 sm:p-8">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Customer reviews appear here for approval before they show on the storefront."
            />
          </div>
        ) : (
          <ReviewModeration reviews={reviews} />
        )}
      </div>
    </>
  );
}
