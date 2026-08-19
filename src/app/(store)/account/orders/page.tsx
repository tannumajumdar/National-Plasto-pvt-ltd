import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductVisual } from "@/components/products/product-visual";
import { Reveal } from "@/components/animations/motion-primitives";
import { requireUser } from "@/lib/auth/session";
import { getUserOrders } from "@/lib/queries/orders";
import { ORDER_STATUS_META } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await getUserOrders(user.id);

  if (orders.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order it will appear here with its full status history."
          action={{ label: "Start shopping", href: "/products" }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order, i) => {
        const meta = ORDER_STATUS_META[order.status];
        return (
          <Reveal key={order.id} delay={Math.min(i, 6) * 0.06}>
            <Card className="transition-all duration-300 hover:shadow-lift">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold tracking-tight">{order.orderNumber}</span>
                      <Badge variant="outline" className={meta.className}>
                        <span className={`size-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Placed {formatDate(order.createdAt, "long")} · {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-extrabold tabular-nums">{formatINR(order.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 4).map((item) => (
                      <span
                        key={item.id}
                        className="relative size-12 overflow-hidden rounded-xl border-2 border-card bg-muted"
                      >
                        <ProductVisual
                          name={item.name}
                          accent="national"
                          src={item.image}
                          sizes="48px"
                          rounded="rounded-lg"
                        />
                      </span>
                    ))}
                    {order.items.length > 4 && (
                      <span className="grid size-12 place-items-center rounded-xl border-2 border-card bg-secondary text-xs font-semibold">
                        +{order.items.length - 4}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                  >
                    View details
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        );
      })}
    </div>
  );
}
