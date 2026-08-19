import "server-only";

import prisma from "@/lib/db/prisma";
import type { OrderDTO, OrderStatusValue } from "@/types";

const orderInclude = {
  items: {
    select: {
      id: true,
      name: true,
      slug: true,
      collectionName: true,
      image: true,
      unitPrice: true,
      quantity: true,
      lineTotal: true,
    },
  },
  events: {
    select: { id: true, status: true, note: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  },
} as const;

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string;
  shipPincode: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  createdAt: Date;
  items: {
    id: string; name: string; slug: string; collectionName: string;
    image: string | null; unitPrice: number; quantity: number; lineTotal: number;
  }[];
  events: { id: string; status: string; note: string | null; createdAt: Date }[];
};

function mapOrder(o: OrderRow): OrderDTO {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as OrderStatusValue,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shipLine1: o.shipLine1,
    shipLine2: o.shipLine2,
    shipCity: o.shipCity,
    shipState: o.shipState,
    shipPincode: o.shipPincode,
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping,
    total: o.total,
    items: o.items,
    events: o.events.map((e) => ({
      id: e.id,
      status: e.status as OrderStatusValue,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
    createdAt: o.createdAt.toISOString(),
  };
}

/** Orders belonging to one customer, newest first. */
export async function getUserOrders(userId: string): Promise<OrderDTO[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
  return rows.map(mapOrder);
}

/**
 * Fetches one order, scoped to its owner unless `allowAny` is set for admins.
 * Scoping here means a customer cannot read another customer's order by id.
 */
export async function getOrder(
  identifier: { id?: string; orderNumber?: string },
  options: { userId?: string; allowAny?: boolean } = {},
): Promise<OrderDTO | null> {
  if (!identifier.id && !identifier.orderNumber) return null;

  const row = await prisma.order.findFirst({
    where: {
      ...(identifier.id ? { id: identifier.id } : {}),
      ...(identifier.orderNumber ? { orderNumber: identifier.orderNumber } : {}),
      ...(options.allowAny ? {} : { userId: options.userId ?? "__none__" }),
    },
    include: orderInclude,
  });

  return row ? mapOrder(row) : null;
}
