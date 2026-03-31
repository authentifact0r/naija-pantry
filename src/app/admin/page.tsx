export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingCart, AlertTriangle, Users, TrendingUp, Clock } from "lucide-react";

export default async function AdminDashboard() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    totalOrders,
    totalUsers,
    pendingOrders,
    lowStockBatches,
    expiringBatches,
    recentOrders,
    revenue,
  ] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.order.count(),
    db.user.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.inventoryBatch.count({ where: { quantity: { lte: 10, gt: 0 } } }),
    db.inventoryBatch.count({
      where: { expiryDate: { lte: thirtyDaysFromNow, gte: now } },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    db.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.total ?? 0);

  const stats = [
    { label: "Products", value: totalProducts, icon: Package, color: "text-emerald-700 bg-emerald-50" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "text-blue-700 bg-blue-50" },
    { label: "Revenue", value: formatPrice(totalRevenue), icon: TrendingUp, color: "text-green-700 bg-green-50" },
    { label: "Customers", value: totalUsers, icon: Users, color: "text-purple-700 bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 p-5">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">
                {lowStockBatches} low stock batches
              </p>
              <p className="text-sm text-amber-600">Items with 10 or fewer units</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-4 p-5">
            <Clock className="h-8 w-8 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                {expiringBatches} batches expiring soon
              </p>
              <p className="text-sm text-red-600">Within the next 30 days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending + Recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Recent Orders
              {pendingOrders > 0 && (
                <Badge variant="warning">{pendingOrders} pending</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(Number(order.total))}</p>
                    <Badge
                      variant={
                        order.status === "PENDING"
                          ? "warning"
                          : order.status === "DELIVERED"
                            ? "success"
                            : "secondary"
                      }
                      className="mt-1"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
