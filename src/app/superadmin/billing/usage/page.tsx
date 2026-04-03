"use client";

import { useEffect, useState } from "react";
import { Cloud, Globe, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TenantUsageSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  plan: string;
  latestPeriod: string;
  gcpCost: number;
  vercelCost: number;
  totalCost: number;
  basePlan: number;
  totalBill: number;
}

export default function SuperadminUsagePage() {
  const [summaries, setSummaries] = useState<TenantUsageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/superadmin/tenants")
      .then((r) => r.json())
      .then(async (data) => {
        const tenants = data.tenants || [];
        const results: TenantUsageSummary[] = [];

        for (const t of tenants) {
          try {
            const res = await fetch(`/api/billing/usage?tenantId=${t.id}&months=1`);
            const usage = await res.json();
            const latest = usage.records?.[0];
            const planPrices: Record<string, number> = { basic: 49, standard: 99, premium: 199 };
            const basePlan = planPrices[t.billingPlan] || 99;

            results.push({
              tenantId: t.id,
              tenantName: t.name,
              tenantSlug: t.slug,
              plan: t.billingPlan,
              latestPeriod: latest
                ? `${new Date(latest.periodStart).toLocaleDateString("en-GB", { month: "short" })} ${new Date(latest.periodStart).getFullYear()}`
                : "—",
              gcpCost: latest?.cost?.gcpCost || 0,
              vercelCost: latest?.cost?.vercelCost || 0,
              totalCost: latest?.cost?.totalCost || 0,
              basePlan,
              totalBill: basePlan + (latest?.cost?.totalCost || 0),
            });
          } catch {
            results.push({
              tenantId: t.id,
              tenantName: t.name,
              tenantSlug: t.slug,
              plan: t.billingPlan,
              latestPeriod: "—",
              gcpCost: 0,
              vercelCost: 0,
              totalCost: 0,
              basePlan: 99,
              totalBill: 99,
            });
          }
        }

        setSummaries(results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalRevenue = summaries.reduce((s, t) => s + t.totalBill, 0);
  const totalUsage = summaries.reduce((s, t) => s + t.totalCost, 0);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Loading usage overview...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/superadmin/billing" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Billing
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Platform Usage Overview</h1>
        <p className="mt-1 text-sm text-gray-500">All tenants — base plan + usage overage = total monthly bill.</p>

        {/* Totals */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total MRR</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">£{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Usage Overage</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">£{totalUsage.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Active Tenants</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{summaries.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-medium text-gray-500">Tenant</th>
                <th className="px-5 py-3 font-medium text-gray-500">Plan</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Base</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">GCP</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Vercel</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Overage</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Total Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summaries.map((t) => (
                <tr key={t.tenantId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{t.tenantName}</p>
                    <p className="text-xs text-gray-400">{t.latestPeriod}</p>
                  </td>
                  <td className="px-5 py-3 capitalize text-gray-600">{t.plan}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-600">£{t.basePlan}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-500">£{t.gcpCost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-500">£{t.vercelCost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-600">£{t.totalCost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-gray-900">£{t.totalBill.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
