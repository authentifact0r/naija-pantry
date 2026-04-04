import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeBillingMetrics } from "@/lib/usageBilling";
import type { PlanId } from "@/config/usagePricing";

/**
 * GET /api/billing/usage?tenantId=xxx&months=3
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get("tenantId");
    const months = parseInt(request.nextUrl.searchParams.get("months") || "1");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { billingPlan: true, hostingProvider: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const records = await db.tenantUsage.findMany({
      where: { tenantId, periodStart: { gte: since } },
      orderBy: { periodStart: "desc" },
    });

    const plan = (tenant.billingPlan || "standard") as PlanId;
    const provider = tenant.hostingProvider || "vercel";

    const periodsWithMetrics = records.map((r) => {
      const metrics = computeBillingMetrics(plan, r as any, provider);
      return { ...r, metrics };
    });

    return NextResponse.json({
      records: periodsWithMetrics,
      plan,
      hostingProvider: provider,
      tenantName: tenant.name,
    });
  } catch (error: any) {
    console.error("Usage fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/billing/usage — record usage for a period
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, periodStart, periodEnd, gcp, vercel } = body;

    if (!tenantId || !periodStart || !periodEnd) {
      return NextResponse.json({ error: "tenantId, periodStart, periodEnd required" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { billingPlan: true, hostingProvider: true },
    });

    const plan = (tenant?.billingPlan || "standard") as PlanId;
    const provider = tenant?.hostingProvider || "vercel";

    const usageData = {
      gcpCloudRunRequests: gcp?.cloud_run_requests || 0,
      gcpCloudRunCpuSeconds: gcp?.cloud_run_cpu_seconds || 0,
      gcpCloudRunMemoryGbHrs: gcp?.cloud_run_memory_gb_hours || 0,
      gcpFirestoreReads: gcp?.firestore_reads || 0,
      gcpFirestoreWrites: gcp?.firestore_writes || 0,
      gcpFirestoreStorageGb: gcp?.firestore_storage_gb || 0,
      gcpStorageGb: gcp?.storage_gb || 0,
      gcpStorageEgressGb: gcp?.storage_egress_gb || 0,
      vercelBuildMinutes: vercel?.build_minutes || 0,
      vercelServerlessInvocations: vercel?.serverless_invocations || 0,
      vercelEdgeRequests: vercel?.edge_invocations || 0,
      vercelBandwidthGb: vercel?.bandwidth_gb || 0,
      vercelImageOptimizations: vercel?.image_optimization || 0,
    };

    const metrics = computeBillingMetrics(plan, usageData, provider);

    const record = await db.tenantUsage.upsert({
      where: {
        tenantId_periodStart_periodEnd: {
          tenantId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
        },
      },
      update: {
        ...usageData,
        gcpCostGbp: metrics.backendUsageGbp,
        vercelCostGbp: metrics.hostingUsageGbp,
        totalCostGbp: metrics.totalMonthlyCostGbp,
      },
      create: {
        tenantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        ...usageData,
        gcpCostGbp: metrics.backendUsageGbp,
        vercelCostGbp: metrics.hostingUsageGbp,
        totalCostGbp: metrics.totalMonthlyCostGbp,
      },
    });

    return NextResponse.json({ record, metrics });
  } catch (error: any) {
    console.error("Usage record error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
