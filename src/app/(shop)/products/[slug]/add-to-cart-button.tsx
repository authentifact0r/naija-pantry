"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

interface Props {
  product: {
    id: string;
    name: string;
    price: string;
    images: string[];
    weightKg: string;
    isPerishable: boolean;
    slug: string;
  };
  disabled?: boolean;
}

export function AddToCartButton({ product, disabled }: Props) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem({ productId: product.id, quantity: qty, product });
  };

  return (
    <div className="flex gap-3">
      <div className="flex items-center rounded-lg border">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => setQty(Math.max(1, qty - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center font-medium">{qty}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => setQty(qty + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        size="lg"
        className="flex-1"
        onClick={handleAdd}
        disabled={disabled}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {disabled ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
