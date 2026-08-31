import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { PageTransition } from "@/components/layout/page-transition";
import { CartSync } from "@/components/cart/cart-sync";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SessionProvider } from "@/hooks/use-session";

/**
 * This layout intentionally does not read cookies or query the session.
 * Reading them here would opt every page in the storefront into dynamic
 * rendering, discarding the ISR caching that the catalogue depends on.
 * The header resolves the session on the client instead.
 */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-dvh flex-col">
        <SkipToContent />
        <Header />
        {/* Merges the guest cart into the signed-in user's server cart. */}
        <CartSync />
        {/*
          pt-20 reserves the unscrolled height of the now-fixed header. The
          homepage hero cancels it with -mt-20 so it can paint behind the bar;
          every other page simply starts underneath it.
        */}
        <main id="main-content" tabIndex={-1} className="flex-1 pt-20 sm:pt-28">
          <PageTransition>{children}</PageTransition>
        </main>
        <CartDrawer />
        <Footer />
      </div>
    </SessionProvider>
  );
}
