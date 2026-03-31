"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";

interface Props {
  productId: string;
  productName: string;
  price: number;
}

export function SubscribeToggle({ productId, productName, price }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval] = useState("MONTHLY");
  const discountedPrice = price * 0.95;

  if (!enabled) {
    return (
      <button
        onClick={() => setEnabled(true)}
        className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-left transition-colors hover:border-amber-400"
      >
        <RefreshCw className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Subscribe & Save 5%
          </p>
          <p className="text-xs text-amber-600">
            Get {productName} delivered regularly for {formatPrice(discountedPrice)}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            Subscribe & Save 5%
          </span>
        </div>
        <button
          onClick={() => setEnabled(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="text-sm"
        >
          <option value="WEEKLY">Every week</option>
          <option value="BIWEEKLY">Every 2 weeks</option>
          <option value="MONTHLY">Every month</option>
        </Select>
        <span className="text-sm font-bold text-amber-800">
          {formatPrice(discountedPrice)}
        </span>
      </div>
      <Button variant="secondary" className="mt-3 w-full">
        Subscribe Now
      </Button>
    </div>
  );
}
