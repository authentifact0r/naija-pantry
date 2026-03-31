export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ShoppingBasket } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice, getStockStatus } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BuyAllIngredientsButton } from "./buy-all-button";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getRecipe(slug: string) {
  const recipe = await db.recipe.findUnique({
    where: { slug },
    include: {
      items: {
        include: {
          product: {
            include: {
              inventoryBatches: { select: { quantity: true } },
            },
          },
        },
      },
    },
  });

  return recipe;
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  if (!recipe) notFound();

  const totalCost = recipe.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const totalTime = recipe.prepTime + recipe.cookTime;

  // Prepare serializable items for client component
  const ingredientItems = recipe.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    measurement: item.measurement,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price.toString(),
      images: item.product.images,
      weightKg: item.product.weightKg.toString(),
      isPerishable: item.product.isPerishable,
      slug: item.product.slug,
      totalStock: item.product.inventoryBatches.reduce(
        (s, b) => s + b.quantity,
        0
      ),
    },
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl text-gray-300">
              🍲
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
          <p className="mt-3 text-gray-600 leading-relaxed">
            {recipe.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {recipe.prepTime} min prep
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {recipe.cookTime} min cook
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {recipe.servings} servings
            </span>
            <span className="flex items-center gap-1.5">
              <ShoppingBasket className="h-4 w-4" />
              {recipe.items.length} ingredients
            </span>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Total time: <span className="font-medium text-gray-900">{totalTime} minutes</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Instructions</h2>
        <div className="prose prose-emerald mt-4 max-w-none text-gray-700 leading-relaxed">
          {recipe.instructions.split("\n").map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            // Headings (lines starting with ##)
            if (line.startsWith("## ")) {
              return (
                <h3 key={i} className="mt-4 text-lg font-semibold text-gray-900">
                  {line.replace("## ", "")}
                </h3>
              );
            }
            // Bold text markers
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="mt-2 font-semibold">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            }
            // List items
            if (line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <li key={i} className="ml-4 list-disc">
                  {line.replace(/^[-*]\s/, "")}
                </li>
              );
            }
            // Numbered items
            if (/^\d+\.\s/.test(line)) {
              return (
                <li key={i} className="ml-4 list-decimal">
                  {line.replace(/^\d+\.\s/, "")}
                </li>
              );
            }
            return <p key={i} className="mt-2">{line}</p>;
          })}
        </div>
      </div>

      {/* Ingredients */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
          <p className="text-sm text-gray-500">
            Estimated total:{" "}
            <span className="font-semibold text-gray-900">
              {formatPrice(totalCost)}
            </span>
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {ingredientItems.map((item) => {
            const stock = getStockStatus(item.product.totalStock);
            return (
              <Card key={item.productId}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300 text-lg">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium text-gray-900 hover:text-emerald-800"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {item.measurement
                        ? `${item.measurement} (qty: ${item.quantity})`
                        : `Qty: ${item.quantity}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(
                        parseFloat(item.product.price) * item.quantity
                      )}
                    </span>
                    <Badge variant={stock.variant} className="text-xs">
                      {stock.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Buy All Button */}
        <div className="mt-6">
          <BuyAllIngredientsButton items={ingredientItems} />
        </div>
      </div>
    </div>
  );
}
