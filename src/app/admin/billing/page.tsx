"use client";

import { useEffect, useState } from "react";
import { BILLING_PLANS, type BillingPlanId } from "@/config/billingPlans";
import type { BreakdownItem } from "@/config/usagePricing";
import {
  CreditCard,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Cloud,
  Globe,
  Info,
  Receipt,
} from "lucide-react";

interface BillingMetrics {
  baseRetainerGbp: number;
  hostingUsageGbp: number;
  backendUsageGbp: number;
  totalMonthlyCostGbp: number;
  hostingBreakdown: BreakdownItem[];
  backendBreakdown: BreakdownItem[];
}

export default function TenantBillingPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/me")
      .then((r) => r.json())
      .then(async (data) => {
        setTenant(data.tenant);
        if (data.tenant?.id) {
          const res = await fetch(`/api/billing/usage?tenantId=${data.tenant.id}&months=1`);
          const usage = await res.json();
          if (usage.records?.[0]?.metrics) {
            setMetrics(usage.records[0].metrics);
          }
        }
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
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Loading billing...</p></div>;
  }

  const currentPlan = tenant?.billingPlan ? BILLING_PLANS[tenant.billingPlan as BillingPlanId] : null;
  const baseRetainer = metrics?.baseRetainerGbp ?? (currentPlan?.priceMonthly || 0);
  const hostingCost = metrics?.hostingUsageGbp ?? (tenant?.lastInvoiceHostingUsageGbp || 0);
  const backendCost = metrics?.backendUsageGbp ?? (tenant?.lastInvoiceBackendUsageGbp || 0);
  const totalCost = metrics?.totalMonthlyCostGbp ?? (baseRetainer + hostingCost + backendCost);

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
      <p className="mt-1 text-sm text-gray-500">Your plan, usage costs, and invoices — fully transparent.</p>

      {/* ── 1. Current Plan ── */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Current Plan</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {currentPlan?.name || "No plan"}{" "}
              <span className="text-base font-normal text-gray-400">— £{baseRetainer}/mo base</span>
            </h2>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              tenant?.billingStatus === "active" ? "bg-emerald-100 text-emerald-700" :
              tenant?.billingStatus === "delinquent" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
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
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={openPortal} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition">
            Manage Payment <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button onClick={openPortal} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            View Invoices <Receipt className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. Monthly Cost Summary ── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">Base Retainer</p>
          <p className="mt-1 text-xl font-bold text-gray-900">£{baseRetainer.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400 flex items-center gap-1"><Globe className="h-3 w-3" /> Hosting (Vercel)</p>
          <p className="mt-1 text-xl font-bold text-gray-900">£{hostingCost.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400 flex items-center gap-1"><Cloud className="h-3 w-3" /> Backend (GCP)</p>
          <p className="mt-1 text-xl font-bold text-gray-900">£{backendCost.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs text-emerald-600">Total This Month</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">£{totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* ── 3. Hosting Usage Breakdown ── */}
      {metrics?.hostingBreakdown && metrics.hostingBreakdown.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" /> Hosting Usage (Vercel)
          </h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Metric</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Quantity</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Unit Price</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.hostingBreakdown.map((item) => (
                  <tr key={item.metricKey}>
                    <td className="px-4 py-2.5 text-gray-700">{item.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.quantity.toLocaleString()} <span className="text-xs text-gray-400">{item.unit}</span></td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">£{item.unitPriceGbp}/{item.unit}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">£{item.totalGbp.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Backend Usage Breakdown ── */}
      {metrics?.backendBreakdown && metrics.backendBreakdown.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" /> Backend Usage (Google Cloud)
          </h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Metric</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Quantity</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Unit Price</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.backendBreakdown.map((item) => (
                  <tr key={item.metricKey}>
                    <td className="px-4 py-2.5 text-gray-700">{item.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.quantity.toLocaleString()} <span className="text-xs text-gray-400">{item.unit}</span></td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">£{item.unitPriceGbp}/{item.unit}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">£{item.totalGbp.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. How Your Bill is Calculated ── */}
      <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" /> How Your Bill is Calculated
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" /><span><strong>Base Retainer</strong> — Fixed monthly fee covering maintenance, security updates, hosting infrastructure, and support.</span></li>
          <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" /><span><strong>Hosting Usage (Vercel)</strong> — Build minutes, serverless/edge invocations, bandwidth, and image optimization for your frontend.</span></li>
          <li className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" /><span><strong>Backend Usage (Google Cloud)</strong> — Cloud Run compute, Firestore reads/writes/storage, and Cloud Storage for your APIs and data.</span></li>
        </ul>
      </div>

      {/* ── 6. Plans ── */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-900">Plans</h3>
        <p className="mt-1 text-sm text-gray-500">Switch plan anytime. Changes are prorated.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.values(BILLING_PLANS).map((plan) => {
            const isCurrent = plan.id === tenant?.billingPlan;
            return (
              <div key={plan.id} className={`rounded-xl border p-5 transition ${isCurrent ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <h4 className="text-sm font-bold text-gray-900">{plan.name}</h4>
                <p className="mt-1 text-2xl font-bold text-gray-900">£{plan.priceMonthly}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                <p className="mt-1 text-[11px] text-gray-400">+ hosting & backend usage</p>
                <p className="mt-2 text-xs text-gray-500">{plan.description}</p>
                {isCurrent ? (
                  <p className="mt-4 text-xs font-semibold text-emerald-600">Current plan</p>
                ) : (
                  <button onClick={() => changePlan(plan.id)} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-emerald-600 transition">
                    Switch to {plan.name} <ArrowRight className="h-3 w-3" />
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
