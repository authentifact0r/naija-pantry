export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { updateOrderStatus } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Printer } from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

type UpdatableStatus = "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const nextStatus: Record<string, UpdatableStatus> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      address: { select: { city: true, state: true } },
      warehouse: { select: { name: true } },
      items: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Shipping</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const next = nextStatus[order.status];
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {order.createdAt.toLocaleDateString()}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">
                    {order.user.firstName} {order.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{order.user.email}</p>
                </TableCell>
                <TableCell>{order.items.length}</TableCell>
                <TableCell>{formatPrice(Number(order.total))}</TableCell>
                <TableCell>{Number(order.totalWeightKg).toFixed(1)}kg</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {order.shippingMethod}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    {order.address.city}, {order.address.state}
                  </p>
                </TableCell>
                <TableCell>
                  {order.warehouse?.name || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[order.status] ?? "secondary"}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {next && (
                      <form
                        action={updateOrderStatus.bind(null, order.id, next)}
                      >
                        <Button variant="outline" size="sm">
                          Mark {next.toLowerCase()}
                        </Button>
                      </form>
                    )}
                    {/* Packing slip - opens printable view */}
                    <Button variant="ghost" size="icon" title="Print packing slip">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
