"use client";

import { useEffect, useState } from "react";
import { BILLING_PLANS, type BillingPlanId } from "@/config/billingPlans";
import Link from "next/link";

interface TenantBilling {
  id: string;
  name: string;
  slug: string;
  billingPlan: string;
  billingStatus: string;
  hostingProvider: string;
  stripeCustomerId: string | null;
  nextInvoiceDate: string | null;
  lastPaymentStatus: string | null;
  lastInvoiceTotalGbp: number | null;
  lastInvoiceBaseRetainerGbp: number | null;
  lastInvoiceHostingUsageGbp: number | null;
  lastInvoiceBackendUsageGbp: number | null;
}

export default function SuperadminBillingPage() {
  const [tenants, setTenants] = useState<TenantBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");

  useEffect(() => {
    fetch("/api/superadmin/tenants")
      .then((r) => r.json())
      .then((data) => { setTenants(data.tenants || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tenants.filter((t) => {
    if (filterProvider !== "all" && t.hostingProvider !== filterProvider) return false;
    if (filterStatus !== "all" && t.billingStatus !== filterStatus) return false;
    if (filterPlan !== "all" && t.billingPlan !== filterPlan) return false;
    return true;
  });

  const totalMRR = filtered.reduce((s, t) => s + (t.lastInvoiceTotalGbp || (BILLING_PLANS[t.billingPlan as BillingPlanId]?.priceMonthly || 0)), 0);
  const totalHosting = filtered.reduce((s, t) => s + (t.lastInvoiceHostingUsageGbp || 0), 0);
  const totalBackend = filtered.reduce((s, t) => s + (t.lastInvoiceBackendUsageGbp || 0), 0);

  const openPortal = async (tenantId: string) => {
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, returnUrl: window.location.href }),
    });
    const { url } = await res.json();
    if (url) window.open(url, "_blank");
  };

  const statusColor = (s: string) => s === "active" ? "bg-emerald-100 text-emerald-700" : s === "delinquent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700";

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Billing</h1>
            <p className="mt-1 text-sm text-gray-500">Split billing: Base Retainer + Hosting (Vercel) + Backend (GCP)</p>
          </div>
          <Link href="/superadmin/billing/usage" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition">
            Usage Overview
          </Link>
        </div>

        {/* Summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total MRR</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">£{totalMRR.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Hosting Usage</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">£{totalHosting.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Backend Usage</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">£{totalBackend.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Active Tenants</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{filtered.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
            <option value="all">All Providers</option>
            <option value="vercel">Vercel</option>
            <option value="gcp">GCP</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="delinquent">Delinquent</option>
            <option value="paused">Paused</option>
          </select>
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
            <option value="all">All Plans</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-medium text-gray-500">Tenant</th>
                <th className="px-5 py-3 font-medium text-gray-500">Provider</th>
                <th className="px-5 py-3 font-medium text-gray-500">Plan</th>
                <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Base</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Hosting</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Backend</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Total</th>
                <th className="px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => {
                const base = t.lastInvoiceBaseRetainerGbp || (BILLING_PLANS[t.billingPlan as BillingPlanId]?.priceMonthly || 0);
                const hosting = t.lastInvoiceHostingUsageGbp || 0;
                const backend = t.lastInvoiceBackendUsageGbp || 0;
                const total = t.lastInvoiceTotalGbp || (base + hosting + backend);
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 capitalize">{t.hostingProvider}</td>
                    <td className="px-5 py-3 text-xs font-medium text-gray-700 capitalize">{t.billingPlan}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(t.billingStatus)}`}>{t.billingStatus}</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-600">£{base.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-500">£{hosting.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-500">£{backend.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-gray-900">£{total.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      {t.stripeCustomerId && (
                        <button onClick={() => openPortal(t.id)} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition">
                          Stripe
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
