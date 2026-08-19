import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { ProductVisual } from "@/components/products/product-visual";
import { Reveal } from "@/components/animations/motion-primitives";
import { requireUser } from "@/lib/auth/session";
import { getOrder } from "@/lib/queries/orders";
import { ORDER_STATUS_META } from "@/lib/constants";
import { formatDateTime, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireUser(`/order-confirmation/${orderNumber}`);

  const order = await getOrder({ orderNumber }, { userId: user.id });
  if (!order) notFound();

  const awaitingPayment = order.paymentMethod !== "COD" && order.paymentStatus !== "PAID";
  const statusMeta = ORDER_STATUS_META[order.status];

  return (
    <div className="container-page py-14 lg:py-20">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/12">
          <CheckCircle2 className="size-9 text-emerald-600 dark:text-emerald-400" />
        </span>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Thank you for your order
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Your order has been recorded. A copy of these details is available any time from
          your account.
        </p>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
            {order.orderNumber}
          </span>
          <Badge className={statusMeta.className} variant="outline">
            {statusMeta.label}
          </Badge>
          <span className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</span>
        </div>
      </Reveal>

      {awaitingPayment && (
        <Reveal delay={0.1} className="mx-auto mt-8 max-w-3xl">
          <div className="flex gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/8 p-5">
            <Clock className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold">Payment pending</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                You chose online payment, but no payment has been collected — online payments
                are not yet enabled on this store. Your order is recorded and our team will
                contact you to arrange payment.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.15} className="mx-auto mt-10 max-w-3xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Order progress
          </h2>
          <div className="mt-6">
            <OrderStatusTimeline status={order.status} events={order.events} />
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2} className="mx-auto mt-6 max-w-3xl">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          {/* Items */}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Package className="size-4" />
              Items ({order.items.length})
            </h2>
            <ul className="mt-5 space-y-4">
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
          </div>

          <Separator />

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Delivery */}
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <Truck className="size-4" />
                Delivery address
              </h2>
              <address className="mt-4 text-sm not-italic leading-relaxed text-muted-foreground">
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
                <br />
                {order.customerEmail}
              </address>
            </div>

            {/* Totals */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Payment summary
              </h2>
              <dl className="mt-4 space-y-2.5 text-sm">
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
                <Separator className="my-3" />
                <div className="flex justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatINR(order.total)}</dd>
                </div>
                <div className="flex justify-between pt-2">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="font-medium">
                    {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online (Razorpay)"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="accent">
          <Link href="/account/orders">View all orders</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
