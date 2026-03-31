import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice, getStockStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./add-to-cart-button";
import { SubscribeToggle } from "./subscribe-toggle";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      inventoryBatches: {
        select: { quantity: true, expiryDate: true, batchNumber: true, warehouse: { select: { name: true, city: true } } },
      },
      flashSale: true,
    },
  });

  if (!product) return null;

  const now = new Date();
  const activeSale =
    product.flashSale && product.flashSale.isActive && product.flashSale.endsAt >= now
      ? product.flashSale
      : null;

  return {
    ...product,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? null,
    weightKg: product.weightKg.toString(),
    totalStock: product.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0),
    flashSale: activeSale
      ? {
          discountPercent: activeSale.discountPercent.toString(),
          endsAt: activeSale.endsAt.toISOString(),
        }
      : null,
    batches: product.inventoryBatches.map((b) => ({
      ...b,
      expiryDate: b.expiryDate?.toISOString() ?? null,
    })),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const stock = getStockStatus(product.totalStock);
  const price = parseFloat(product.price);
  const hasFlashSale = product.flashSale != null;
  const salePrice = hasFlashSale
    ? price * (1 - parseFloat(product.flashSale!.discountPercent) / 100)
    : price;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-gray-300">
                📦
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <Image src={img} alt="" fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-700">
            {product.category}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <Badge variant={stock.variant}>{stock.label}</Badge>
            {product.isPerishable && <Badge variant="outline">Perishable</Badge>}
            {product.isFragile && <Badge variant="outline">Fragile</Badge>}
            {hasFlashSale && (
              <Badge variant="destructive">
                {product.flashSale!.discountPercent}% OFF — Flash Sale
              </Badge>
            )}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(salePrice)}
            </span>
            {(hasFlashSale || product.compareAtPrice) && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.compareAtPrice || product.price)}
              </span>
            )}
          </div>

          <dl className="mt-6 space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <dt className="font-medium text-gray-900">Weight:</dt>
              <dd>{product.weightKg} kg</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-900">SKU:</dt>
              <dd>{product.sku}</dd>
            </div>
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </dl>

          <p className="mt-6 text-gray-700 leading-relaxed">{product.description}</p>

          {/* Add to Cart */}
          <div className="mt-8 space-y-4">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images,
                weightKg: product.weightKg,
                isPerishable: product.isPerishable,
                slug: product.slug,
              }}
              disabled={product.totalStock <= 0}
            />

            {product.isSubscribable && (
              <SubscribeToggle
                productId={product.id}
                productName={product.name}
                price={salePrice}
              />
            )}
          </div>

          {/* Warehouse availability */}
          {product.batches.length > 0 && (
            <div className="mt-8 rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-gray-900">Availability by Location</h3>
              <div className="mt-3 space-y-2">
                {product.batches.map((batch, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{batch.warehouse.name} ({batch.warehouse.city})</span>
                    <span className={batch.quantity > 0 ? "text-green-700" : "text-red-600"}>
                      {batch.quantity > 0 ? `${batch.quantity} in stock` : "Out of stock"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
