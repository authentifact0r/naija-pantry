import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

/**
 * Attach metered usage items to an existing subscription.
 * Call once when setting up a tenant's subscription.
 */
export async function attachUsageItemsToSubscription(
  tenantId: string,
  hostingPriceId: string,
  backendPriceId: string,
) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.stripeSubscriptionId) {
    throw new Error("Tenant has no active subscription");
  }

  const updates: { stripeHostingItemId?: string; stripeBackendItemId?: string } = {};

  // Add hosting metered item if not already attached
  if (!tenant.stripeHostingItemId && hostingPriceId) {
    const item = await stripe.subscriptionItems.create({
      subscription: tenant.stripeSubscriptionId,
      price: hostingPriceId,
      metadata: { type: "hosting", tenantId },
    });
    updates.stripeHostingItemId = item.id;
  }

  // Add backend metered item if not already attached
  if (!tenant.stripeBackendItemId && backendPriceId) {
    const item = await stripe.subscriptionItems.create({
      subscription: tenant.stripeSubscriptionId,
      price: backendPriceId,
      metadata: { type: "backend", tenantId },
    });
    updates.stripeBackendItemId = item.id;
  }

  if (Object.keys(updates).length > 0) {
    await db.tenant.update({ where: { id: tenantId }, data: updates });
  }

  return updates;
}

/**
 * Report hosting (Vercel) usage to Stripe for metered billing.
 * quantity = total billable units (e.g. £ amount in pence, or abstract units).
 */
export async function reportHostingUsageToStripe(
  tenantId: string,
  quantityPence: number,
) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.stripeHostingItemId) {
    console.warn(`Tenant ${tenantId} has no hosting subscription item`);
    return null;
  }

  const record = await stripe.subscriptionItems.createUsageRecord(
    tenant.stripeHostingItemId,
    {
      quantity: Math.round(quantityPence),
      timestamp: Math.floor(Date.now() / 1000),
      action: "set",
    },
  );

  return record;
}

/**
 * Report backend (GCP) usage to Stripe for metered billing.
 */
export async function reportBackendUsageToStripe(
  tenantId: string,
  quantityPence: number,
) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.stripeBackendItemId) {
    console.warn(`Tenant ${tenantId} has no backend subscription item`);
    return null;
  }

  const record = await stripe.subscriptionItems.createUsageRecord(
    tenant.stripeBackendItemId,
    {
      quantity: Math.round(quantityPence),
      timestamp: Math.floor(Date.now() / 1000),
      action: "set",
    },
  );

  return record;
}
