import { cn } from "@/lib/utils";
import { discountPercent, effectivePrice, formatINR } from "@/lib/utils";

/**
 * Renders effective price, struck-through list price and a discount chip.
 *
 * An unpriced product (no price set by an admin yet) shows "Price on request"
 * rather than a fabricated figure — the source product list carried no prices.
 */
export function PriceTag({
  price,
  discountPrice,
  size = "md",
  className,
}: {
  price: number | null;
  discountPrice: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const effective = effectivePrice(price, discountPrice);
  const off = discountPercent(price, discountPrice);

  const main = {
    sm: "text-sm font-semibold",
    md: "text-lg font-bold",
    lg: "text-3xl font-bold",
  }[size];

  const strike = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  if (effective === null) {
    return (
      <span
        className={cn(
          "font-medium text-muted-foreground",
          size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm",
          className,
        )}
      >
        Price on request
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn(main, "tracking-tight text-foreground")}>
        {formatINR(effective)}
      </span>

      {off !== null && (
        <>
          <span className={cn(strike, "text-muted-foreground line-through")}>
            {formatINR(price)}
          </span>
          <span
            className={cn(
              "rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400",
            )}
          >
            {off}% off
          </span>
        </>
      )}
    </span>
  );
}
