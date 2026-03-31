export const dynamic = "force-dynamic";

import Link from "next/link";
import { getScopedDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Edit } from "lucide-react";

export default async function AdminProductsPage() {
  await requireAdmin();
  const tdb = await getScopedDb();

  const products = await tdb.product.findMany({
    include: {
      inventoryBatches: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const totalStock = product.inventoryBatches.reduce(
              (s, b) => s + b.quantity, 0
            );
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {product.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.category}</Badge>
                </TableCell>
                <TableCell>{formatPrice(Number(product.price))}</TableCell>
                <TableCell>{Number(product.weightKg)}kg</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      totalStock <= 0
                        ? "destructive"
                        : totalStock <= 10
                          ? "warning"
                          : "success"
                    }
                  >
                    {totalStock}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {product.isPerishable && (
                      <Badge variant="outline" className="text-xs">Perishable</Badge>
                    )}
                    {product.isSubscribable && (
                      <Badge variant="outline" className="text-xs">Subscribable</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/products/${product.id}`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
