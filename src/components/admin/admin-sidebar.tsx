"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Layers,
  Menu,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
  X,
} from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { EASE } from "@/components/animations/motion-primitives";
import { useAdminNav } from "@/hooks/use-admin-nav";
import { cn, initials } from "@/lib/utils";

const ICONS = {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Star,
  LayoutTemplate,
  Settings,
} as const;

export interface AdminNavItem {
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

/** Hamburger for the admin topbar on small screens. */
export function AdminMenuButton() {
  const toggle = useAdminNav((s) => s.toggle);
  return (
    <button
      onClick={toggle}
      className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-secondary lg:hidden"
      aria-label="Open admin menu"
    >
      <Menu className="size-5" />
    </button>
  );
}

export function AdminSidebar({
  items,
  admin,
}: {
  items: AdminNavItem[];
  admin: { name: string; email: string };
}) {
  const pathname = usePathname();
  const mobileOpen = useAdminNav((s) => s.open);
  const setMobileOpen = useAdminNav((s) => s.setOpen);

  React.useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <>
      <div className="px-4 py-6">
        <Logo href="/admin" />
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-primary-foreground"
                  : "text-primary-foreground/60 hover:text-primary-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute inset-0 -z-10 rounded-xl bg-white/12"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-primary-foreground/60 transition-colors hover:text-primary-foreground"
        >
          <Store className="size-4 shrink-0" />
          View storefront
        </Link>

        <div className="flex items-center gap-3 rounded-xl px-3.5 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {initials(admin.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-primary-foreground">
              {admin.name}
            </span>
            <span className="block truncate text-xs text-primary-foreground/50">
              {admin.email}
            </span>
          </span>
          <a
            href="/api/auth/logout"
            className="grid size-8 shrink-0 place-items-center rounded-full text-primary-foreground/60 transition-colors hover:bg-white/10 hover:text-primary-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </a>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-primary lg:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close admin menu"
              className="fixed inset-0 z-40 cursor-default bg-primary/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-primary lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-6 grid size-9 place-items-center rounded-full text-primary-foreground/70 transition-colors hover:bg-white/10"
                aria-label="Close admin menu"
              >
                <X className="size-4" />
              </button>
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
