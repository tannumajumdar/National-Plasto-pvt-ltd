"use client";

import { Check, Info, MessageSquare } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from "@/components/products/rating-stars";
import { ReviewForm } from "@/components/products/review-form";
import { formatDate } from "@/lib/utils";
import type { ProductDetailDTO, ReviewDTO } from "@/types";

export function ProductDetailsTabs({
  product,
  reviews,
}: {
  product: ProductDetailDTO;
  reviews: ReviewDTO[];
}) {
  const hasDescription = Boolean(product.description?.trim());
  const hasFeatures = product.features.length > 0;
  const hasSpecs = product.specifications.length > 0;

  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="flex w-full max-w-full flex-wrap justify-start sm:w-auto">
        <TabsTrigger value="description">Description</TabsTrigger>
        {hasFeatures && <TabsTrigger value="features">Features</TabsTrigger>}
        <TabsTrigger value="specifications">Specifications</TabsTrigger>
        <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
      </TabsList>

      {/* Description */}
      <TabsContent value="description">
        {hasDescription ? (
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
            {product.description!.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : (
          <PendingNotice
            title="Description coming soon"
            body={`A full description for ${product.name} has not been published yet. Our product listing supplied the name and collection only — an administrator can add the description from the admin panel.`}
          />
        )}
      </TabsContent>

      {/* Features */}
      {hasFeatures && (
        <TabsContent value="features">
          <ul className="grid max-w-3xl gap-3 sm:grid-cols-2">
            {product.features.map((f) => (
              <li key={f.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15">
                  <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="text-foreground/85">{f.label}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      )}

      {/* Specifications */}
      <TabsContent value="specifications">
        {hasSpecs ? (
          <div className="max-w-3xl overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {product.specifications.map((spec, i) => (
                  <tr
                    key={spec.id}
                    className={i % 2 === 0 ? "bg-secondary/40" : "bg-transparent"}
                  >
                    <th
                      scope="row"
                      className="w-2/5 px-5 py-3.5 text-left font-medium text-muted-foreground"
                    >
                      {spec.name}
                    </th>
                    <td className="px-5 py-3.5 text-foreground">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <PendingNotice
            title="Specifications not published"
            body="Dimensions, materials, colours and weights have not been published for this product yet. We have deliberately not estimated them — contact us for exact specifications, or add them from the admin panel."
          />
        )}
      </TabsContent>

      {/* Reviews */}
      <TabsContent value="reviews">
        <div className="max-w-3xl">
        {reviews.length === 0 ? (
          <div className="flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-8">
            <MessageSquare className="size-6 text-muted-foreground" />
            <p className="font-semibold">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to review {product.name}. Reviews appear here once approved.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-5">
              <span className="text-4xl font-extrabold tabular-nums">
                {product.ratingAvg.toFixed(1)}
              </span>
              <span>
                <RatingStars value={product.ratingAvg} count={product.reviewCount} size="md" />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Based on {product.reviewCount}{" "}
                  {product.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </span>
            </div>

            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border border-border p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{review.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <RatingStars value={review.rating} size="xs" showEmpty={false} />
                  </div>
                  {review.title && <p className="mt-3 font-medium">{review.title}</p>}
                  {review.body && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {review.body}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ReviewForm productId={product.id} productSlug={product.slug} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function PendingNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex max-w-3xl gap-4 rounded-2xl border border-dashed border-border p-6">
      <Info className="size-5 shrink-0 text-accent" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
