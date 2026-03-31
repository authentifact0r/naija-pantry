"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";

export function CartSheet() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, updateQuantity, totalItems, subtotal } = useCart();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label="Open cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems() > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            {totalItems()}
          </span>
        )}
      </Button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                Your Cart ({totalItems()})
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-100" />
                      <div className="flex flex-1 flex-col">
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.product?.price || "0")}
                        </p>
                        <div className="mt-auto flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-7 w-7 text-red-500"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-6">
                <div className="mb-4 flex justify-between text-base font-semibold">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal())}</span>
                </div>
                <p className="mb-4 text-xs text-gray-500">
                  Shipping calculated at checkout
                </p>
                <Link href="/checkout" onClick={() => setOpen(false)}>
                  <Button className="w-full" size="lg">
                    Checkout
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
