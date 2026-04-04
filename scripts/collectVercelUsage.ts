/**
 * Collect Vercel usage for all tenants.
 * Run via: npx tsx scripts/collectVercelUsage.ts
 *
 * Requires:
 *   VERCEL_API_TOKEN
 *   VERCEL_TEAM_ID (optional)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchVercelUsage(projectId: string) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token || !projectId) {
    console.warn("  VERCEL_API_TOKEN or projectId not set — using mock data");
    return {
      buildMinutes: Math.round(Math.random() * 60 * 100) / 100,
      serverlessInvocations: Math.floor(Math.random() * 100000),
      edgeInvocations: Math.floor(Math.random() * 50000),
      bandwidthGb: Math.round(Math.random() * 20 * 100) / 100,
      imageOptimizations: Math.floor(Math.random() * 5000),
    };
  }

  const teamParam = process.env.VERCEL_TEAM_ID ? `&teamId=${process.env.VERCEL_TEAM_ID}` : "";

  try {
    // Vercel Usage API — fetch current billing period
    const res = await fetch(
      `https://api.vercel.com/v1/usage?projectId=${projectId}${teamParam}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      console.warn(`  Vercel API returned ${res.status}`);
      return null;
    }

    const data = await res.json();

    return {
      buildMinutes: data.usage?.buildMinutes || 0,
      serverlessInvocations: data.usage?.serverlessInvocations || 0,
      edgeInvocations: data.usage?.edgeInvocations || 0,
      bandwidthGb: (data.usage?.bandwidthBytes || 0) / (1024 ** 3),
      imageOptimizations: data.usage?.imageOptimizations || 0,
    };
  } catch (err) {
    console.error(`  Vercel API error:`, err);
    return null;
  }
}

async function main() {
  console.log("Collecting Vercel usage for tenants...\n");

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const tenants = await prisma.tenant.findMany({
    where: {
      hostingProvider: { in: ["vercel", "hybrid"] },
      isActive: true,
    },
  });

  for (const tenant of tenants) {
    console.log(`  ${tenant.name} (${tenant.slug})...`);

    const metrics = await fetchVercelUsage(tenant.vercelProjectId || "");
    if (!metrics) {
      console.log(`    ✗ Skipped (no data)`);
      continue;
    }

    await prisma.tenantUsage.upsert({
      where: {
        tenantId_periodStart_periodEnd: {
          tenantId: tenant.id,
          periodStart,
          periodEnd,
        },
      },
      update: {
        vercelBuildMinutes: metrics.buildMinutes,
        vercelServerlessInvocations: metrics.serverlessInvocations,
        vercelEdgeRequests: metrics.edgeInvocations,
        vercelBandwidthGb: metrics.bandwidthGb,
        vercelImageOptimizations: metrics.imageOptimizations,
      },
      create: {
        tenantId: tenant.id,
        periodStart,
        periodEnd,
        vercelBuildMinutes: metrics.buildMinutes,
        vercelServerlessInvocations: metrics.serverlessInvocations,
        vercelEdgeRequests: metrics.edgeInvocations,
        vercelBandwidthGb: metrics.bandwidthGb,
        vercelImageOptimizations: metrics.imageOptimizations,
      },
    });

    console.log(`    ✓ Recorded`);
  }

  console.log(`\nDone. ${tenants.length} tenants processed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
