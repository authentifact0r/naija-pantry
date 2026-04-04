/**
 * Collect REAL Vercel usage for all tenants.
 * Run: npx tsx scripts/collectVercelUsage.ts
 *
 * Uses Vercel API v2/usage with team-level data + per-project breakdown.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Project name → Vercel project mapping
const PROJECT_MAP: Record<string, string> = {
  "taste-of-motherland": "naija-pantry",
  "toks-mimi": "toks-mimi-foods",
  "vibrant-minds": "vibrant-minds",
  "styled-by-maryam": "authentifactor", // Shares the authentifactor project for now
};

async function getVercelToken(): Promise<string> {
  // Try env var first
  if (process.env.VERCEL_API_TOKEN) return process.env.VERCEL_API_TOKEN;

  // Fall back to CLI auth
  const authPath = path.join(
    process.env.HOME || "~",
    "Library/Application Support/com.vercel.cli/auth.json"
  );
  try {
    const auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));
    return auth.token;
  } catch {
    throw new Error("No Vercel token found. Set VERCEL_API_TOKEN or login via `vercel login`.");
  }
}

async function fetchVercelUsage(token: string, teamId: string, from: string, to: string) {
  const types = ["requests", "builds"] as const;
  const results: Record<string, any> = {};

  for (const type of types) {
    const url = `https://api.vercel.com/v2/usage?teamId=${teamId}&type=${type}&from=${from}&to=${to}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.warn(`  Vercel API ${type}: ${res.status}`);
      continue;
    }
    results[type] = await res.json();
  }

  return results;
}

function aggregateUsage(data: Record<string, any>) {
  const totals: Record<string, number> = {};

  for (const [type, response] of Object.entries(data)) {
    for (const day of response?.data || []) {
      for (const [key, value] of Object.entries(day)) {
        if (typeof value === "number") {
          totals[key] = (totals[key] || 0) + value;
        }
      }
    }
  }

  return totals;
}

function getProjectPercentages(data: Record<string, any>): Record<string, number> {
  // Extract per-project bandwidth percentages from breakdown
  const percentages: Record<string, number> = {};

  for (const response of Object.values(data)) {
    for (const day of response?.data || []) {
      const breakdown = day?.breakdown?.bandwidth || day?.breakdown?.build_count || [];
      for (const proj of breakdown) {
        const name = proj.name || "";
        percentages[name] = (percentages[name] || 0) + (proj.percent || 0);
      }
    }
  }

  // Normalize
  const total = Object.values(percentages).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const key of Object.keys(percentages)) {
      percentages[key] = percentages[key] / total;
    }
  }

  return percentages;
}

async function main() {
  console.log("Collecting REAL Vercel usage...\n");

  const token = await getVercelToken();
  const teamId = "team_4ajrvXbv0hyLkT4u1xvPBVTH";

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const from = periodStart.toISOString();
  const to = now.toISOString();

  console.log(`  Period: ${from} → ${to}`);

  const rawData = await fetchVercelUsage(token, teamId, from, to);
  const teamTotals = aggregateUsage(rawData);
  const projectPcts = getProjectPercentages(rawData);

  console.log("\n  Team totals:");
  console.log(`    Bandwidth: ${((teamTotals.bandwidth_outgoing_bytes || 0) / (1024**3)).toFixed(2)} GB`);
  console.log(`    Serverless invocations: ${teamTotals.function_invocation_successful_count || 0}`);
  console.log(`    Build seconds: ${teamTotals.build_build_seconds || 0}`);
  console.log(`    Requests: ${(teamTotals.request_hit_count || 0) + (teamTotals.request_miss_count || 0)}`);

  // Get all tenants on Vercel
  const tenants = await prisma.tenant.findMany({
    where: { hostingProvider: { in: ["vercel", "hybrid"] }, isActive: true },
  });

  console.log(`\n  Distributing to ${tenants.length} tenants:\n`);

  for (const tenant of tenants) {
    const vercelProjectName = PROJECT_MAP[tenant.slug] || tenant.slug;
    const pct = projectPcts[vercelProjectName] || (1 / tenants.length); // Fair split if no breakdown

    const usage = {
      vercelBuildMinutes: Math.round(((teamTotals.build_build_seconds || 0) * pct) / 60 * 100) / 100,
      vercelServerlessInvocations: Math.round((teamTotals.function_invocation_successful_count || 0) * pct),
      vercelEdgeRequests: Math.round(((teamTotals.request_hit_count || 0) + (teamTotals.request_miss_count || 0)) * pct),
      vercelBandwidthGb: Math.round(((teamTotals.bandwidth_outgoing_bytes || 0) * pct) / (1024**3) * 100) / 100,
      vercelImageOptimizations: 0, // Not available in this API
    };

    console.log(`  ${tenant.name} (${vercelProjectName}, ${(pct * 100).toFixed(1)}%):`);
    console.log(`    Builds: ${usage.vercelBuildMinutes} min | Serverless: ${usage.vercelServerlessInvocations} | Bandwidth: ${usage.vercelBandwidthGb} GB | Requests: ${usage.vercelEdgeRequests}`);

    await prisma.tenantUsage.upsert({
      where: {
        tenantId_periodStart_periodEnd: {
          tenantId: tenant.id,
          periodStart,
          periodEnd,
        },
      },
      update: {
        vercelBuildMinutes: usage.vercelBuildMinutes,
        vercelServerlessInvocations: usage.vercelServerlessInvocations,
        vercelEdgeRequests: usage.vercelEdgeRequests,
        vercelBandwidthGb: usage.vercelBandwidthGb,
        vercelImageOptimizations: usage.vercelImageOptimizations,
      },
      create: {
        tenantId: tenant.id,
        periodStart,
        periodEnd,
        vercelBuildMinutes: usage.vercelBuildMinutes,
        vercelServerlessInvocations: usage.vercelServerlessInvocations,
        vercelEdgeRequests: usage.vercelEdgeRequests,
        vercelBandwidthGb: usage.vercelBandwidthGb,
        vercelImageOptimizations: usage.vercelImageOptimizations,
      },
    });

    console.log(`    ✓ Saved`);
  }

  console.log("\nDone.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
