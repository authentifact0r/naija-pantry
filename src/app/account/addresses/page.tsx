import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus } from "lucide-react";

async function addAddress(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await db.address.create({
    data: {
      userId: user.id,
      label: (formData.get("label") as string) || "Home",
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      line1: formData.get("line1") as string,
      line2: (formData.get("line2") as string) || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postcode: formData.get("postcode") as string,
      phone: (formData.get("phone") as string) || undefined,
    },
  });

  revalidatePath("/account/addresses");
}

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Saved Addresses</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    <span className="font-medium">{addr.label}</span>
                    {addr.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {addr.firstName} {addr.lastName}
                    <br />
                    {addr.line1}
                    {addr.line2 && <>, {addr.line2}</>}
                    <br />
                    {addr.city}, {addr.state} {addr.postcode}
                    <br />
                    {addr.country}
                  </p>
                  {addr.phone && (
                    <p className="mt-1 text-sm text-gray-500">{addr.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add New Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAddress} className="grid gap-4 sm:grid-cols-2">
            <Input name="label" placeholder="Label (e.g., Home)" />
            <Input name="phone" placeholder="Phone" type="tel" />
            <Input name="firstName" placeholder="First Name" required />
            <Input name="lastName" placeholder="Last Name" required />
            <Input name="line1" placeholder="Address Line 1" required className="sm:col-span-2" />
            <Input name="line2" placeholder="Address Line 2" className="sm:col-span-2" />
            <Input name="city" placeholder="City" required />
            <Input name="state" placeholder="State" required />
            <Input name="postcode" placeholder="Postcode" required />
            <div className="sm:col-span-2">
              <Button type="submit">Save Address</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
