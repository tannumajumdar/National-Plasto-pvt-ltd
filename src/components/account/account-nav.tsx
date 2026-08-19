"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MapPin, Package, User } from "lucide-react";

import { cn } from "@/lib/utils";

const ICONS = { User, Package, MapPin, Heart } as const;

export function AccountNav({
  items,
}: {
  items: { label: string; href: string; icon: keyof typeof ICONS }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Account">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        // "/account" must not stay active on every nested account route.
        const active =
          item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="account-nav-active"
                className="absolute inset-0 -z-10 rounded-2xl bg-secondary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
