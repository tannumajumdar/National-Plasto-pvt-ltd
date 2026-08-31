import { AdminSidebar, type AdminNavItem } from "@/components/admin/admin-sidebar";
import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware gates this too, but re-verify here: only this check can
  // confirm the account still exists and still holds the ADMIN role.
  const admin = await requireAdmin();

  const [pendingOrders, pendingReviews] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { isApproved: false } }),
  ]);

  const items: AdminNavItem[] = [
    { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { label: "Products", href: "/admin/products", icon: "Package" },
    { label: "Collections", href: "/admin/collections", icon: "Layers" },
    { label: "Categories", href: "/admin/categories", icon: "Tags" },
    { label: "Orders", href: "/admin/orders", icon: "ShoppingBag", badge: pendingOrders },
    { label: "Customers", href: "/admin/customers", icon: "Users" },
    { label: "Reviews", href: "/admin/reviews", icon: "Star", badge: pendingReviews },
    { label: "Homepage", href: "/admin/content", icon: "LayoutTemplate" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
  ];

  return (
    <div className="section-soft min-h-dvh bg-background">
      <AdminSidebar items={items} admin={{ name: admin.name, email: admin.email }} />
      <div className="flex flex-col min-h-dvh lg:pl-64">{children}</div>
    </div>
  );
}
