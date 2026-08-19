import "server-only";

import prisma from "@/lib/db/prisma";

export interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  needsReviewProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averageOrderValue: number;
  unreadMessages: number;
  pendingReviews: number;
  lowStockCount: number;
}

/** Cancelled orders never count toward revenue. */
const REVENUE_WHERE = { status: { not: "CANCELLED" as const } };

export async function getDashboardStats(): Promise<DashboardStats> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    publishedProducts,
    needsReviewProducts,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalCustomers,
    revenueAgg,
    monthAgg,
    unreadMessages,
    pendingReviews,
    lowStockCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.product.count({ where: { needsReview: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.order.aggregate({ where: REVENUE_WHERE, _sum: { total: true }, _avg: { total: true } }),
    prisma.order.aggregate({
      where: { ...REVENUE_WHERE, createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.product.count({ where: { trackStock: true, stock: { gt: 0, lte: 5 } } }),
  ]);

  return {
    totalProducts,
    publishedProducts,
    needsReviewProducts,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalCustomers,
    totalRevenue: revenueAgg._sum.total ?? 0,
    revenueThisMonth: monthAgg._sum.total ?? 0,
    averageOrderValue: Math.round(revenueAgg._avg.total ?? 0),
    unreadMessages,
    pendingReviews,
    lowStockCount,
  };
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  orders: number;
}

/**
 * Revenue and order count for the last N months, oldest first.
 * Buckets are built in JS so the result is identical across SQL dialects.
 */
export async function getRevenueSeries(months = 6): Promise<RevenuePoint[]> {
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { ...REVENUE_WHERE, createdAt: { gte: start } },
    select: { total: true, createdAt: true },
  });

  const buckets = new Map<string, RevenuePoint>();
  const cursor = new Date(start);

  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    buckets.set(key, {
      label: cursor.toLocaleString("en-IN", { month: "short" }),
      revenue: 0,
      orders: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const order of orders) {
    const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += order.total;
    bucket.orders += 1;
  }

  return [...buckets.values()];
}

export interface CollectionBreakdown {
  name: string;
  slug: string;
  accent: string;
  products: number;
}

export async function getCollectionBreakdown(): Promise<CollectionBreakdown[]> {
  const rows = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      slug: true,
      accent: true,
      _count: { select: { products: true } },
    },
  });

  return rows.map((c) => ({
    name: c.name,
    slug: c.slug,
    accent: c.accent,
    products: c._count.products,
  }));
}

export async function getRecentOrders(take = 6) {
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      total: true,
      status: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    total: o.total,
    status: o.status,
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));
}

/** Best-selling products by units shipped, excluding cancelled orders. */
export async function getTopProducts(take = 5) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "name", "slug"],
    where: { order: REVENUE_WHERE, productId: { not: null } },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take,
  });

  return grouped.map((g) => ({
    productId: g.productId,
    name: g.name,
    slug: g.slug,
    units: g._sum.quantity ?? 0,
    revenue: g._sum.lineTotal ?? 0,
  }));
}
