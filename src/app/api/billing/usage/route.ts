import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateUsageCost, type PlanId } from "@/config/usagePricing";

/**
 * GET /api/billing/usage?tenantId=xxx&months=3
 * Returns usage records + cost breakdown for a tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get("tenantId");
    const months = parseInt(request.nextUrl.searchParams.get("months") || "1");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const records = await db.tenantUsage.findMany({
      where: { tenantId, periodStart: { gte: since } },
      orderBy: { periodStart: "desc" },
    });

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { billingPlan: true, name: true },
    });

    const plan = (tenant?.billingPlan || "standard") as PlanId;

    // Calculate cost for each period
    const periodsWithCost = records.map((r) => {
      const cost = calculateUsageCost(
        {
          gcpCloudRunRequests: r.gcpCloudRunRequests,
          gcpCloudRunCpuSeconds: r.gcpCloudRunCpuSeconds,
          gcpCloudRunMemoryGbHrs: r.gcpCloudRunMemoryGbHrs,
          gcpFirestoreReads: r.gcpFirestoreReads,
          gcpFirestoreWrites: r.gcpFirestoreWrites,
          gcpFirestoreStorageGb: r.gcpFirestoreStorageGb,
          gcpStorageGb: r.gcpStorageGb,
          gcpStorageEgressGb: r.gcpStorageEgressGb,
          vercelBuildMinutes: r.vercelBuildMinutes,
          vercelServerlessInvocations: r.vercelServerlessInvocations,
          vercelBandwidthGb: r.vercelBandwidthGb,
          vercelImageOptimizations: r.vercelImageOptimizations,
          vercelEdgeRequests: r.vercelEdgeRequests,
        },
        plan,
      );
      return { ...r, cost };
    });

    return NextResponse.json({ records: periodsWithCost, plan });
  } catch (error: any) {
    console.error("Usage fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/billing/usage
 * Record usage for a billing period (called by cron or admin).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, periodStart, periodEnd, gcp, vercel } = body;

    if (!tenantId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "tenantId, periodStart, periodEnd are required" },
        { status: 400 },
      );
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { billingPlan: true },
    });

    const plan = (tenant?.billingPlan || "standard") as PlanId;

    const usageData = {
      gcpCloudRunRequests: gcp?.cloudRunRequests || 0,
      gcpCloudRunCpuSeconds: gcp?.cloudRunCpuSeconds || 0,
      gcpCloudRunMemoryGbHrs: gcp?.cloudRunMemoryGbHours || 0,
      gcpFirestoreReads: gcp?.firestoreReads || 0,
      gcpFirestoreWrites: gcp?.firestoreWrites || 0,
      gcpFirestoreStorageGb: gcp?.firestoreStorageGb || 0,
      gcpStorageGb: gcp?.storageGb || 0,
      gcpStorageEgressGb: gcp?.storageEgressGb || 0,
      vercelBuildMinutes: vercel?.buildMinutes || 0,
      vercelServerlessInvocations: vercel?.serverlessInvocations || 0,
      vercelBandwidthGb: vercel?.bandwidthGb || 0,
      vercelImageOptimizations: vercel?.imageOptimizations || 0,
      vercelEdgeRequests: vercel?.edgeRequests || 0,
    };

    const cost = calculateUsageCost(usageData, plan);

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
        gcpCostGbp: cost.gcpCost,
        vercelCostGbp: cost.vercelCost,
        totalCostGbp: cost.totalCost,
      },
      create: {
        tenantId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        ...usageData,
        gcpCostGbp: cost.gcpCost,
        vercelCostGbp: cost.vercelCost,
        totalCostGbp: cost.totalCost,
      },
    });

    return NextResponse.json({ record, cost });
  } catch (error: any) {
    console.error("Usage record error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
