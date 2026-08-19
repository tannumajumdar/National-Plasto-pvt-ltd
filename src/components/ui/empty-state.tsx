import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared empty state. Deliberately generous in size and tone — an empty cart
 * or a search with no hits should feel like a considered screen, not a bug.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-20 text-center", className)}>
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-3xl bg-accent/15 blur-2xl"
        />
        <span className="grid size-20 place-items-center rounded-3xl border border-border bg-card shadow-soft">
          <Icon className="size-9 text-muted-foreground" />
        </span>
      </div>

      <h2 className="mt-7 text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>

      {description && (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {action && (
            <Button asChild variant="accent">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
