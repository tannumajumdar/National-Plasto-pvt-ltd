import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowRight, Users } from "lucide-react";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminSearch } from "@/components/admin/admin-search";
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
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import type { SearchParamsInput } from "@/lib/filters";
import { formatDate, formatINR, initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim();
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.UserWhereInput = { role: "USER" };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: { not: "CANCELLED" } },
          select: { total: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const rows = customers.map((c) => ({
    ...c,
    // Spend is summed per customer in JS; the page size keeps this cheap.
    totalSpend: c.orders.reduce((sum, o) => sum + o.total, 0),
  }));

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <>
      <AdminTopbar
        title="Customers"
        description={`${total} registered ${total === 1 ? "customer" : "customers"}`}
        crumbs={[{ label: "Customers" }]}
        menuSlot={<AdminMenuButton />}
      />

      <div className="p-5 sm:p-8">
        <AdminSearch placeholder="Search by name, email or phone…" className="mb-5 max-w-md" />

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <EmptyState
              icon={Users}
              title="No customers found"
              description={
                q
                  ? "No customers match your search."
                  : "Registered customers will appear here."
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Registered</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total spend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {initials(customer.name)}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="block truncate font-medium hover:text-accent"
                          >
                            {customer.name}
                          </Link>
                          <span className="block truncate text-xs text-muted-foreground">
                            {customer.email}
                          </span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {customer.phone ?? "—"}
                    </TableCell>

                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">
                      {formatDate(customer.createdAt)}
                    </TableCell>

                    <TableCell className="text-right font-medium tabular-nums">
                      {customer._count.orders}
                    </TableCell>

                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatINR(customer.totalSpend)}
                    </TableCell>

                    <TableCell>
                      <Badge variant={customer.isActive ? "success" : "danger"}>
                        {customer.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label={`View ${customer.name}`}
                      >
                        <ArrowRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} className="mt-8" />
      </div>
    </>
  );
}
