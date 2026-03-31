import { getCurrentUser } from "@/lib/auth";
import { getScopedDb } from "@/lib/db";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, RefreshCw, ShoppingCart } from "lucide-react";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tdb = await getScopedDb();

  const [orderCount, addressCount, subscriptionCount, recentOrders] =
    await Promise.all([
      tdb.order.count({ where: { userId: user.id } }),
      db.address.count({ where: { userId: user.id } }),
      tdb.subscription.count({
        where: { userId: user.id, status: "ACTIVE" },
      }),
      tdb.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const stats = [
    { label: "Total Orders", value: orderCount, icon: Package },
    { label: "Saved Addresses", value: addressCount, icon: MapPin },
    { label: "Active Subscriptions", value: subscriptionCount, icon: RefreshCw },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Icon className="h-5 w-5 text-emerald-800" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₦{Number(order.total).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
