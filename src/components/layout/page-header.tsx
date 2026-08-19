import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Reveal } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Standard page masthead: breadcrumbs, title, optional description.
 * Keeps every interior page visually consistent with the homepage.
 */
export function PageHeader({
  title,
  description,
  crumbs = [],
  eyebrow,
  children,
  className,
}: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-border bg-secondary/40 py-12 sm:py-16",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-texture opacity-40 mask-fade-b" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/12 blur-3xl"
      />

      <div className="container-page relative">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Home
                </Link>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 opacity-50" aria-hidden />
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <Reveal y={16}>
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          {children}
        </Reveal>
      </div>
    </header>
  );
}
