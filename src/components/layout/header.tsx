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
import { MAIN_NAV, themeForAccent } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import type { CatalogueNavBrand } from "@/types";

export type HeaderUser = SessionUser;

export function Header({ catalogue = [] }: { catalogue?: CatalogueNavBrand[] }) {
  const { user } = useSession();
  const pathname = usePathname();
  const scrolled = useScrolled(10);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);

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
              <a href="tel:+919830012345" className="flex items-center gap-1.5 transition-colors hover:text-[#c8102e]">
                <Phone className="size-4 text-[#c8102e]" />
                <span>+91 98300 12345</span>
              </a>
              <a href="mailto:info@nationalplasto.com" className="flex items-center gap-1.5 transition-colors hover:text-[#c8102e]">
                <Mail className="size-4 text-[#c8102e]" />
                <span>info@nationalplasto.com</span>
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
            <nav className="hidden items-center gap-2.5 xl:gap-4 2xl:gap-6 xl:flex shrink-0 whitespace-nowrap ml-3 xl:ml-6" aria-label="Main">
              {MAIN_NAV.map((item) => {
                const isSecondary = item.label === "INDUSTRIES" || item.label === "QUALITY" || item.label === "INFRASTRUCTURE";
                const hasMenu = item.label === "PRODUCTS" && catalogue.length > 0;
                return (
                  <div
                    key={item.href}
                    className={cn("relative group shrink-0", isSecondary && "hidden 2xl:block")}
                    onMouseEnter={hasMenu ? () => setProductsOpen(true) : undefined}
                    onMouseLeave={hasMenu ? () => setProductsOpen(false) : undefined}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1 py-1.5 text-xs 2xl:text-[13px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap",
                        isActive(item.href)
                          ? "text-[#c8102e]"
                          : "text-slate-700 hover:text-[#c8102e] dark:text-slate-200 dark:hover:text-[#c8102e]",
                      )}
                      aria-expanded={hasMenu ? productsOpen : undefined}
                      aria-haspopup={hasMenu ? "true" : undefined}
                      onFocus={hasMenu ? () => setProductsOpen(true) : undefined}
                    >
                      {item.label}
                      {item.label === "PRODUCTS" && (
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 opacity-75 transition-transform duration-200",
                            hasMenu && productsOpen && "rotate-180",
                          )}
                        />
                      )}
                    </Link>
                    {isActive(item.href) && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#c8102e] rounded-full"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    {hasMenu && (
                      <ProductsMegaMenu
                        open={productsOpen}
                        catalogue={catalogue}
                        onNavigate={() => setProductsOpen(false)}
                      />
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Header Right Actions */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 ml-auto mr-2 sm:mr-4 xl:mr-6">
              <button
                onClick={() => setSearchOpen(true)}
                className={cn(iconButton, "size-8.5 sm:size-9")}
                aria-label="Search products"
              >
                <Search className="size-4 sm:size-4.5" />
              </button>

              <ThemeToggle inverted={overlay} />

              <Link
                href="/wishlist"
                className={cn(iconButton, "size-8.5 sm:size-9 hidden xl:grid")}
                aria-label={`Wishlist${mounted && wishlistCount ? `, ${wishlistCount} items` : ""}`}
              >
                <Heart className="size-4 sm:size-4.5" />
                <CountBadge count={mounted ? wishlistCount : 0} className="bg-rose-500" />
              </Link>

              <button
                type="button"
                onClick={() => openCart(true)}
                className={cn(iconButton, "size-8.5 sm:size-9")}
                aria-label={`Open cart${mounted && cartCount ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingBag className="size-4 sm:size-4.5" />
                <CountBadge count={mounted ? cartCount : 0} className="bg-accent text-accent-foreground" />
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="ml-0.5 grid size-8 sm:size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-transform hover:scale-105"
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
                  className="ml-0.5 hidden sm:inline-flex border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] sm:text-[11px] xl:text-xs uppercase tracking-wider px-2.5 py-1 sm:px-3 sm:py-1.5"
                >
                  <Link href="/login">Login</Link>
                </Button>
              )}

              {/* Get a Quote Red Button */}
              <Button
                asChild
                className="ml-1 sm:ml-1.5 bg-[#c8102e] hover:bg-[#a80b24] text-white font-extrabold text-[10px] sm:text-[11px] xl:text-xs uppercase tracking-wide px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm shrink-0 whitespace-nowrap"
              >
                <Link href="/contact" className="whitespace-nowrap inline-flex items-center gap-1.5">
                  <span>GET A QUOTE</span>
                  <ArrowRight className="size-3.5 sm:size-4 shrink-0" />
                </Link>
              </Button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="ml-1 grid size-9 place-items-center rounded-full transition-colors hover:bg-secondary xl:hidden"
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

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        catalogue={catalogue}
      />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      <MobileTabBar onSearch={() => setSearchOpen(true)} />
    </>
  );
}

/**
 * The catalogue, one panel deep: every brand and the groups it makes.
 * Sub-categories live on /products — putting all 29 headings in a hover menu
 * would be unreadable, and the page can lay them out properly.
 */
function ProductsMegaMenu({
  open,
  catalogue,
  onNavigate,
}: {
  open: boolean;
  catalogue: CatalogueNavBrand[];
  onNavigate: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: EASE }}
          // pt-3 keeps a hoverable bridge between the trigger and the panel
          className="absolute left-1/2 top-full z-50 w-[min(64rem,90vw)] -translate-x-1/2 pt-3"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-float dark:border-slate-800 dark:bg-slate-950">
            <div className="grid gap-px bg-slate-200 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
              {catalogue.map((brand) => {
                const theme = themeForAccent(brand.accent);
                return (
                  <div key={brand.slug} className="bg-white p-5 dark:bg-slate-950">
                    <Link
                      href={`/products?collection=${brand.slug}`}
                      onClick={onNavigate}
                      className="group/brand flex items-baseline justify-between gap-2"
                    >
                      <span
                        className={cn(
                          "text-sm font-extrabold uppercase tracking-[0.12em]",
                          theme.text,
                        )}
                      >
                        {brand.name}
                      </span>
                      <span className="text-[11px] tabular-nums text-slate-400">
                        {brand.productCount}
                      </span>
                    </Link>

                    <ul className="mt-3 space-y-1">
                      {brand.groups.map((group) => (
                        <li key={group.slug}>
                          <Link
                            href={`/products?collection=${brand.slug}&category=${group.slug}`}
                            onClick={onNavigate}
                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#c8102e] dark:text-slate-300 dark:hover:bg-slate-900"
                          >
                            <span className="truncate">{group.name}</span>
                            <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                              {group.productCount}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
              <Link
                href="/products?premium=1"
                onClick={onNavigate}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 transition-colors hover:text-[#c8102e] dark:text-slate-300"
              >
                Premium &amp; Limited Edition
              </Link>
              <Link
                href="/products"
                onClick={onNavigate}
                className="group/all inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8102e]"
              >
                Full catalogue
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/all:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  catalogue,
}: {
  open: boolean;
  onClose: () => void;
  user: SessionUser | null;
  catalogue: CatalogueNavBrand[];
}) {
  const [openBrand, setOpenBrand] = React.useState<string | null>(null);

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
              <div className="flex items-center gap-3">
                <Logo compact className="h-8" />
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />
                <NextBrandLogo className="h-7" />
              </div>
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
                Brands
              </p>
              {/* One tap opens a brand; its categories are one level in, so the
                  drawer never becomes a 29-row scroll. */}
              <div className="grid gap-2">
                {catalogue.map((brand) => {
                  const theme = themeForAccent(brand.accent);
                  const expanded = openBrand === brand.slug;

                  return (
                    <div
                      key={brand.slug}
                      className="overflow-hidden rounded-2xl border border-border"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenBrand(expanded ? null : brand.slug)}
                        aria-expanded={expanded}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary"
                      >
                        <span className="min-w-0">
                          <span className={cn("block text-sm font-bold", theme.text)}>
                            {brand.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {brand.productCount} products
                          </span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: EASE }}
                            className="overflow-hidden border-t border-border bg-secondary/40"
                          >
                            {brand.groups.map((group) => (
                              <li key={group.slug}>
                                <Link
                                  href={`/products?collection=${brand.slug}&category=${group.slug}`}
                                  onClick={onClose}
                                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
                                >
                                  <span className="truncate">{group.name}</span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {group.productCount}
                                  </span>
                                </Link>
                              </li>
                            ))}
                            <li>
                              <Link
                                href={`/products?collection=${brand.slug}`}
                                onClick={onClose}
                                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent"
                              >
                                All {brand.name}
                                <ArrowRight className="size-3.5" />
                              </Link>
                            </li>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
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
