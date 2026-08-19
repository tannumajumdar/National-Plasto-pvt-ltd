import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  size = "sm",
  showEmpty = true,
  className,
}: {
  value: number;
  count?: number;
  size?: "xs" | "sm" | "md";
  /** When false, an unrated product renders nothing at all. */
  showEmpty?: boolean;
  className?: string;
}) {
  const hasRatings = value > 0 && (count ?? 0) > 0;
  if (!hasRatings && !showEmpty) return null;

  const dim = { xs: "size-3", sm: "size-3.5", md: "size-4" }[size];
  const text = { xs: "text-[11px]", sm: "text-xs", md: "text-sm" }[size];

  if (!hasRatings) {
    return (
      <span className={cn("text-muted-foreground/70", text, className)}>
        No reviews yet
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={cn(
              dim,
              i < Math.round(value)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/35",
            )}
          />
        ))}
      </span>
      <span className={cn("font-medium text-muted-foreground", text)}>
        {value.toFixed(1)}
        {count !== undefined && (
          <span className="font-normal text-muted-foreground/70"> ({count})</span>
        )}
      </span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5 from {count} reviews
      </span>
    </span>
  );
}
