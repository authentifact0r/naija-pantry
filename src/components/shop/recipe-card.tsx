"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import type { RecipeWithItems } from "@/types";

interface RecipeCardProps {
  recipe: RecipeWithItems;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { addItem } = useCart();

  const handleBuyAll = () => {
    for (const item of recipe.items) {
      if (item.product) {
        addItem({
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price.toString(),
            images: item.product.images,
            weightKg: item.product.weightKg.toString(),
            isPerishable: item.product.isPerishable,
            slug: item.product.slug,
          },
        });
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-gray-100">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            🍲
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <Link href={`/recipes/${recipe.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-emerald-800">
            {recipe.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {recipe.description}
        </p>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {recipe.prepTime + recipe.cookTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {recipe.servings} servings
          </span>
          <span className="flex items-center gap-1">
            <ShoppingBasket className="h-3.5 w-3.5" />
            {recipe.items.length} items
          </span>
        </div>

        <Button
          onClick={handleBuyAll}
          variant="secondary"
          className="mt-4 w-full"
        >
          <ShoppingBasket className="mr-2 h-4 w-4" />
          Buy All Ingredients
        </Button>
      </CardContent>
    </Card>
  );
}
