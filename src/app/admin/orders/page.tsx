export const dynamic = "force-dynamic";

import { getScopedDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { OrdersManager } from "./orders-manager";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug") || "";

  let orders: any[] = [];
  let products: any[] = [];
  try {
    const tdb = await getScopedDb();
    orders = await tdb.order.findMany({
      include: {
        address: true,
        warehouse: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true, images: true, price: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    // Fetch user info separately (not available through scoped extend)
    for (const o of orders) {
      const { db: rawDb } = await import("@/lib/db");
      const user = await rawDb.user.findUnique({ where: { id: o.userId }, select: { firstName: true, lastName: true, email: true, phone: true } });
      (o as any).user = user;
    }
    products = await tdb.product.findMany({ where: { isActive: true }, select: { id: true, name: true, sku: true, price: true, images: true }, orderBy: { name: "asc" } });

    orders = orders.map((o: any) => ({
      ...o,
      subtotal: Number(o.subtotal), shippingCost: Number(o.shippingCost),
      total: Number(o.total), totalWeightKg: Number(o.totalWeightKg),
      createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
      shippedAt: o.shippedAt?.toISOString() || null, deliveredAt: o.deliveredAt?.toISOString() || null,
      items: o.items.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice), weightKg: Number(i.weightKg), product: { ...i.product, price: Number(i.product.price) } })),
    }));
    products = products.map((pr: any) => ({ ...pr, price: Number(pr.price) }));
  } catch (err: any) {
    console.error("[orders] Error:", err.message);
  }

  return <OrdersManager orders={orders} products={products} tenantSlug={tenantSlug} />;
}
