"use client";

import { ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

interface IngredientItem {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    images: string[];
    weightKg: string;
    isPerishable: boolean;
    slug: string;
  };
}

interface BuyAllIngredientsButtonProps {
  items: IngredientItem[];
}

export function BuyAllIngredientsButton({ items }: BuyAllIngredientsButtonProps) {
  const { addItem } = useCart();

  const handleBuyAll = () => {
    for (const item of items) {
      addItem({
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images,
          weightKg: item.product.weightKg,
          isPerishable: item.product.isPerishable,
          slug: item.product.slug,
        },
      });
    }
  };

  return (
    <Button onClick={handleBuyAll} variant="secondary" size="lg" className="w-full">
      <ShoppingBasket className="mr-2 h-5 w-5" />
      Buy All Ingredients
    </Button>
  );
}
