"use client";

import { useEffect, useState } from "react";
import { BILLING_PLANS, type BillingPlanId } from "@/config/billingPlans";
import { CreditCard, ArrowRight, CheckCircle, ExternalLink } from "lucide-react";

export default function TenantBillingPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/me")
      .then((r) => r.json())
      .then((data) => {
        setTenant(data.tenant);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    if (!tenant?.id) return;
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, returnUrl: window.location.href }),
    });
    const { url } = await res.json();
    if (url) window.open(url, "_blank");
  };

  const changePlan = async (planId: string) => {
    if (!tenant?.id) return;
    await fetch("/api/billing/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, planId }),
    });
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading billing...</p>
      </div>
    );
  }

  const currentPlan = tenant?.billingPlan
    ? BILLING_PLANS[tenant.billingPlan as BillingPlanId]
    : null;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your subscription, payment method, and invoices.</p>

      {/* Current Plan */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Current Plan</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {currentPlan?.name || "No plan"}{" "}
              <span className="text-base font-normal text-gray-400">
                — £{currentPlan?.priceMonthly || 0}/mo
              </span>
            </h2>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              tenant?.billingStatus === "active"
                ? "bg-emerald-100 text-emerald-700"
                : tenant?.billingStatus === "delinquent"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {tenant?.billingStatus || "unknown"}
            </span>
          </div>
          <CreditCard className="h-8 w-8 text-gray-300" />
        </div>

        {tenant?.nextInvoiceDate && (
          <p className="mt-4 text-sm text-gray-500">
            Next invoice: <strong>{new Date(tenant.nextInvoiceDate).toLocaleDateString("en-GB")}</strong>
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/admin/billing/usage"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition"
          >
            View Usage & Costs
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={openPortal}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Manage Payment Method
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={openPortal}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            View Invoices
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Plan Features */}
      {currentPlan && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">What&apos;s included</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {currentPlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upgrade / Downgrade */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">Plans</h3>
        <p className="mt-1 text-sm text-gray-500">Switch your plan at any time. Changes are prorated.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.values(BILLING_PLANS).map((plan) => {
            const isCurrent = plan.id === tenant?.billingPlan;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 transition ${
                  isCurrent ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <h4 className="text-sm font-bold text-gray-900">{plan.name}</h4>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  £{plan.priceMonthly}
                  <span className="text-sm font-normal text-gray-400">/mo</span>
                </p>
                <p className="mt-2 text-xs text-gray-500">{plan.description}</p>
                {isCurrent ? (
                  <p className="mt-4 text-xs font-semibold text-emerald-600">Current plan</p>
                ) : (
                  <button
                    onClick={() => changePlan(plan.id)}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-emerald-600 transition"
                  >
                    Switch to {plan.name}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
