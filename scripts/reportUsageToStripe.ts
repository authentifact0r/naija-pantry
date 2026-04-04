/**
 * Report usage to Stripe for metered billing.
 * Run after collectGcpUsage + collectVercelUsage.
 *
 * npx tsx scripts/reportUsageToStripe.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Inline stripe to avoid module resolution issues in scripts
async function getStripe() {
  const Stripe = (await import("stripe")).default;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { typescript: true });
}

async function main() {
  console.log("Reporting usage to Stripe...\n");
  const stripe = await getStripe();

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const tenants = await prisma.tenant.findMany({
    where: { isActive: true, stripeSubscriptionId: { not: null } },
  });

  for (const tenant of tenants) {
    console.log(`  ${tenant.name}...`);

    const usage = await prisma.tenantUsage.findUnique({
      where: {
        tenantId_periodStart_periodEnd: {
          tenantId: tenant.id,
          periodStart,
          periodEnd,
        },
      },
    });

    if (!usage || usage.stripeReported) {
      console.log(`    ✗ Skipped (no usage or already reported)`);
      continue;
    }

    // Report hosting usage (in pence for precision)
    if (tenant.stripeHostingItemId && usage.vercelCostGbp > 0) {
      const pence = Math.round(usage.vercelCostGbp * 100);
      await stripe.subscriptionItems.createUsageRecord(
        tenant.stripeHostingItemId,
        { quantity: pence, timestamp: Math.floor(Date.now() / 1000), action: "set" },
      );
      console.log(`    ✓ Hosting: ${pence}p (£${usage.vercelCostGbp})`);
    }

    // Report backend usage
    if (tenant.stripeBackendItemId && usage.gcpCostGbp > 0) {
      const pence = Math.round(usage.gcpCostGbp * 100);
      await stripe.subscriptionItems.createUsageRecord(
        tenant.stripeBackendItemId,
        { quantity: pence, timestamp: Math.floor(Date.now() / 1000), action: "set" },
      );
      console.log(`    ✓ Backend: ${pence}p (£${usage.gcpCostGbp})`);
    }

    await prisma.tenantUsage.update({
      where: { id: usage.id },
      data: { stripeReported: true },
    });
  }

  console.log(`\nDone. ${tenants.length} tenants processed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
