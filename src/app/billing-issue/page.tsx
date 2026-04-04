"use client";

import { AlertTriangle, CreditCard, ArrowRight, Receipt } from "lucide-react";
import Link from "next/link";

export default function BillingIssuePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-white">Admin Access Restricted</h1>
        <p className="mt-3 text-sm text-white/50 leading-relaxed">
          Your admin access is restricted due to an unpaid invoice.
          Your storefront remains live, but dashboard and admin features
          are unavailable until payment is resolved.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left">
          <p className="text-xs uppercase tracking-wider text-white/30 mb-3">Invoice Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Base Retainer</span>
              <span className="tabular-nums">Unpaid</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Hosting Usage (Vercel)</span>
              <span className="tabular-nums">Unpaid</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Backend Usage (GCP)</span>
              <span className="tabular-nums">Unpaid</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/admin/billing"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
          >
            <Receipt className="h-4 w-4" />
            Go to Billing
          </Link>
          <a
            href="mailto:hello@authentifactor.com"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-6 text-sm font-medium text-white/60 transition hover:border-white/20 hover:text-white"
          >
            Contact Support
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <p className="mt-8 text-xs text-white/30">
          Your storefront is still live. Only admin features are restricted.
        </p>
      </div>
    </div>
  );
}
