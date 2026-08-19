import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { OrderFilters } from "@/components/admin/order-filters";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/products/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import prisma from "@/lib/db/prisma";
import { ADMIN_PAGE_SIZE, ORDER_STATUS_META } from "@/lib/constants";
import type { SearchParamsInput } from "@/lib/filters";
import { cn, formatDateTime, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim();
  const status = one(sp.status);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.OrderWhereInput = {};
  const AND: Prisma.OrderWhereInput[] = [];

  if (q) {
    AND.push({
      OR: [
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerEmail: { contains: q } },
        { customerPhone: { contains: q } },
      ],
    });
  }
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    AND.push({ status: status as (typeof STATUSES)[number] });
  }
  if (AND.length) where.AND = AND;

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        total: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Record<string, number>;

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <>
      <AdminTopbar
        title="Orders"
        description={`${total} ${total === 1 ? "order" : "orders"}`}
        crumbs={[{ label: "Orders" }]}
        menuSlot={<AdminMenuButton />}
      />

      <div className="p-5 sm:p-8">
        <OrderFilters statuses={STATUSES} countByStatus={countByStatus} />

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <EmptyState
              icon={ShoppingBag}
              title="No orders found"
              description={
                q || status
                  ? "No orders match the current filters."
                  : "Orders will appear here as customers place them."
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Placed</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {orders.map((order) => {
                  const meta = ORDER_STATUS_META[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold hover:text-accent"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {order._count.items} {order._count.items === 1 ? "item" : "items"}
                        </p>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <p className="truncate font-medium">{order.customerName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customerEmail}
                        </p>
                      </TableCell>

                      <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">
                        {formatDateTime(order.createdAt)}
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <p className="text-sm">
                          {order.paymentMethod === "COD" ? "COD" : "Online"}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {order.paymentStatus.toLowerCase()}
                        </p>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={meta.className}>
                          <span className={cn("size-1.5 rounded-full", meta.dot)} />
                          {meta.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-bold tabular-nums">
                        {formatINR(order.total)}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label={`Open ${order.orderNumber}`}
                        >
                          <ArrowRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} className="mt-8" />
      </div>
    </>
  );
}
