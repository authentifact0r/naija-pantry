"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, getStockStatus } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    compareAtPrice?: string | null;
    images: string[];
    category: string;
    weightKg: string;
    isPerishable: boolean;
    isSubscribable: boolean;
    totalStock: number;
    flashSale?: {
      discountPercent: string;
      endsAt: string;
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const stock = getStockStatus(product.totalStock);
  const hasFlashSale = product.flashSale != null;
  const price = parseFloat(product.price);
  const salePrice = hasFlashSale
    ? price * (1 - parseFloat(product.flashSale!.discountPercent) / 100)
    : price;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      quantity: 1,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        weightKg: product.weightKg,
        isPerishable: product.isPerishable,
        slug: product.slug,
      },
    });
  };

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No image
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <Badge variant={stock.variant}>{stock.label}</Badge>
            {hasFlashSale && (
              <Badge variant="destructive" className="gap-1">
                <Zap className="h-3 w-3" />
                {product.flashSale!.discountPercent}% OFF
              </Badge>
            )}
            {product.isPerishable && (
              <Badge variant="outline" className="bg-white/90">Fresh</Badge>
            )}
          </div>

          {product.isSubscribable && (
            <div className="absolute right-2 top-2">
              <Badge variant="secondary" className="bg-amber-500 text-white">
                Subscribe & Save
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
          {product.category}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2 hover:text-emerald-800">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-gray-500">{product.weightKg}kg</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(salePrice)}
            </span>
            {(hasFlashSale || product.compareAtPrice) && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.compareAtPrice || product.price)}
              </span>
            )}
          </div>

          <Button
            size="icon"
            variant="default"
            onClick={handleAddToCart}
            disabled={product.totalStock <= 0}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
