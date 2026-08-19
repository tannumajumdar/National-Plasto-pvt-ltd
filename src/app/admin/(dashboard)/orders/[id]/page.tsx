import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Receipt, User } from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { ProductVisual } from "@/components/products/product-visual";
import { getOrder } from "@/lib/queries/orders";
import { ORDER_STATUS_META } from "@/lib/constants";
import { cn, formatDateTime, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Admins may read any order.
  const order = await getOrder({ id }, { allowAny: true });
  if (!order) notFound();

  const meta = ORDER_STATUS_META[order.status];

  return (
    <>
      <AdminTopbar
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        crumbs={[{ label: "Orders", href: "/admin/orders" }, { label: order.orderNumber }]}
        menuSlot={<AdminMenuButton />}
        actions={
          <Badge variant="outline" className={meta.className}>
            <span className={cn("size-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </Badge>
        }
      />

      <div className="space-y-6 p-5 sm:p-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ArrowLeft />
            All orders
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order progress</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusTimeline status={order.status} events={order.events} />
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="size-4 text-accent" />
                  Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4">
                      <Link
                        href={`/products/${item.slug}`}
                        target="_blank"
                        className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted"
                      >
                        <ProductVisual
                          name={item.name}
                          accent="national"
                          src={item.image}
                          sizes="56px"
                          rounded="rounded-xl"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.collectionName} · {formatINR(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatINR(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Separator className="my-6" />

                <dl className="ml-auto max-w-xs space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                        − {formatINR(order.discount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd className="tabular-nums">
                      {order.shipping === 0 ? "Free" : formatINR(order.shipping)}
                    </dd>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-bold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatINR(order.total)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Timeline log */}
            {order.events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity log</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {[...order.events].reverse().map((event) => {
                      const eventMeta = ORDER_STATUS_META[event.status];
                      return (
                        <li key={event.id} className="flex gap-3">
                          <span
                            className={cn(
                              "mt-1.5 size-2 shrink-0 rounded-full",
                              eventMeta?.dot ?? "bg-muted-foreground",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {eventMeta?.label ?? event.status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(event.createdAt)}
                            </p>
                            {event.note && (
                              <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update status</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusControl orderId={order.id} current={order.status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4 text-accent" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="font-medium">{order.customerName}</p>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-2 break-all text-muted-foreground hover:text-accent"
                >
                  <Mail className="size-4 shrink-0" />
                  {order.customerEmail}
                </a>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-accent"
                >
                  <Phone className="size-4 shrink-0" />
                  {order.customerPhone}
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-accent" />
                  Shipping address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                  {order.shipLine1}
                  <br />
                  {order.shipLine2 && (
                    <>
                      {order.shipLine2}
                      <br />
                    </>
                  )}
                  {order.shipCity}, {order.shipState}
                  <br />
                  {order.shipPincode}
                </address>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Method</dt>
                    <dd className="font-medium">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online (Razorpay)"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium capitalize">
                      {order.paymentStatus.toLowerCase()}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
