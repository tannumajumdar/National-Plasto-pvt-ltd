import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";

export interface AdminCrumb {
  label: string;
  href?: string;
}

/** Sticky admin header: mobile menu slot, breadcrumbs, page title, actions. */
export function AdminTopbar({
  title,
  description,
  crumbs = [],
  menuSlot,
  actions,
}: {
  title: string;
  description?: string;
  crumbs?: AdminCrumb[];
  menuSlot?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-8">
        {menuSlot}

        <div className="min-w-0 flex-1">
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-1">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <li>
                  <Link href="/admin" className="transition-colors hover:text-foreground">
                    Admin
                  </Link>
                </li>
                {crumbs.map((crumb) => (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    <ChevronRight className="size-3 opacity-50" aria-hidden />
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

          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  );
}
