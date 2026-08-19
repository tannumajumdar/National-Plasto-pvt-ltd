import { LogOut } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth/session";
import { initials } from "@/lib/utils";

const NAV = [
  { label: "Profile", href: "/account", icon: "User" as const },
  { label: "My Orders", href: "/account/orders", icon: "Package" as const },
  { label: "Addresses", href: "/account/addresses", icon: "MapPin" as const },
  { label: "Wishlist", href: "/wishlist", icon: "Heart" as const },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/account");

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Manage your profile, track orders and keep your addresses up to date."
        crumbs={[{ label: "Account" }]}
      />

      <div className="container-page py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:gap-12">
          <aside>
            <div className="lg:sticky lg:top-24">
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initials(user.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
              </div>

              <AccountNav items={NAV} />

              <a
                href="/api/auth/logout"
                className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </a>
            </div>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </>
  );
}
