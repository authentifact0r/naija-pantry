export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { createFlashSale } from "@/actions/inventory";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Zap } from "lucide-react";

export default async function FlashSalesPage() {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [flashSales, expiringProducts] = await Promise.all([
    db.flashSale.findMany({
      include: { product: { select: { name: true, price: true, sku: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // Products with batches expiring in 30 days — candidates for flash sales
    db.product.findMany({
      where: {
        isActive: true,
        inventoryBatches: {
          some: {
            expiryDate: { lte: thirtyDays, gte: now },
            quantity: { gt: 0 },
          },
        },
        flashSale: null, // not already on flash sale
      },
      select: { id: true, name: true, sku: true, price: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Zap className="h-6 w-6 text-amber-500" /> Flash Sales
      </h1>

      {/* Create flash sale */}
      <Card>
        <CardHeader>
          <CardTitle>Create Flash Sale</CardTitle>
        </CardHeader>
        <CardContent>
          {expiringProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No near-expiry products available for flash sales.</p>
          ) : (
            <form action={createFlashSale} className="grid gap-4 sm:grid-cols-3">
              <Select name="productId" required>
                <option value="">Select Product</option>
                {expiringProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatPrice(Number(p.price))}
                  </option>
                ))}
              </Select>
              <Input
                name="discountPercent"
                type="number"
                placeholder="Discount %"
                min="5"
                max="90"
                required
              />
              <Input name="endsAt" type="datetime-local" required />
              <Input name="reason" placeholder="Reason (e.g., Near expiry)" className="sm:col-span-2" />
              <div>
                <Button type="submit" variant="secondary">
                  <Zap className="mr-2 h-4 w-4" /> Create Sale
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Active sales */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Ends</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flashSales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.product.name}</TableCell>
              <TableCell>
                <Badge variant="destructive">{Number(sale.discountPercent)}% OFF</Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {sale.reason || "—"}
              </TableCell>
              <TableCell className="text-sm">
                {sale.endsAt.toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant={sale.isActive && sale.endsAt >= now ? "success" : "secondary"}>
                  {sale.isActive && sale.endsAt >= now ? "Active" : "Ended"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
