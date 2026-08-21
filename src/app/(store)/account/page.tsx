import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Package, ShoppingBag } from "lucide-react";

import { ChangePasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser("/account");

  const [orderCount, spend, wishlistCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.aggregate({
      where: { userId: user.id, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
  ]);

  const tiles = [
    { icon: Package, label: "Orders placed", value: String(orderCount), href: "/account/orders" },
    { icon: ShoppingBag, label: "Total spend", value: formatINR(spend._sum.total ?? 0), href: "/account/orders" },
    { icon: Heart, label: "Saved items", value: String(wishlistCount), href: "/wishlist" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-accent/18 to-accent/5 text-accent">
                  <tile.icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xl font-bold tabular-nums">{tile.value}</span>
                  <span className="block text-xs text-muted-foreground">{tile.label}</span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone }} />
      <ChangePasswordForm />

      <p className="text-xs text-muted-foreground">
        Member since {formatDate(user.createdAt, "long")}
      </p>
    </div>
  );
}
