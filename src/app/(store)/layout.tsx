import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CartSync } from "@/components/cart/cart-sync";
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
        <Header />
        {/* Merges the guest cart into the signed-in user's server cart. */}
        <CartSync />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
