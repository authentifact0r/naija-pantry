/**
 * Usage-based pricing rates.
 * All prices in GBP. Updated quarterly based on actual provider costs + margin.
 */

export const USAGE_RATES = {
  gcp: {
    cloudRunPerRequest: 0.0000004,       // £0.40 per 1M requests
    cloudRunPerCpuSecond: 0.0000240,     // £0.024 per 1K vCPU-seconds
    cloudRunPerMemoryGbHour: 0.0000025,  // £0.0025 per GB-hour
    firestorePerRead: 0.0000003,         // £0.30 per 1M reads
    firestorePerWrite: 0.0000009,        // £0.90 per 1M writes
    firestorePerStorageGb: 0.15,         // £0.15 per GB/month
    storagePerGb: 0.02,                  // £0.02 per GB/month
    storageEgressPerGb: 0.08,            // £0.08 per GB egress
  },
  vercel: {
    perBuildMinute: 0.01,                // £0.01 per build minute
    perServerlessInvocation: 0.0000006,  // £0.60 per 1M invocations
    perBandwidthGb: 0.13,               // £0.13 per GB
    perImageOptimization: 0.000004,      // £4.00 per 1M optimizations
    perEdgeRequest: 0.0000002,           // £0.20 per 1M edge requests
  },
  // Free tier allowances per plan (included in base price)
  freeTier: {
    basic: {
      gcpCloudRunRequests: 500_000,
      gcpFirestoreReads: 1_000_000,
      gcpFirestoreWrites: 200_000,
      gcpStorageGb: 1,
      vercelBuildMinutes: 100,
      vercelServerlessInvocations: 500_000,
      vercelBandwidthGb: 50,
    },
    standard: {
      gcpCloudRunRequests: 2_000_000,
      gcpFirestoreReads: 5_000_000,
      gcpFirestoreWrites: 1_000_000,
      gcpStorageGb: 5,
      vercelBuildMinutes: 300,
      vercelServerlessInvocations: 2_000_000,
      vercelBandwidthGb: 200,
    },
    premium: {
      gcpCloudRunRequests: 10_000_000,
      gcpFirestoreReads: 20_000_000,
      gcpFirestoreWrites: 5_000_000,
      gcpStorageGb: 20,
      vercelBuildMinutes: 1000,
      vercelServerlessInvocations: 10_000_000,
      vercelBandwidthGb: 1000,
    },
  },
} as const;

export type PlanId = "basic" | "standard" | "premium";

interface UsageInput {
  gcpCloudRunRequests?: number;
  gcpCloudRunCpuSeconds?: number;
  gcpCloudRunMemoryGbHrs?: number;
  gcpFirestoreReads?: number;
  gcpFirestoreWrites?: number;
  gcpFirestoreStorageGb?: number;
  gcpStorageGb?: number;
  gcpStorageEgressGb?: number;
  vercelBuildMinutes?: number;
  vercelServerlessInvocations?: number;
  vercelBandwidthGb?: number;
  vercelImageOptimizations?: number;
  vercelEdgeRequests?: number;
}

interface UsageCost {
  gcpCost: number;
  vercelCost: number;
  totalCost: number;
  breakdown: {
    item: string;
    usage: number;
    freeTier: number;
    billable: number;
    rate: number;
    cost: number;
  }[];
}

/**
 * Calculate overage costs for a given usage period.
 * Only usage exceeding the plan's free tier is billed.
 */
export function calculateUsageCost(usage: UsageInput, plan: PlanId): UsageCost {
  const free = USAGE_RATES.freeTier[plan];
  const r = USAGE_RATES;
  const breakdown: UsageCost["breakdown"] = [];

  const billable = (actual: number, included: number) => Math.max(0, actual - included);

  // GCP
  const items: { item: string; usage: number; freeTier: number; rate: number; provider: "gcp" | "vercel" }[] = [
    { item: "Cloud Run Requests", usage: usage.gcpCloudRunRequests || 0, freeTier: free.gcpCloudRunRequests, rate: r.gcp.cloudRunPerRequest, provider: "gcp" },
    { item: "Cloud Run CPU (seconds)", usage: usage.gcpCloudRunCpuSeconds || 0, freeTier: 0, rate: r.gcp.cloudRunPerCpuSecond, provider: "gcp" },
    { item: "Cloud Run Memory (GB-hrs)", usage: usage.gcpCloudRunMemoryGbHrs || 0, freeTier: 0, rate: r.gcp.cloudRunPerMemoryGbHour, provider: "gcp" },
    { item: "Firestore Reads", usage: usage.gcpFirestoreReads || 0, freeTier: free.gcpFirestoreReads, rate: r.gcp.firestorePerRead, provider: "gcp" },
    { item: "Firestore Writes", usage: usage.gcpFirestoreWrites || 0, freeTier: free.gcpFirestoreWrites, rate: r.gcp.firestorePerWrite, provider: "gcp" },
    { item: "Firestore Storage (GB)", usage: usage.gcpFirestoreStorageGb || 0, freeTier: 0, rate: r.gcp.firestorePerStorageGb, provider: "gcp" },
    { item: "Cloud Storage (GB)", usage: usage.gcpStorageGb || 0, freeTier: free.gcpStorageGb, rate: r.gcp.storagePerGb, provider: "gcp" },
    { item: "Storage Egress (GB)", usage: usage.gcpStorageEgressGb || 0, freeTier: 0, rate: r.gcp.storageEgressPerGb, provider: "gcp" },
    // Vercel
    { item: "Build Minutes", usage: usage.vercelBuildMinutes || 0, freeTier: free.vercelBuildMinutes, rate: r.vercel.perBuildMinute, provider: "vercel" },
    { item: "Serverless Invocations", usage: usage.vercelServerlessInvocations || 0, freeTier: free.vercelServerlessInvocations, rate: r.vercel.perServerlessInvocation, provider: "vercel" },
    { item: "Bandwidth (GB)", usage: usage.vercelBandwidthGb || 0, freeTier: free.vercelBandwidthGb, rate: r.vercel.perBandwidthGb, provider: "vercel" },
    { item: "Image Optimizations", usage: usage.vercelImageOptimizations || 0, freeTier: 0, rate: r.vercel.perImageOptimization, provider: "vercel" },
    { item: "Edge Requests", usage: usage.vercelEdgeRequests || 0, freeTier: 0, rate: r.vercel.perEdgeRequest, provider: "vercel" },
  ];

  let gcpCost = 0;
  let vercelCost = 0;

  for (const i of items) {
    const bill = billable(i.usage, i.freeTier);
    const cost = Math.round(bill * i.rate * 100) / 100;
    breakdown.push({
      item: i.item,
      usage: i.usage,
      freeTier: i.freeTier,
      billable: bill,
      rate: i.rate,
      cost,
    });
    if (i.provider === "gcp") gcpCost += cost;
    else vercelCost += cost;
  }

  return {
    gcpCost: Math.round(gcpCost * 100) / 100,
    vercelCost: Math.round(vercelCost * 100) / 100,
    totalCost: Math.round((gcpCost + vercelCost) * 100) / 100,
    breakdown,
  };
}
