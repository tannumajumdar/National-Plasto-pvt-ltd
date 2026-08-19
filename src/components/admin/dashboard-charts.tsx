"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR, formatINRCompact } from "@/lib/utils";
import type { CollectionBreakdown, RevenuePoint } from "@/lib/queries/admin";

const ACCENT_FILL: Record<string, string> = {
  next: "hsl(205 90% 48%)",
  national: "hsl(33 100% 52%)",
  sapphire: "hsl(244 66% 52%)",
};

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 shadow-float">
      {label && <p className="mb-1 text-xs font-semibold">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="ml-auto font-semibold tabular-nums">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasData = data.some((d) => d.revenue > 0 || d.orders > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Revenue</CardTitle>
        <CardDescription>Last {data.length} months, excluding cancelled orders</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyChart message="No orders yet — this chart fills in as orders come through." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(33 100% 55%)" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="hsl(33 100% 55%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => formatINRCompact(Number(v))}
                width={64}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(value, name) =>
                      name === "Revenue" ? formatINR(value) : String(value)
                    }
                  />
                }
                cursor={{ stroke: "hsl(var(--border))" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="hsl(33 100% 50%)"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function OrdersChart({ data }: { data: RevenuePoint[] }) {
  const hasData = data.some((d) => d.orders > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Orders</CardTitle>
        <CardDescription>Order volume per month</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyChart message="No orders yet." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar
                dataKey="orders"
                name="Orders"
                fill="hsl(244 66% 58%)"
                radius={[8, 8, 0, 0]}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function CollectionChart({ data }: { data: CollectionBreakdown[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Catalogue by collection</CardTitle>
        <CardDescription>Products in each brand line</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart message="No collections yet." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={130}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="products" name="Products" radius={[0, 8, 8, 0]} animationDuration={900}>
                {data.map((entry) => (
                  <Cell key={entry.slug} fill={ACCENT_FILL[entry.accent] ?? ACCENT_FILL.national} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-[260px] place-items-center rounded-xl border border-dashed border-border">
      <p className="max-w-xs px-6 text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
