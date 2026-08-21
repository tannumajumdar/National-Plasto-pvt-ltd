"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Home, Search, ShoppingBag, LayoutGrid } from "lucide-react";

import { useCartCount } from "@/hooks/use-cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

/**
 * Thumb-reachable bottom navigation, phones only.
 *
 * Mobile shoppers should not have to reach for a hamburger at the top of the
 * screen to get between the four things they actually use. Hidden from `lg`
 * up, where the header nav is already visible.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iOS home indicator.
 */
export function MobileTabBar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const openCart = useCartDrawer((s) => s.setOpen);
  const cartCount = useCartCount();
  const wishlistCount = useWishlist((s) => s.ids.length);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // The admin panel has its own chrome; this bar would only be in the way.
  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const items = [
    { key: "home", label: "Home", href: "/", icon: Home },
    { key: "shop", label: "Shop", href: "/products", icon: LayoutGrid },
    { key: "search", label: "Search", icon: Search, action: onSearch },
    {
      key: "saved",
      label: "Saved",
      href: "/wishlist",
      icon: Heart,
      badge: mounted ? wishlistCount : 0,
    },
    {
      key: "cart",
      label: "Cart",
      icon: ShoppingBag,
      action: () => openCart(true),
      badge: mounted ? cartCount : 0,
    },
  ] as const;

  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = "href" in item && item.href ? isActive(item.href) : false;
          const badge = "badge" in item ? item.badge : 0;

          const inner = (
            <>
              <span className="relative">
                <Icon
                  className={cn(
                    "size-[1.35rem] transition-transform duration-300",
                    active && "scale-110",
                  )}
                />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[0.625rem] font-semibold">{item.label}</span>
              {active && (
                <motion.span
                  layoutId="tab-bar-active"
                  className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </>
          );

          const cls = cn(
            "relative flex w-full flex-col items-center gap-1 py-2.5 transition-colors",
            active ? "text-accent" : "text-muted-foreground",
          );

          return (
            <li key={item.key} className="relative">
              {"href" in item && item.href ? (
                <Link href={item.href} className={cls} aria-current={active ? "page" : undefined}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={item.action} className={cls} aria-label={item.label}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
