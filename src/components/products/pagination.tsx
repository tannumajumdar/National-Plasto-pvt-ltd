"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Link-based pagination — every page is a real, crawlable URL, which matters
 * for SEO on a catalogue this size.
 */
export function Pagination({
  page,
  totalPages,
  className,
}: {
  page: number;
  totalPages: number;
  className?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(target: number) {
    const sp = new URLSearchParams(params.toString());
    target === 1 ? sp.delete("page") : sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <nav
      className={cn("flex items-center justify-center gap-1.5", className)}
      aria-label="Pagination"
    >
      <PageLink
        href={hrefFor(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="px-3"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </PageLink>

      <ul className="flex items-center gap-1.5">
        {pageWindow(page, totalPages).map((item, i) =>
          item === "…" ? (
            <li key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground" aria-hidden>
              …
            </li>
          ) : (
            <li key={item}>
              <PageLink
                href={hrefFor(item)}
                active={item === page}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className="size-10 justify-center p-0"
              >
                {item}
              </PageLink>
            </li>
          ),
        )}
      </ul>

      <PageLink
        href={hrefFor(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="px-3"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { active?: boolean; disabled?: boolean }) {
  const classes = cn(
    "inline-flex h-10 items-center gap-1.5 rounded-full border text-sm font-medium transition-all",
    active
      ? "border-transparent bg-primary text-primary-foreground shadow-soft"
      : "border-border bg-background hover:bg-secondary hover:-translate-y-0.5",
    disabled && "pointer-events-none opacity-40",
    className,
  );

  if (disabled) {
    return (
      <span className={classes} aria-disabled {...(props as object)}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} scroll {...props}>
      {children}
    </Link>
  );
}

/** 1 … 4 [5] 6 … 20 — always shows first, last and a window around current. */
function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");

  out.push(total);
  return out;
}
