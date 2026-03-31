"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Trash2, AlertTriangle, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalItems, totalWeight, subtotal } = useCart();

  const hasPerishables = items.some((i) => i.product?.isPerishable);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">
          Looks like you haven&apos;t added any products yet.
        </p>
        <Link href="/products">
          <Button className="mt-6" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Your Cart ({totalItems()})
        </h1>
        <Link href="/products" className="text-sm text-emerald-700 hover:text-emerald-900">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      {hasPerishables && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">
              Your cart contains perishable items
            </p>
            <p className="text-amber-600">
              Perishable items require local delivery and may have shorter shelf
              lives. Please plan accordingly.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const price = parseFloat(item.product?.price || "0");
            const lineTotal = price * item.quantity;

            return (
              <Card key={item.productId}>
                <CardContent className="flex gap-4 p-4">
                  {/* Product Image */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name || "Product"}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-gray-300">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/products/${item.product?.slug || ""}`}
                          className="font-medium text-gray-900 hover:text-emerald-800"
                        >
                          {item.product?.name || "Product"}
                        </Link>
                        <div className="mt-1 flex gap-1">
                          {item.product?.isPerishable && (
                            <Badge variant="warning" className="text-xs">
                              Perishable
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(price)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal ({totalItems()} items)
                </span>
                <span className="font-medium">{formatPrice(subtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Weight</span>
                <span className="font-medium">
                  {totalWeight().toFixed(1)} kg
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-500">Calculated at checkout</span>
              </div>
              <hr />
              <div className="flex justify-between text-base font-bold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal())}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Checkout
              </Button>

              <Link href="/products" className="block">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
