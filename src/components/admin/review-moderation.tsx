"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/products/rating-stars";
import { EASE } from "@/components/animations/motion-primitives";
import { moderateReview } from "@/lib/actions/misc";
import { cn, formatDateTime } from "@/lib/utils";

export interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  productName: string;
  productSlug: string;
}

export function ReviewModeration({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved">("pending");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const visible = reviews.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.isApproved : r.isApproved,
  );

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => !r.isApproved).length,
    approved: reviews.filter((r) => r.isApproved).length,
  };

  async function act(id: string, action: "approve" | "unapprove" | "delete") {
    setBusyId(id);
    try {
      const result = await moderateReview({ id, action });
      result.ok ? toast.success(result.message) : toast.error(result.message);
      router.refresh();
    } catch {
      toast.error("Could not update the review.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-5 flex gap-2">
        {(["pending", "approved", "all"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium capitalize transition-colors",
              filter === key
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-secondary",
            )}
            aria-pressed={filter === key}
          >
            {key}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                filter === key ? "bg-white/20" : "bg-secondary",
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No {filter === "all" ? "" : filter} reviews.
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visible.map((review) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-semibold">{review.authorName}</span>
                          <Badge variant={review.isApproved ? "success" : "warning"}>
                            {review.isApproved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {review.authorEmail} · {formatDateTime(review.createdAt)}
                        </p>
                      </div>

                      <RatingStars value={review.rating} size="sm" showEmpty={false} />
                    </div>

                    <Link
                      href={`/products/${review.productSlug}`}
                      target="_blank"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                    >
                      {review.productName}
                      <ExternalLink className="size-3.5" />
                    </Link>

                    {review.title && <p className="mt-3 font-medium">{review.title}</p>}
                    {review.body && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {review.body}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {review.isApproved ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busyId === review.id}
                          onClick={() => act(review.id, "unapprove")}
                        >
                          <Undo2 />
                          Unapprove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="accent"
                          loading={busyId === review.id}
                          onClick={() => act(review.id, "approve")}
                        >
                          <Check />
                          Approve
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        loading={busyId === review.id}
                        onClick={() => act(review.id, "delete")}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
