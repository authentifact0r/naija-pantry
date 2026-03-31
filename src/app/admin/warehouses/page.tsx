export const dynamic = "force-dynamic";

import { getScopedDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Warehouse, MapPin, Plus } from "lucide-react";

async function addWarehouse(formData: FormData) {
  "use server";
  await requireAdmin();
  const tdb = await getScopedDb();

  await tdb.warehouse.create({
    data: {
      name: formData.get("name") as string,
      code: (formData.get("code") as string).toUpperCase(),
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      country: (formData.get("country") as string) || "NG",
      latitude: parseFloat(formData.get("latitude") as string),
      longitude: parseFloat(formData.get("longitude") as string),
    },
  });

  revalidatePath("/admin/warehouses");
}

export default async function WarehousesPage() {
  await requireAdmin();
  const tdb = await getScopedDb();

  const warehouses = await tdb.warehouse.findMany({
    include: {
      _count: {
        select: {
          inventoryBatches: true,
          orders: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Warehouse className="h-6 w-6" /> Warehouses
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh) => (
          <Card key={wh.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{wh.name}</h3>
                  <p className="text-sm text-gray-500">Code: {wh.code}</p>
                </div>
                <Badge variant={wh.isActive ? "success" : "secondary"}>
                  {wh.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-3 flex items-start gap-1 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {wh.address}, {wh.city}, {wh.state}, {wh.country}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>{wh._count.inventoryBatches} inventory batches</span>
                <span>{wh._count.orders} orders</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add warehouse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Warehouse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addWarehouse} className="grid gap-4 sm:grid-cols-3">
            <Input name="name" placeholder="Warehouse Name" required />
            <Input name="code" placeholder="Code (e.g., LOS)" required maxLength={5} />
            <Input name="country" placeholder="Country" defaultValue="NG" />
            <Input name="address" placeholder="Address" required className="sm:col-span-2" />
            <Input name="city" placeholder="City" required />
            <Input name="state" placeholder="State" required />
            <Input name="latitude" type="number" step="any" placeholder="Latitude" required />
            <Input name="longitude" type="number" step="any" placeholder="Longitude" required />
            <div className="sm:col-span-3">
              <Button type="submit">Add Warehouse</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
