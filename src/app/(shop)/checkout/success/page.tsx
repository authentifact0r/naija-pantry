import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNumber = params.order;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Card>
        <CardContent className="pt-8 pb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Order Placed Successfully!
          </h1>
          {orderNumber && (
            <p className="mt-2 text-sm text-gray-500">
              Order number: <span className="font-mono font-semibold">{orderNumber}</span>
            </p>
          )}
          <p className="mt-4 text-gray-600">
            Thank you for your order. We&apos;ll send you a confirmation
            email shortly with your order details.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/account/orders">
              <Button className="w-full">
                <Package className="mr-2 h-4 w-4" /> View My Orders
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full">
                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
