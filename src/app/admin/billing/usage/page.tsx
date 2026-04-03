"use client";

import { useEffect, useState } from "react";
import { BarChart3, Cloud, Globe, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UsageBreakdown {
  item: string;
  usage: number;
  freeTier: number;
  billable: number;
  rate: number;
  cost: number;
}

interface UsageRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  gcpCostGbp: number;
  vercelCostGbp: number;
  totalCostGbp: number;
  cost: {
    gcpCost: number;
    vercelCost: number;
    totalCost: number;
    breakdown: UsageBreakdown[];
  };
}

export default function TenantUsagePage() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [plan, setPlan] = useState("standard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant?.id) {
          return fetch(`/api/billing/usage?tenantId=${data.tenant.id}&months=3`);
        }
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) {
          setRecords(data.records || []);
          setPlan(data.plan || "standard");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const latest = records[0];
  const gcpItems = latest?.cost.breakdown.filter((b) =>
    b.item.startsWith("Cloud") || b.item.startsWith("Firestore") || b.item.startsWith("Storage")
  ) || [];
  const vercelItems = latest?.cost.breakdown.filter((b) =>
    b.item.startsWith("Build") || b.item.startsWith("Serverless") || b.item.startsWith("Bandwidth") || b.item.startsWith("Image") || b.item.startsWith("Edge")
  ) || [];

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Loading usage data...</p></div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <Link href="/admin/billing" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Billing
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Usage & Costs</h1>
      <p className="mt-1 text-sm text-gray-500">
        Transparent breakdown of your infrastructure usage. Plan: <strong className="text-gray-700 capitalize">{plan}</strong>
      </p>

      {!latest ? (
        <div className="mt-12 text-center text-gray-400">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4">No usage data yet for this billing period.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Cloud className="h-4 w-4" /> GCP Cost
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">£{latest.cost.gcpCost.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Globe className="h-4 w-4" /> Vercel Cost
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">£{latest.cost.vercelCost.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <TrendingUp className="h-4 w-4" /> Total Overage
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">£{latest.cost.totalCost.toFixed(2)}</p>
            </div>
          </div>

          {/* Period */}
          <p className="mt-6 text-xs text-gray-400">
            Period: {new Date(latest.periodStart).toLocaleDateString("en-GB")} — {new Date(latest.periodEnd).toLocaleDateString("en-GB")}
          </p>

          {/* GCP Breakdown */}
          {gcpItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-500" /> Google Cloud
              </h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Resource</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Usage</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Included</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Billable</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {gcpItems.map((item) => (
                      <tr key={item.item}>
                        <td className="px-4 py-2.5 text-gray-700">{item.item}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.usage.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">{item.freeTier.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.billable.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">£{item.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vercel Breakdown */}
          {vercelItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-700" /> Vercel
              </h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Resource</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Usage</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Included</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Billable</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vercelItems.map((item) => (
                      <tr key={item.item}>
                        <td className="px-4 py-2.5 text-gray-700">{item.item}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.usage.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">{item.freeTier.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{item.billable.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">£{item.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History */}
          {records.length > 1 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-gray-900">History</h2>
              <div className="mt-3 space-y-2">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {new Date(r.periodStart).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </span>
                    <div className="flex gap-4 text-sm tabular-nums">
                      <span className="text-gray-400">GCP: £{r.gcpCostGbp.toFixed(2)}</span>
                      <span className="text-gray-400">Vercel: £{r.vercelCostGbp.toFixed(2)}</span>
                      <span className="font-medium text-gray-900">Total: £{r.totalCostGbp.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
