"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Truck, AlertTriangle, CreditCard, Lock, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalWeight, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [paymentProvider, setPaymentProvider] = useState<"PAYSTACK" | "STRIPE">("PAYSTACK");

  // Address form state
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    line1: "",
    city: "",
    state: "",
    postcode: "",
    phone: "",
  });

  const shippingCosts: Record<string, number> = {
    STANDARD: 1500 + Math.max(0, totalWeight() - 5) * 200,
    EXPRESS: 3500 + Math.max(0, totalWeight() - 5) * 200,
    LOCAL_VAN: 2000,
    LOCAL_FRESH: 1000,
  };

  const shippingCost = shippingCosts[shippingMethod] || 0;
  const total = subtotal() + shippingCost;
  const hasPerishables = items.some((i) => i.product?.isPerishable);

  const isAddressValid =
    address.firstName &&
    address.lastName &&
    address.line1 &&
    address.city &&
    address.state &&
    address.postcode &&
    address.phone;

  const handlePlaceOrder = async () => {
    if (!isAddressValid) {
      setError("Please fill in all address fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          shippingMethod,
          paymentProvider,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // If we got a payment URL (Paystack), redirect there
      if (data.paymentUrl) {
        clearCart();
        window.location.href = data.paymentUrl;
        return;
      }

      // Otherwise, order placed successfully
      clearCart();
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">Add some products before checkout.</p>
        <Button className="mt-6" onClick={() => router.push("/products")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Step 1: Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="First Name"
                required
                value={address.firstName}
                onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
              />
              <Input
                placeholder="Last Name"
                required
                value={address.lastName}
                onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
              />
              <Input
                placeholder="Address Line 1"
                required
                className="sm:col-span-2"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              />
              <Input
                placeholder="City"
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
              <Input
                placeholder="State"
                required
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
              />
              <Input
                placeholder="Postcode"
                required
                value={address.postcode}
                onChange={(e) => setAddress({ ...address, postcode: e.target.value })}
              />
              <Input
                placeholder="Phone"
                type="tel"
                required
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Step 2: Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" /> 2. Shipping Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasPerishables && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Your cart contains perishable items
                    </p>
                    <p className="text-amber-600">
                      Perishable items require local delivery. If you are outside our local delivery area, these items will need to be removed.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Cart weight: {totalWeight().toFixed(1)} kg
              </p>

              {[
                { id: "STANDARD", name: "Standard Shipping", desc: "5-7 business days", cost: shippingCosts.STANDARD },
                { id: "EXPRESS", name: "Express Shipping", desc: "1-2 business days", cost: shippingCosts.EXPRESS },
                { id: "LOCAL_VAN", name: "Local Van Delivery", desc: "Same-day (heavy items)", cost: shippingCosts.LOCAL_VAN },
                { id: "LOCAL_FRESH", name: "Local Fresh Delivery", desc: "Same-day (perishables)", cost: shippingCosts.LOCAL_FRESH },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                    shippingMethod === method.id
                      ? "border-emerald-600 bg-emerald-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={method.id}
                      checked={shippingMethod === method.id}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="accent-emerald-800"
                    />
                    <div>
                      <p className="text-sm font-medium">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(method.cost)}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Step 3: Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> 3. Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <button onClick={() => setPaymentProvider("PAYSTACK")}>
                  <Badge
                    variant={paymentProvider === "PAYSTACK" ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    Paystack
                  </Badge>
                </button>
                <button onClick={() => setPaymentProvider("STRIPE")}>
                  <Badge
                    variant={paymentProvider === "STRIPE" ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    Stripe
                  </Badge>
                </button>
              </div>
              <p className="text-sm text-gray-500">
                You will be redirected to {paymentProvider === "PAYSTACK" ? "Paystack" : "Stripe"} to complete your payment securely.
              </p>
              <Button
                size="lg"
                className="w-full"
                disabled={loading || !isAddressValid}
                onClick={handlePlaceOrder}
              >
                <Lock className="mr-2 h-4 w-4" />
                {loading ? "Processing..." : `Pay ${formatPrice(total)}`}
              </Button>
              {!isAddressValid && (
                <p className="text-xs text-gray-400 text-center">
                  Please fill in your shipping address to continue
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-700 line-clamp-1">
                    {item.product?.name} &times; {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(
                      parseFloat(item.product?.price || "0") * item.quantity
                    )}
                  </span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(subtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <hr />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
