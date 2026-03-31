export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updateProduct } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  return db.product.findUnique({ where: { id } });
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, product.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <p className="mt-1 text-sm text-gray-500">
        Editing: {product.name}
      </p>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <form action={updateWithId} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <Input
                name="name"
                required
                className="mt-1"
                defaultValue={product.name}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <Input
                name="sku"
                required
                className="mt-1"
                defaultValue={product.sku}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <Select
                name="category"
                required
                className="mt-1"
                defaultValue={product.category}
              >
                <option value="GROCERIES">Groceries</option>
                <option value="SPICES">Spices</option>
                <option value="DRINKS">Drinks</option>
                <option value="BEAUTY">Beauty</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price (NGN)
              </label>
              <Input
                name="price"
                type="number"
                step="0.01"
                required
                className="mt-1"
                defaultValue={Number(product.price)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Compare-at Price (NGN)
              </label>
              <Input
                name="compareAtPrice"
                type="number"
                step="0.01"
                className="mt-1"
                defaultValue={
                  product.compareAtPrice
                    ? Number(product.compareAtPrice)
                    : undefined
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Weight (kg)
              </label>
              <Input
                name="weightKg"
                type="number"
                step="0.001"
                required
                className="mt-1"
                defaultValue={Number(product.weightKg)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <Input
                name="tags"
                className="mt-1"
                defaultValue={product.tags.join(", ")}
                placeholder="staple, nigerian, vegan"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                required
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                defaultValue={product.description}
              />
            </div>

            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isPerishable"
                  className="accent-emerald-800"
                  defaultChecked={product.isPerishable}
                />
                Perishable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isFragile"
                  className="accent-emerald-800"
                  defaultChecked={product.isFragile}
                />
                Fragile
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isSubscribable"
                  className="accent-emerald-800"
                  defaultChecked={product.isSubscribable}
                />
                Subscribable (Auto-ship)
              </label>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg">
                Update Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
