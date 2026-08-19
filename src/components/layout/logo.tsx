import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Wordmark for National Plasto.
 *
 * The mark is an abstract "NP" monogram built from two interlocking forms —
 * a moulded panel and an arc — echoing formed plastic without depicting any
 * specific product.
 */
export function Logo({
  className,
  href = "/",
  compact = false,
  inverted = false,
}: {
  className?: string;
  href?: string | null;
  compact?: boolean;
  inverted?: boolean;
}) {
  const mark = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-national-deep via-national to-accent shadow-glow">
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
          <path
            d="M7 24V8h4.4l7.2 10.1V8H23v16h-4.4L11.4 13.9V24H7Z"
            fill="white"
            fillOpacity=".96"
          />
          <circle cx="24.5" cy="9.5" r="2.6" fill="white" fillOpacity=".55" />
        </svg>
      </span>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[15px] font-extrabold tracking-tight",
              inverted ? "text-white" : "text-foreground",
            )}
          >
            NATIONAL PLASTO
          </span>
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em]",
              inverted ? "text-white/60" : "text-muted-foreground",
            )}
          >
            Pvt. Ltd. · Kolkata
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} aria-label="National Plasto — home" className="shrink-0">
      {mark}
    </Link>
  );
}
