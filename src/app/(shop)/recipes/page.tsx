export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { RecipeCard } from "@/components/shop/recipe-card";
import type { RecipeWithItems } from "@/types";

async function getRecipes(): Promise<RecipeWithItems[]> {
  return db.recipe.findMany({
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nigerian Recipes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover authentic recipes and buy all ingredients with one click
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">No recipes yet. Check back soon!</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
