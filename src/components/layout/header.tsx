"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Facebook,
  Globe,
  Heart,
  Instagram,
  LayoutDashboard,
  Linkedin,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
  User as UserIcon,
  Youtube,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo, NextBrandLogo } from "@/components/layout/logo";
import { ThemeToggle, ThemeToggleButton } from "@/components/layout/theme-toggle";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { EASE } from "@/components/animations/motion-primitives";
import { useCartCount } from "@/hooks/use-cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";
import { useWishlist } from "@/hooks/use-wishlist";
import { useScrolled } from "@/hooks/use-scroll-position";
import { useSession, type SessionUser } from "@/hooks/use-session";
import { COLLECTION_LIST, MAIN_NAV } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

export type HeaderUser = SessionUser;

export function Header() {
  const { user } = useSession();
  const pathname = usePathname();
  const scrolled = useScrolled(10);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const cartCount = useCartCount();
  const openCart = useCartDrawer((s) => s.setOpen);
  const wishlistCount = useWishlist((s) => s.ids.length);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => setMenuOpen(false), [pathname]);

  // Cmd/Ctrl+K opens search from anywhere.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const overlay = pathname === "/" && !scrolled;

  const iconButton = cn(
    "relative grid size-9 place-items-center rounded-full transition-colors",
    overlay
      ? "text-white/75 hover:bg-white/10 hover:text-white"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full">
        {/* Top Info / Announcement Bar */}
        <div className="hidden border-b border-slate-200/80 bg-[#f8f9fa] text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:block">
          <div className="container-page flex h-8 items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-slate-500" />
              <span>
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Welcome to NPPL
                </strong>{" "}
                <span className="mx-1 text-slate-300">|</span> Excellence in
                Plastic Moulded Products
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="tel:+911234567890"
                className="flex items-center gap-1.5 hover:text-[#c8102e] transition-colors"
              >
                <Phone className="size-4 text-[#c8102e]" />
                <span>+91 12345 67890</span>
              </a>
              <a
                href="mailto:info@nppl.com"
                className="flex items-center gap-1.5 hover:text-[#c8102e] transition-colors"
              >
                <Mail className="size-4 text-[#c8102e]" />
                <span>info@nppl.com</span>
              </a>
              <div className="flex items-center gap-3 text-slate-500">
                <a href="#" className="hover:text-[#c8102e]" aria-label="Facebook">
                  <Facebook className="size-4" />
                </a>
                <a href="#" className="hover:text-[#c8102e]" aria-label="Instagram">
                  <Instagram className="size-4" />
                </a>
                <a href="#" className="hover:text-[#c8102e]" aria-label="LinkedIn">
                  <Linkedin className="size-4" />
                </a>
                <a href="#" className="hover:text-[#c8102e]" aria-label="YouTube">
                  <Youtube className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Nav Header */}
        <div
          className={cn(
            "w-full transition-[background-color,box-shadow,border-color] duration-300",
            scrolled
              ? "glass border-b border-border shadow-soft"
              : "border-b border-slate-200/60 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95",
          )}
        >
          <div
            className={cn(
              "container-page flex items-center justify-between transition-[height] duration-300",
              scrolled ? "h-16 sm:h-18" : "h-20 sm:h-24",
            )}
          >
            {/* Dual Brand Logos */}
            <div className="flex shrink-0 items-center gap-3.5 xl:gap-5">
              <Logo compact={false} priority className="h-10 sm:h-13 xl:h-15" />
              <div className="hidden h-8 sm:h-10 w-px bg-slate-200 dark:bg-slate-800 sm:block shrink-0" />
              <NextBrandLogo className="hidden sm:inline-flex h-9 sm:h-11 xl:h-13" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-3 lg:gap-4.5 xl:gap-7 lg:flex shrink-0 whitespace-nowrap ml-6 lg:ml-8 xl:ml-12" aria-label="Main">
              {MAIN_NAV.map((item) => (
                <div key={item.href} className="relative group shrink-0">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 py-1.5 text-xs xl:text-[13px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap",
                      isActive(item.href)
                        ? "text-[#c8102e]"
                        : "text-slate-700 hover:text-[#c8102e] dark:text-slate-200 dark:hover:text-[#c8102e]",
                    )}
                  >
                    {item.label}
                    {item.label === "PRODUCTS" && (
                      <ChevronDown className="size-4 opacity-75 shrink-0" />
                    )}
                  </Link>
                  {isActive(item.href) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#c8102e] rounded-full"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                </div>
              ))}
            </nav>

            {/* Header Right Actions */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3 ml-auto">
              <button
                onClick={() => setSearchOpen(true)}
                className={cn(iconButton, "size-10")}
                aria-label="Search products"
              >
                <Search className="size-5" />
              </button>

              <ThemeToggle inverted={overlay} />

              <Link
                href="/wishlist"
                className={cn(iconButton, "size-10 hidden sm:grid")}
                aria-label={`Wishlist${mounted && wishlistCount ? `, ${wishlistCount} items` : ""}`}
              >
                <Heart className="size-5" />
                <CountBadge count={mounted ? wishlistCount : 0} className="bg-rose-500" />
              </Link>

              <button
                type="button"
                onClick={() => openCart(true)}
                className={cn(iconButton, "size-10")}
                aria-label={`Open cart${mounted && cartCount ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingBag className="size-5" />
                <CountBadge count={mounted ? cartCount : 0} className="bg-accent text-accent-foreground" />
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="ml-1 grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-transform hover:scale-105"
                      aria-label="Account menu"
                    >
                      {initials(user.name)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="normal-case">
                      <span className="block text-sm font-semibold text-foreground">{user.name}</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account"><UserIcon />My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders"><Package />My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist"><Heart />Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/addresses"><MapPin />Addresses</Link>
                    </DropdownMenuItem>
                    {user.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin"><LayoutDashboard />Admin Dashboard</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild destructive>
                      <a href="/api/auth/logout"><LogOut />Sign out</a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="ml-1 hidden sm:inline-flex border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider"
                >
                  <Link href="/login">Login</Link>
                </Button>
              )}

              {/* Get a Quote Red Button */}
              <Button
                asChild
                className="ml-2 bg-[#c8102e] hover:bg-[#a80b24] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm"
              >
                <Link href="/contact">
                  GET A QUOTE
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="ml-1 grid size-9 place-items-center rounded-full transition-colors hover:bg-secondary lg:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                <span className="flex w-5 flex-col items-end gap-[5px]">
                  <motion.span
                    className="block h-0.5 w-full rounded-full bg-foreground"
                    animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                  <motion.span
                    className="block h-0.5 w-3/4 rounded-full bg-foreground"
                    animate={menuOpen ? { opacity: 0, x: 8 } : { opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.span
                    className="block h-0.5 w-full rounded-full bg-foreground"
                    animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      <MobileTabBar onSearch={() => setSearchOpen(true)} />
    </>
  );
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className={cn(
            "absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold text-white",
            className,
          )}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Full-screen drawer built for touch — not a shrunken desktop nav. */
function MobileMenu({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: SessionUser | null;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default bg-brand/45 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.nav
            className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-card shadow-float lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: EASE }}
            aria-label="Mobile"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <Logo />
            </div>

            <motion.ul
              className="flex flex-col gap-1 p-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
            >
              {MAIN_NAV.map((item) => (
                <motion.li
                  key={item.href}
                  variants={{ hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium transition-colors hover:bg-secondary"
                  >
                    {item.label}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>

            <div className="px-4 pb-2">
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Collections
              </p>
              <div className="grid gap-2">
                {COLLECTION_LIST.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/collections/${c.slug}`}
                    onClick={onClose}
                    className="rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-secondary"
                  >
                    <span className={cn("text-sm font-bold", c.text)}>{c.name}</span>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{c.tagline}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-border px-4 py-3">
              <ThemeToggleButton className="w-full" />
            </div>

            <div className="mt-auto border-t border-border p-4">
              {user ? (
                <div className="space-y-2">
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials(user.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                  </Link>
                  {user.role === "ADMIN" && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/admin" onClick={onClose}>
                        <LayoutDashboard />Admin Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" className="w-full">
                    <a href="/api/auth/logout"><LogOut />Sign out</a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <Link href="/login" onClick={onClose}>Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register" onClick={onClose}>Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
