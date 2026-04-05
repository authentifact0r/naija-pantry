export const dynamic = "force-dynamic";

import { getScopedDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { FlashSalesManager } from "./flash-sales-manager";

export default async function AdminFlashSalesPage() {
  await requireAdmin();
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug") || "";

  let sales: any[] = [];
  let products: any[] = [];
  try {
    const tdb = await getScopedDb();
    sales = await tdb.flashSale.findMany({
      include: { product: { select: { name: true, sku: true, price: true, images: true } } },
      orderBy: { endsAt: "asc" },
    });
    products = await tdb.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, price: true, images: true },
      orderBy: { name: "asc" },
    });

    sales = sales.map((s: any) => ({
      ...s,
      discountPercent: Number(s.discountPercent),
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      product: { ...s.product, price: Number(s.product.price) },
    }));
    products = products.map((p: any) => ({ ...p, price: Number(p.price) }));
  } catch {}

  return <FlashSalesManager sales={sales} products={products} tenantSlug={tenantSlug} />;
}
