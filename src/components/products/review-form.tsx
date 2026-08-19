"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, PenLine, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EASE } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  // Resolved per-visitor so the product page itself stays statically cached.
  const [status, setStatus] = React.useState<{
    signedIn: boolean;
    alreadyReviewed: boolean;
  } | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/reviews/status?productId=${encodeURIComponent(productId)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { signedIn: false, alreadyReviewed: false }))
      .then(setStatus)
      .catch((err) => {
        if (err?.name !== "AbortError") setStatus({ signedIn: false, alreadyReviewed: false });
      });
    return () => controller.abort();
  }, [productId]);

  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // Render nothing until eligibility is known, to avoid a misleading flash.
  if (status === null) return null;

  const { signedIn, alreadyReviewed } = status;

  if (!signedIn) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/login?next=${encodeURIComponent(`/products/${productSlug}`)}`}
            className="font-semibold text-foreground hover:text-accent"
          >
            Sign in
          </Link>{" "}
          to write a review for this product.
        </p>
      </div>
    );
  }

  if (alreadyReviewed || done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5"
      >
        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {done
            ? "Thank you — your review has been submitted and will appear once approved."
            : "You have already reviewed this product. Reviews appear once approved."}
        </p>
      </motion.div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (rating < 1) {
      toast.error("Choose a rating", { description: "Select between 1 and 5 stars." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not submit your review.");
        return;
      }

      setDone(true);
      toast.success("Review submitted", { description: data.message });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="mt-8" onClick={() => setOpen(true)}>
        <PenLine />
        Write a review
      </Button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      onSubmit={submit}
      className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6"
    >
      <h3 className="font-semibold">Write a review</h3>

      <div className="space-y-2">
        <Label>Your rating</Label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              className="rounded-full p-1 transition-transform hover:scale-110"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              aria-pressed={rating === value}
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  value <= (hover || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">
          Title <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-body">
          Review <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="review-body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you think of the build quality, finish and value?"
          maxLength={2000}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="accent" loading={submitting}>
          Submit review
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Reviews are checked before they appear on the site.
      </p>
    </motion.form>
  );
}
