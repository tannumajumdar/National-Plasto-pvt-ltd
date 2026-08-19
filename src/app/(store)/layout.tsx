import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CartSync } from "@/components/cart/cart-sync";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        user={
          user
            ? { id: user.id, name: user.name, email: user.email, role: user.role }
            : null
        }
      />
      {/* Merges the guest cart into the signed-in user's server cart. */}
      <CartSync signedIn={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
