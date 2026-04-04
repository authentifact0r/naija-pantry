import { usagePricing, type PlanId, type BreakdownItem } from "@/config/usagePricing";

type UsageRecord = Record<string, number>;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function normalise(raw: number, unit: string): number {
  // Convert raw metric to billable units based on unit string
  if (unit.startsWith("10k")) return raw / 10_000;
  if (unit.startsWith("100k")) return raw / 100_000;
  if (unit.startsWith("1k")) return raw / 1_000;
  return raw; // GB, minute, GB-hour etc — already in base unit
}

export function computeHostingBreakdown(usage: UsageRecord): BreakdownItem[] {
  const breakdown: BreakdownItem[] = [];
  for (const [, config] of Object.entries(usagePricing.hosting)) {
    const rawQty = (usage[config.metricKey] as number) || 0;
    const billableQty = normalise(rawQty, config.unit);
    breakdown.push({
      label: config.label,
      metricKey: config.metricKey,
      quantity: rawQty,
      unit: config.unit,
      unitPriceGbp: config.price_gbp,
      totalGbp: round2(billableQty * config.price_gbp),
    });
  }
  return breakdown;
}

export function computeBackendBreakdown(usage: UsageRecord): BreakdownItem[] {
  const breakdown: BreakdownItem[] = [];
  for (const [, config] of Object.entries(usagePricing.backend)) {
    const rawQty = (usage[config.metricKey] as number) || 0;
    const billableQty = normalise(rawQty, config.unit);
    breakdown.push({
      label: config.label,
      metricKey: config.metricKey,
      quantity: rawQty,
      unit: config.unit,
      unitPriceGbp: config.price_gbp,
      totalGbp: round2(billableQty * config.price_gbp),
    });
  }
  return breakdown;
}

export function computeHostingUsageCost(breakdown: BreakdownItem[]): number {
  return round2(breakdown.reduce((sum, item) => sum + item.totalGbp, 0));
}

export function computeBackendUsageCost(breakdown: BreakdownItem[]): number {
  return round2(breakdown.reduce((sum, item) => sum + item.totalGbp, 0));
}

export function computeBaseRetainer(plan: PlanId): number {
  return usagePricing.base_retainer[plan] || 99;
}

export function computeTotalMonthlyCost(
  baseRetainer: number,
  hostingCost: number,
  backendCost: number,
): number {
  return round2(baseRetainer + hostingCost + backendCost);
}

export interface BillingMetrics {
  baseRetainerGbp: number;
  hostingUsageGbp: number;
  backendUsageGbp: number;
  totalMonthlyCostGbp: number;
  hostingBreakdown: BreakdownItem[];
  backendBreakdown: BreakdownItem[];
}

/**
 * Compute full billing metrics for a tenant's usage period.
 */
export function computeBillingMetrics(
  plan: PlanId,
  usage: UsageRecord,
  hostingProvider: string,
): BillingMetrics {
  const baseRetainerGbp = computeBaseRetainer(plan);

  const hostingBreakdown = (hostingProvider === "vercel" || hostingProvider === "hybrid")
    ? computeHostingBreakdown(usage)
    : [];
  const backendBreakdown = (hostingProvider === "gcp" || hostingProvider === "hybrid")
    ? computeBackendBreakdown(usage)
    : [];

  const hostingUsageGbp = computeHostingUsageCost(hostingBreakdown);
  const backendUsageGbp = computeBackendUsageCost(backendBreakdown);
  const totalMonthlyCostGbp = computeTotalMonthlyCost(baseRetainerGbp, hostingUsageGbp, backendUsageGbp);

  return {
    baseRetainerGbp,
    hostingUsageGbp,
    backendUsageGbp,
    totalMonthlyCostGbp,
    hostingBreakdown,
    backendBreakdown,
  };
}
