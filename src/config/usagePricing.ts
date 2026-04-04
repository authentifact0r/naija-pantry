/**
 * Split billing pricing: Base Retainer + Hosting (Vercel) + Backend (GCP)
 */

export type PlanId = "basic" | "standard" | "premium";

export const usagePricing = {
  base_retainer: {
    basic: 49,
    standard: 99,
    premium: 199,
  } as Record<PlanId, number>,

  hosting: {
    build_minutes:          { label: "Build Minutes",           unit: "minute",           price_gbp: 0.03,  metricKey: "vercelBuildMinutes" },
    serverless_invocations: { label: "Serverless Invocations",  unit: "10k invocations",  price_gbp: 0.20,  metricKey: "vercelServerlessInvocations" },
    edge_invocations:       { label: "Edge Invocations",        unit: "10k invocations",  price_gbp: 0.25,  metricKey: "vercelEdgeRequests" },
    bandwidth_gb:           { label: "Bandwidth",               unit: "GB",               price_gbp: 0.10,  metricKey: "vercelBandwidthGb" },
    image_optimization:     { label: "Image Optimization",      unit: "1k optimizations", price_gbp: 0.12,  metricKey: "vercelImageOptimizations" },
  },

  backend: {
    cloud_run_requests:         { label: "Cloud Run Requests",    unit: "1k requests",    price_gbp: 0.10,  metricKey: "gcpCloudRunRequests" },
    cloud_run_cpu_seconds:      { label: "Cloud Run CPU",         unit: "1k CPU seconds", price_gbp: 0.15,  metricKey: "gcpCloudRunCpuSeconds" },
    cloud_run_memory_gb_hours:  { label: "Cloud Run Memory",      unit: "GB-hour",        price_gbp: 0.05,  metricKey: "gcpCloudRunMemoryGbHrs" },
    firestore_reads:            { label: "Firestore Reads",       unit: "100k reads",     price_gbp: 0.06,  metricKey: "gcpFirestoreReads" },
    firestore_writes:           { label: "Firestore Writes",      unit: "100k writes",    price_gbp: 0.12,  metricKey: "gcpFirestoreWrites" },
    firestore_storage_gb:       { label: "Firestore Storage",     unit: "GB-month",       price_gbp: 0.02,  metricKey: "gcpFirestoreStorageGb" },
    storage_gb:                 { label: "Cloud Storage",         unit: "GB-month",       price_gbp: 0.02,  metricKey: "gcpStorageGb" },
    storage_egress_gb:          { label: "Storage Egress",        unit: "GB",             price_gbp: 0.08,  metricKey: "gcpStorageEgressGb" },
  },
} as const;

export interface BreakdownItem {
  label: string;
  metricKey: string;
  quantity: number;
  unit: string;
  unitPriceGbp: number;
  totalGbp: number;
}
