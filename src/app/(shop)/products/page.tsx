export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";
import { Badge } from "@/components/ui/badge";
import type { ProductCategory } from "@prisma/client";

interface Props {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}

async function getProducts(category?: string, query?: string, page = 1) {
  const perPage = 12;
  const where: Record<string, unknown> = { isActive: true };

  if (category && ["GROCERIES", "SPICES", "DRINKS", "BEAUTY"].includes(category)) {
    where.category = category as ProductCategory;
  }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { tags: { has: query.toLowerCase() } },
    ];
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where: where as any,
      include: {
        inventoryBatches: { select: { quantity: true } },
        flashSale: { where: { isActive: true, endsAt: { gte: new Date() } } },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    db.product.count({ where: where as any }),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      price: p.price.toString(),
      compareAtPrice: p.compareAtPrice?.toString() ?? null,
      weightKg: p.weightKg.toString(),
      totalStock: p.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0),
      flashSale: p.flashSale
        ? {
            discountPercent: p.flashSale.discountPercent.toString(),
            endsAt: p.flashSale.endsAt.toISOString(),
          }
        : null,
    })),
    total,
    totalPages: Math.ceil(total / perPage),
  };
}

const categoryLabels: Record<string, string> = {
  GROCERIES: "Groceries",
  SPICES: "Spices",
  DRINKS: "Drinks",
  BEAUTY: "Beauty",
};

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { products, total, totalPages } = await getProducts(
    params.category,
    params.q,
    page
  );

  const title = params.category
    ? categoryLabels[params.category] || "Products"
    : "All Products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{total} products</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <a key={key} href={`/products?category=${key}`}>
              <Badge
                variant={params.category === key ? "default" : "outline"}
                className="cursor-pointer"
              >
                {label}
              </Badge>
            </a>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">No products found.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/products?${new URLSearchParams({
                ...(params.category ? { category: params.category } : {}),
                page: p.toString(),
              }).toString()}`}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                p === page
                  ? "bg-emerald-900 text-white"
                  : "border text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
