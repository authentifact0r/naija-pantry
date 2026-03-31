import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { pauseSubscription, resumeSubscription, cancelSubscription } from "@/actions/subscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { RefreshCw, Pause, Play, XCircle } from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "destructive"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "destructive",
};

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subscriptions = await db.subscription.findMany({
    where: { userId: user.id },
    include: { product: { select: { name: true, price: true, images: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My Subscriptions</h2>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-gray-500">No subscriptions yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Look for &ldquo;Subscribe & Save&rdquo; on eligible products
            </p>
          </CardContent>
        </Card>
      ) : (
        subscriptions.map((sub) => {
          const discountedPrice =
            Number(sub.product.price) * (1 - Number(sub.discountPercent) / 100);

          return (
            <Card key={sub.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{sub.product.name}</h3>
                    <Badge variant={statusVariant[sub.status]}>
                      {sub.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatPrice(discountedPrice)} &times; {sub.quantity} &middot;{" "}
                    Every{" "}
                    {sub.interval === "WEEKLY"
                      ? "week"
                      : sub.interval === "BIWEEKLY"
                        ? "2 weeks"
                        : "month"}
                  </p>
                  {sub.status === "ACTIVE" && (
                    <p className="text-xs text-gray-400">
                      Next delivery: {sub.nextDelivery.toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {sub.status === "ACTIVE" && (
                    <form action={pauseSubscription.bind(null, sub.id)}>
                      <Button variant="outline" size="sm">
                        <Pause className="mr-1 h-3 w-3" /> Pause
                      </Button>
                    </form>
                  )}
                  {sub.status === "PAUSED" && (
                    <form action={resumeSubscription.bind(null, sub.id)}>
                      <Button variant="outline" size="sm">
                        <Play className="mr-1 h-3 w-3" /> Resume
                      </Button>
                    </form>
                  )}
                  {sub.status !== "CANCELLED" && (
                    <form action={cancelSubscription.bind(null, sub.id)}>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <XCircle className="mr-1 h-3 w-3" /> Cancel
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
