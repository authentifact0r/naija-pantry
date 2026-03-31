export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { addInventoryBatch } from "@/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertTriangle, Clock } from "lucide-react";

export default async function AdminInventoryPage() {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [batches, products, warehouses] = await Promise.all([
    db.inventoryBatch.findMany({
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: [{ quantity: "asc" }, { expiryDate: "asc" }],
    }),
    db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
    }),
    db.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      {/* Alerts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <h3 className="flex items-center gap-2 font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Low Stock Items
            </h3>
            <div className="mt-2 space-y-1">
              {batches
                .filter((b) => b.quantity > 0 && b.quantity <= 10)
                .slice(0, 5)
                .map((b) => (
                  <div key={b.id} className="flex justify-between text-sm">
                    <span>{b.product.name} ({b.warehouse.code})</span>
                    <Badge variant="warning">{b.quantity} left</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <h3 className="flex items-center gap-2 font-semibold text-red-800">
              <Clock className="h-4 w-4" /> Expiring Within 30 Days
            </h3>
            <div className="mt-2 space-y-1">
              {batches
                .filter(
                  (b) =>
                    b.expiryDate &&
                    b.expiryDate <= thirtyDays &&
                    b.expiryDate >= now
                )
                .slice(0, 5)
                .map((b) => (
                  <div key={b.id} className="flex justify-between text-sm">
                    <span>{b.product.name}</span>
                    <span className="text-red-600">
                      {b.expiryDate!.toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add batch */}
      <Card>
        <CardHeader>
          <CardTitle>Add Inventory Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addInventoryBatch} className="grid gap-4 sm:grid-cols-3">
            <Select name="productId" required>
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </Select>
            <Select name="warehouseId" required>
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </Select>
            <Input name="quantity" type="number" placeholder="Quantity" required min="1" />
            <Input name="batchNumber" placeholder="Batch Number (optional)" />
            <Input name="expiryDate" type="date" placeholder="Expiry Date" />
            <Input name="costPrice" type="number" step="0.01" placeholder="Cost Price (NGN)" />
            <div className="sm:col-span-3">
              <Button type="submit">Add Batch</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Inventory table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Expiry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => {
            const isExpiring =
              batch.expiryDate &&
              batch.expiryDate <= thirtyDays &&
              batch.expiryDate >= now;
            return (
              <TableRow key={batch.id} className={isExpiring ? "bg-red-50" : ""}>
                <TableCell className="font-medium">{batch.product.name}</TableCell>
                <TableCell className="font-mono text-xs">{batch.product.sku}</TableCell>
                <TableCell>
                  {batch.warehouse.name} ({batch.warehouse.code})
                </TableCell>
                <TableCell>{batch.batchNumber || "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      batch.quantity <= 0
                        ? "destructive"
                        : batch.quantity <= 10
                          ? "warning"
                          : "success"
                    }
                  >
                    {batch.quantity}
                  </Badge>
                </TableCell>
                <TableCell>
                  {batch.expiryDate ? (
                    <span className={isExpiring ? "font-semibold text-red-600" : ""}>
                      {batch.expiryDate.toLocaleDateString()}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
