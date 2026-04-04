/**
 * Collect Google Cloud usage for all tenants.
 * Run via: npx tsx scripts/collectGcpUsage.ts
 * Or schedule via Cloud Scheduler → Cloud Run.
 *
 * Requires:
 *   GCP_PROJECT_ID
 *   GOOGLE_APPLICATION_CREDENTIALS (service account with monitoring.viewer role)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// In production, use @google-cloud/monitoring client.
// This is the scaffold — replace with real API calls.
async function fetchGcpMetrics(tenantSlug: string) {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    console.warn("GCP_PROJECT_ID not set — using mock data");
    return {
      cloudRunRequests: Math.floor(Math.random() * 50000),
      cloudRunCpuSeconds: Math.floor(Math.random() * 5000),
      cloudRunMemoryGbHours: Math.round(Math.random() * 100 * 100) / 100,
      firestoreReads: Math.floor(Math.random() * 200000),
      firestoreWrites: Math.floor(Math.random() * 50000),
      firestoreStorageGb: Math.round(Math.random() * 2 * 100) / 100,
      storageGb: Math.round(Math.random() * 5 * 100) / 100,
      storageEgressGb: Math.round(Math.random() * 1 * 100) / 100,
    };
  }

  // TODO: Replace with real Google Cloud Monitoring API calls
  // const monitoring = new MetricServiceClient();
  // const [timeSeries] = await monitoring.listTimeSeries({ ... });
  // Parse and aggregate metrics per tenant label/service

  return {
    cloudRunRequests: 0,
    cloudRunCpuSeconds: 0,
    cloudRunMemoryGbHours: 0,
    firestoreReads: 0,
    firestoreWrites: 0,
    firestoreStorageGb: 0,
    storageGb: 0,
    storageEgressGb: 0,
  };
}

async function main() {
  console.log("Collecting GCP usage for tenants...\n");

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const tenants = await prisma.tenant.findMany({
    where: {
      hostingProvider: { in: ["gcp", "hybrid"] },
      isActive: true,
    },
  });

  for (const tenant of tenants) {
    console.log(`  ${tenant.name} (${tenant.slug})...`);
    const metrics = await fetchGcpMetrics(tenant.slug);

    await prisma.tenantUsage.upsert({
      where: {
        tenantId_periodStart_periodEnd: {
          tenantId: tenant.id,
          periodStart,
          periodEnd,
        },
      },
      update: {
        gcpCloudRunRequests: metrics.cloudRunRequests,
        gcpCloudRunCpuSeconds: metrics.cloudRunCpuSeconds,
        gcpCloudRunMemoryGbHrs: metrics.cloudRunMemoryGbHours,
        gcpFirestoreReads: metrics.firestoreReads,
        gcpFirestoreWrites: metrics.firestoreWrites,
        gcpFirestoreStorageGb: metrics.firestoreStorageGb,
        gcpStorageGb: metrics.storageGb,
        gcpStorageEgressGb: metrics.storageEgressGb,
      },
      create: {
        tenantId: tenant.id,
        periodStart,
        periodEnd,
        gcpCloudRunRequests: metrics.cloudRunRequests,
        gcpCloudRunCpuSeconds: metrics.cloudRunCpuSeconds,
        gcpCloudRunMemoryGbHrs: metrics.cloudRunMemoryGbHours,
        gcpFirestoreReads: metrics.firestoreReads,
        gcpFirestoreWrites: metrics.firestoreWrites,
        gcpFirestoreStorageGb: metrics.firestoreStorageGb,
        gcpStorageGb: metrics.storageGb,
        gcpStorageEgressGb: metrics.storageEgressGb,
      },
    });

    console.log(`    ✓ Recorded`);
  }

  console.log(`\nDone. ${tenants.length} tenants processed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
