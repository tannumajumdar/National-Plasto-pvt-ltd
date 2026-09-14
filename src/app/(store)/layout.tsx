import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getCatalogueNav } from "@/lib/queries/catalogue";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { PageTransition } from "@/components/layout/page-transition";
import { CartSync } from "@/components/cart/cart-sync";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SessionProvider } from "@/hooks/use-session";
import { CompanyIntro } from "@/components/CompanyIntro";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

/**
 * This layout intentionally does not read cookies or query the session.
 * Reading them here would opt every page in the storefront into dynamic
 * rendering, discarding the ISR caching that the catalogue depends on.
 * The header resolves the session on the client instead.
 */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const catalogue = await getCatalogueNav();

  return (
    <SessionProvider>
      <CompanyIntro />
      <div className="flex min-h-dvh flex-col">
        <SkipToContent />
        <Header catalogue={catalogue} />
        {/* Merges the guest cart into the signed-in user's server cart. */}
        <CartSync />
        {/*
          pt-20 reserves the unscrolled height of the now-fixed header. The
          homepage hero cancels it with -mt-20 so it can paint behind the bar;
          every other page simply starts underneath it.
        */}
        {/*
          The header is fixed, so this reserves its unscrolled height by hand.
          The sum differs per breakpoint because parts of the bar appear at
          different ones, and it has to be exact or the page starts underneath:

            below sm   main bar 5rem                                  = 5rem
            sm         info bar 2rem + main bar 6rem                  = 8rem
            lg         + the corporate strip 2.5rem                   = 10.5rem

          Change a bar's height and this has to move with it.
        */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 pt-20 sm:pt-32 lg:pt-[10.5rem]"
        >
          <PageTransition>{children}</PageTransition>
        </main>
        <CartDrawer />
        <Footer />
        <FloatingWhatsApp />
      </div>
    </SessionProvider>
  );
}
