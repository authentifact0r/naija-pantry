export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Truck, RefreshCw, Shield, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";

async function getFeaturedProducts() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      inventoryBatches: { select: { quantity: true } },
      flashSale: true,
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return products.map((p) => {
    const activeSale =
      p.flashSale && p.flashSale.isActive && p.flashSale.endsAt >= now
        ? p.flashSale
        : null;
    return {
      ...p,
      price: p.price.toString(),
      compareAtPrice: p.compareAtPrice?.toString() ?? null,
      weightKg: p.weightKg.toString(),
      totalStock: p.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0),
      flashSale: activeSale
        ? {
            discountPercent: activeSale.discountPercent.toString(),
            endsAt: activeSale.endsAt.toISOString(),
          }
        : null,
    };
  });
}

async function getFlashSales() {
  const sales = await db.flashSale.findMany({
    where: { isActive: true, endsAt: { gte: new Date() } },
    include: {
      product: {
        include: {
          inventoryBatches: { select: { quantity: true } },
        },
      },
    },
    take: 4,
  });

  return sales.map((s) => ({
    ...s.product,
    price: s.product.price.toString(),
    compareAtPrice: s.product.compareAtPrice?.toString() ?? null,
    weightKg: s.product.weightKg.toString(),
    totalStock: s.product.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0),
    flashSale: {
      discountPercent: s.discountPercent.toString(),
      endsAt: s.endsAt.toISOString(),
    },
  }));
}

export default async function HomePage() {
  const [featured, flashSales] = await Promise.all([
    getFeaturedProducts(),
    getFlashSales(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 px-4 py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl">
          <Badge variant="secondary" className="mb-4 bg-amber-500 text-white">
            Authentic Nigerian Foods
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            The taste of home,
            <br />
            <span className="text-amber-400">delivered fresh.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-emerald-100">
            From Garri to Egusi, Palm Oil to Suya Spice — shop over 500+
            authentic Nigerian products with same-day local delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products">
              <Button size="lg" variant="secondary" className="text-base">
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/recipes">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Explore Recipes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b bg-white px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, label: "Same-day local delivery", desc: "Within Lagos metro" },
            { icon: RefreshCw, label: "Subscribe & Save 5%", desc: "Auto-ship your staples" },
            { icon: Leaf, label: "Fresh & authentic", desc: "Direct from trusted suppliers" },
            { icon: Shield, label: "Secure payments", desc: "Paystack & card payments" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sales */}
      {flashSales.length > 0 && (
        <section className="bg-red-50 px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">Flash Sales</h2>
              <Badge variant="destructive">Limited Time</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Near-expiry items at unbeatable prices — grab them before they&apos;re gone!
            </p>
            <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {flashSales.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Products
            </h2>
            <Link href="/products">
              <Button variant="link">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Groceries", href: "/products?category=GROCERIES", color: "bg-green-100 text-green-800", desc: "Rice, Garri, Beans, Yam Flour & more" },
              { name: "Spices", href: "/products?category=SPICES", color: "bg-orange-100 text-orange-800", desc: "Suya Spice, Cameroon Pepper, Ogiri" },
              { name: "Drinks", href: "/products?category=DRINKS", color: "bg-blue-100 text-blue-800", desc: "Zobo, Chapman, Palm Wine, Malt" },
              { name: "Beauty", href: "/products?category=BEAUTY", color: "bg-pink-100 text-pink-800", desc: "Shea Butter, Black Soap, Hair products" },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cat.color}`}>
                  {cat.name}
                </div>
                <p className="mt-3 text-sm text-gray-600">{cat.desc}</p>
                <span className="mt-2 inline-flex items-center text-sm font-medium text-emerald-800 group-hover:underline">
                  Shop now <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
