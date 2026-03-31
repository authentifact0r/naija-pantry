import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reorderAction } from "@/actions/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      address: { select: { city: true, state: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Order History</h2>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {order.createdAt.toLocaleDateString()} &middot;{" "}
                    {order.address.city}, {order.address.state}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[order.status] ?? "secondary"}>
                    {order.status}
                  </Badge>
                  <span className="font-semibold">
                    {formatPrice(Number(order.total))}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="text-gray-500">
                      {formatPrice(Number(item.totalPrice))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm text-gray-500">
                <span>Shipping: {formatPrice(Number(order.shippingCost))}</span>
                <form action={reorderAction.bind(null, order.id)}>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-1 h-3 w-3" /> Reorder
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
