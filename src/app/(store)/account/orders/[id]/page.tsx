import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { ProductVisual } from "@/components/products/product-visual";
import { requireUser } from "@/lib/auth/session";
import { getOrder } from "@/lib/queries/orders";
import { ORDER_STATUS_META } from "@/lib/constants";
import { formatDateTime, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);

  // Scoped to the signed-in user — another customer's order id resolves to 404.
  const order = await getOrder({ id }, { userId: user.id });
  if (!order) notFound();

  const meta = ORDER_STATUS_META[order.status];

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{order.orderNumber}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed {formatDateTime(order.createdAt)}
              </p>
            </div>
            <Badge variant="outline" className={meta.className}>
              <span className={`size-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </Badge>
          </div>

          <div className="mt-8">
            <OrderStatusTimeline status={order.status} events={order.events} />
          </div>
        </CardContent>
      </Card>

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
                  className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  <ProductVisual
                    name={item.name}
                    accent="national"
                    src={item.image}
                    sizes="64px"
                    rounded="rounded-xl"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-1 font-medium transition-colors hover:text-accent"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-accent" />
              Delivery address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              <span className="block font-medium text-foreground">{order.customerName}</span>
              {order.shipLine1}
              <br />
              {order.shipLine2 && (
                <>
                  {order.shipLine2}
                  <br />
                </>
              )}
              {order.shipCity}, {order.shipState} {order.shipPincode}
              <br />
              {order.customerPhone}
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
                <dd className="font-medium capitalize">{order.paymentStatus.toLowerCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{order.customerEmail}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
