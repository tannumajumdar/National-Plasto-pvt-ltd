import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, IndianRupee, Mail, MapPin, Package, Phone } from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CustomerStatusToggle } from "@/components/admin/customer-status-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/db/prisma";
import { ORDER_STATUS_META } from "@/lib/constants";
import { cn, formatDate, formatDateTime, formatINR, initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customer",
  robots: { index: false, follow: false },
};

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      },
      wishlist: { select: { _count: { select: { items: true } } } },
    },
  });

  if (!customer) notFound();

  // Cancelled orders are excluded from lifetime value.
  const spend = customer.orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  const tiles = [
    { label: "Orders placed", value: String(customer.orders.length), icon: Package },
    { label: "Total spend", value: formatINR(spend), icon: IndianRupee },
    { label: "Saved items", value: String(customer.wishlist?._count.items ?? 0), icon: Heart },
  ];

  return (
    <>
      <AdminTopbar
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt, "long")}`}
        crumbs={[{ label: "Customers", href: "/admin/customers" }, { label: customer.name }]}
        menuSlot={<AdminMenuButton />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/customers">
            <ArrowLeft />
            All customers
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {tiles.map((tile) => (
                <Card key={tile.label}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                      <tile.icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xl font-bold tabular-nums">
                        {tile.value}
                      </span>
                      <span className="block text-xs text-muted-foreground">{tile.label}</span>
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order history</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.orders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    This customer has not placed any orders yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {customer.orders.map((order) => {
                      const meta = ORDER_STATUS_META[order.status];
                      return (
                        <li key={order.id}>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="flex flex-wrap items-center gap-4 py-3.5 transition-colors hover:bg-secondary/50"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">
                                {order.orderNumber}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {formatDateTime(order.createdAt)} · {order._count.items}{" "}
                                {order._count.items === 1 ? "item" : "items"}
                              </span>
                            </span>
                            <Badge variant="outline" className={meta.className}>
                              <span className={cn("size-1.5 rounded-full", meta.dot)} />
                              {meta.label}
                            </Badge>
                            <span className="w-24 shrink-0 text-right font-bold tabular-nums">
                              {formatINR(order.total)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {initials(customer.name)}
                </span>
                <p className="mt-4 font-bold">{customer.name}</p>
                <Badge variant={customer.isActive ? "success" : "danger"} className="mt-2">
                  {customer.isActive ? "Active" : "Deactivated"}
                </Badge>

                <div className="mt-5 space-y-2.5 text-left text-sm">
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 break-all text-muted-foreground hover:text-accent"
                  >
                    <Mail className="size-4 shrink-0" />
                    {customer.email}
                  </a>
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-accent"
                    >
                      <Phone className="size-4 shrink-0" />
                      {customer.phone}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {customer.role !== "ADMIN" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account access</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerStatusToggle id={customer.id} isActive={customer.isActive} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-accent" />
                  Saved addresses ({customer.addresses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved addresses.</p>
                ) : (
                  <ul className="space-y-4">
                    {customer.addresses.map((address) => (
                      <li key={address.id} className="text-sm">
                        <p className="font-medium">
                          {address.label}
                          {address.isDefault && (
                            <Badge variant="accent" className="ml-2">Default</Badge>
                          )}
                        </p>
                        <address className="mt-1 not-italic leading-relaxed text-muted-foreground">
                          {address.fullName}, {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                          <br />
                          {address.city}, {address.state} {address.pincode}
                          <br />
                          {address.phone}
                        </address>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
