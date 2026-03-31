import { createProduct } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Add Product</h1>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <form action={createProduct} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <Input name="name" required className="mt-1" placeholder="e.g., Premium Garri (White)" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <Input name="sku" required className="mt-1" placeholder="e.g., GRO-GAR-001" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <Select name="category" required className="mt-1">
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
              <Input name="price" type="number" step="0.01" required className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Compare-at Price (NGN)
              </label>
              <Input name="compareAtPrice" type="number" step="0.01" className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Weight (kg)
              </label>
              <Input name="weightKg" type="number" step="0.001" required className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <Input name="tags" className="mt-1" placeholder="staple, nigerian, vegan" />
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
                placeholder="Product description..."
              />
            </div>

            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPerishable" className="accent-emerald-800" />
                Perishable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFragile" className="accent-emerald-800" />
                Fragile
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isSubscribable" className="accent-emerald-800" />
                Subscribable (Auto-ship)
              </label>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg">
                Create Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
