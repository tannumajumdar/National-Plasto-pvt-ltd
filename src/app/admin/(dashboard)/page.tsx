import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Mail,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import {
  CollectionChart,
  OrdersChart,
  RevenueChart,
} from "@/components/admin/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter, Reveal } from "@/components/animations/motion-primitives";
import {
  getCollectionBreakdown,
  getDashboardStats,
  getRecentOrders,
  getRevenueSeries,
  getTopProducts,
} from "@/lib/queries/admin";
import { ORDER_STATUS_META } from "@/lib/constants";
import { cn, formatINR, relativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const [stats, revenue, collections, recentOrders, topProducts] = await Promise.all([
    getDashboardStats(),
    getRevenueSeries(6),
    getCollectionBreakdown(),
    getRecentOrders(6),
    getTopProducts(5),
  ]);

  const tiles = [
    {
      label: "Total Revenue",
      value: formatINR(stats.totalRevenue),
      numeric: null,
      icon: IndianRupee,
      hint: `${formatINR(stats.revenueThisMonth)} this month`,
      tone: "accent",
    },
    {
      label: "Total Orders",
      value: null,
      numeric: stats.totalOrders,
      icon: ShoppingBag,
      hint: `Avg ${formatINR(stats.averageOrderValue)}`,
      tone: "sapphire",
    },
    {
      label: "Total Products",
      value: null,
      numeric: stats.totalProducts,
      icon: Package,
      hint: `${stats.publishedProducts} published`,
      tone: "next",
    },
    {
      label: "Total Customers",
      value: null,
      numeric: stats.totalCustomers,
      icon: Users,
      hint: "Registered accounts",
      tone: "emerald",
    },
  ];

  const statusTiles = [
    { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, href: "/admin/orders?status=PENDING", tone: "amber" },
    { label: "Completed Orders", value: stats.completedOrders, icon: CheckCircle2, href: "/admin/orders?status=DELIVERED", tone: "emerald" },
    { label: "Needs Product Info", value: stats.needsReviewProducts, icon: AlertTriangle, href: "/admin/products?needsReview=1", tone: "rose" },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Star, href: "/admin/reviews", tone: "violet" },
  ];

  return (
    <>
      <AdminTopbar
        title="Dashboard"
        description="Overview of your store's catalogue, orders and customers"
        menuSlot={<AdminMenuButton />}
      />

      <div className="space-y-6 p-5 sm:p-8">
        {/* Setup notice while the catalogue is still being completed */}
        {stats.needsReviewProducts > 0 && (
          <Reveal>
            <Card className="border-amber-500/35 bg-amber-500/8">
              <CardContent className="flex flex-wrap items-center gap-4 p-5">
                <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {stats.needsReviewProducts} products need details
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    The source product list supplied names only. Add prices, descriptions,
                    specifications and images so they can be sold online.
                  </p>
                </div>
                <Link
                  href="/admin/products?needsReview=1"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  Complete them
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          </Reveal>
        )}

        {/* Headline metrics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile, i) => (
            <Reveal key={tile.label} delay={i * 0.07}>
              <Card className="group relative h-full overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-lift hover:ring-accent/25">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-linear-to-br from-accent/18 to-cyan/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-linear-to-r from-accent to-cyan transition-transform duration-500 group-hover:scale-x-100"
                />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "grid size-11 place-items-center rounded-xl",
                        tile.tone === "accent" && "bg-accent/15 text-accent",
                        tile.tone === "sapphire" && "bg-sapphire/15 text-sapphire",
                        tile.tone === "next" && "bg-next/15 text-next",
                        tile.tone === "emerald" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      <tile.icon className="size-5" />
                    </span>
                    <TrendingUp className="size-4 text-muted-foreground/40" />
                  </div>

                  <p className="mt-5 text-3xl font-extrabold tracking-tight tabular-nums">
                    {tile.numeric !== null ? (
                      <AnimatedCounter value={tile.numeric} />
                    ) : (
                      tile.value
                    )}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{tile.label}</p>
                  <p className="mt-2 text-xs text-muted-foreground/75">{tile.hint}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Status shortcuts */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusTiles.map((tile, i) => (
            <Reveal key={tile.label} delay={i * 0.06}>
              <Link href={tile.href}>
                <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        tile.tone === "amber" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        tile.tone === "emerald" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        tile.tone === "rose" && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                        tile.tone === "violet" && "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                      )}
                    >
                      <tile.icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-2xl font-bold tabular-nums">{tile.value}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tile.label}
                      </span>
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal><RevenueChart data={revenue} /></Reveal>
          <Reveal delay={0.1}><OrdersChart data={revenue} /></Reveal>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Reveal><CollectionChart data={collections} /></Reveal>

          {/* Top products */}
          <Reveal delay={0.1}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Top products</CardTitle>
                <CardDescription>By units ordered</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border">
                    <p className="px-6 text-center text-sm text-muted-foreground">
                      No sales data yet.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {topProducts.map((p, i) => (
                      <li key={`${p.productId}-${i}`} className="flex items-center gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold">
                          {i + 1}
                        </span>
                        <Link
                          href={`/products/${p.slug}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium hover:text-accent"
                        >
                          {p.name}
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {p.units} units
                        </span>
                        <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                          {formatINR(p.revenue)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Recent orders */}
        <Reveal>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Recent orders</CardTitle>
                <CardDescription>The latest activity in your store</CardDescription>
              </div>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
              >
                View all
                <ArrowRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="grid h-32 place-items-center rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentOrders.map((order) => {
                    const meta = ORDER_STATUS_META[order.status];
                    return (
                      <li key={order.id}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex flex-wrap items-center gap-4 py-3.5 transition-colors hover:bg-secondary/50"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {order.orderNumber}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {order.customerName} · {order.itemCount}{" "}
                              {order.itemCount === 1 ? "item" : "items"} ·{" "}
                              {relativeTime(order.createdAt)}
                            </span>
                          </span>
                          <Badge variant="outline" className={meta.className}>
                            <span className={cn("size-1.5 rounded-full", meta.dot)} />
                            {meta.label}
                          </Badge>
                          <span className="w-24 shrink-0 text-right text-sm font-bold tabular-nums">
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
        </Reveal>

        {stats.unreadMessages > 0 && (
          <Reveal>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <Mail className="size-5 shrink-0 text-accent" />
                <p className="flex-1 text-sm">
                  <span className="font-semibold">{stats.unreadMessages} unread</span> contact
                  {stats.unreadMessages === 1 ? " message" : " messages"} in your enquiry inbox.
                </p>
                <Link
                  href="/admin/settings#messages"
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Read
                </Link>
              </CardContent>
            </Card>
          </Reveal>
        )}
      </div>
    </>
  );
}
