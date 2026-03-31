import { db } from "./db";
import type { ShippingMethod } from "@prisma/client";

// ─── WEIGHT-BASED SHIPPING TIERS ────────────────────────────

interface ShippingOption {
  method: ShippingMethod;
  name: string;
  cost: number;
  estimatedDays: number;
  carrier: string;
}

interface CartForShipping {
  totalWeightKg: number;
  hasPerishable: boolean;
  hasFragile: boolean;
  items: Array<{ weightKg: number; isPerishable: boolean; quantity: number }>;
}

// Default shipping tiers (used when DB rules are not configured)
const DEFAULT_TIERS: ShippingOption[] = [
  { method: "STANDARD", name: "Standard Shipping", cost: 1500, estimatedDays: 5, carrier: "GIG Logistics" },
  { method: "EXPRESS", name: "Express Shipping", cost: 3500, estimatedDays: 2, carrier: "GIG Logistics" },
  { method: "LOCAL_VAN", name: "Local Van Delivery", cost: 2000, estimatedDays: 1, carrier: "NaijaPantry Van" },
  { method: "DHL", name: "DHL Premium", cost: 8000, estimatedDays: 3, carrier: "DHL" },
  { method: "LOCAL_FRESH", name: "Local Fresh Delivery", cost: 1000, estimatedDays: 0, carrier: "NaijaPantry Fresh" },
];

// Weight surcharges (per kg over threshold)
const HEAVY_ITEM_THRESHOLD_KG = 5;
const HEAVY_SURCHARGE_PER_KG = 200; // NGN per extra kg

export async function calculateShippingOptions(
  cart: CartForShipping,
  userPostcode?: string,
  userLat?: number,
  userLng?: number
): Promise<ShippingOption[]> {
  const options: ShippingOption[] = [];

  // Try DB-based rules first
  const dbRules = await db.shippingRule.findMany({ where: { isActive: true } });

  if (dbRules.length > 0) {
    for (const rule of dbRules) {
      const minW = Number(rule.minWeightKg);
      const maxW = Number(rule.maxWeightKg);
      if (cart.totalWeightKg >= minW && cart.totalWeightKg <= maxW) {
        const baseCost = Number(rule.baseCost);
        const perKgCost = Number(rule.perKgCost);
        const extraWeight = Math.max(0, cart.totalWeightKg - HEAVY_ITEM_THRESHOLD_KG);

        options.push({
          method: rule.method,
          name: rule.name,
          cost: baseCost + extraWeight * perKgCost,
          estimatedDays: rule.estimatedDays,
          carrier: rule.name,
        });
      }
    }
  }

  // Fallback to default tiers if no DB rules match
  if (options.length === 0) {
    for (const tier of DEFAULT_TIERS) {
      let cost = tier.cost;

      // Weight surcharge for heavy carts
      if (cart.totalWeightKg > HEAVY_ITEM_THRESHOLD_KG) {
        const extraKg = cart.totalWeightKg - HEAVY_ITEM_THRESHOLD_KG;
        cost += extraKg * HEAVY_SURCHARGE_PER_KG;
      }

      // Fragile surcharge
      if (cart.hasFragile) {
        cost += 500;
      }

      options.push({ ...tier, cost });
    }
  }

  // Filter options based on locality
  const isLocal = userLat && userLng
    ? isWithinLocalRadius(userLat, userLng)
    : false;

  return options.filter((opt) => {
    // LOCAL_FRESH only available within delivery radius
    if (opt.method === "LOCAL_FRESH" && !isLocal) return false;
    // LOCAL_VAN only for local delivery
    if (opt.method === "LOCAL_VAN" && !isLocal) return false;
    // If cart has perishables and user is NOT local, exclude local-only methods
    // but also warn — handled at checkout level
    return true;
  });
}

// ─── LOCAL DELIVERY RADIUS ──────────────────────────────────

const HUB_LAT = parseFloat(process.env.LOCAL_HUB_LAT || "6.5244");
const HUB_LNG = parseFloat(process.env.LOCAL_HUB_LNG || "3.3792");
const LOCAL_RADIUS_KM = parseFloat(process.env.LOCAL_DELIVERY_RADIUS_KM || "15");

export function isWithinLocalRadius(lat: number, lng: number): boolean {
  const distance = haversineDistance(HUB_LAT, HUB_LNG, lat, lng);
  return distance <= LOCAL_RADIUS_KM;
}

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── WAREHOUSE ROUTING ──────────────────────────────────────

export async function findClosestWarehouse(
  lat: number,
  lng: number,
  productIds: string[]
) {
  const warehouses = await db.warehouse.findMany({
    where: { isActive: true },
    include: {
      inventoryBatches: {
        where: {
          productId: { in: productIds },
          quantity: { gt: 0 },
        },
      },
    },
  });

  // Score warehouses: distance + stock availability
  const scored = warehouses
    .map((wh) => {
      const distance = haversineDistance(lat, lng, wh.latitude, wh.longitude);
      const stockedProducts = new Set(wh.inventoryBatches.map((b) => b.productId));
      const coverage = productIds.filter((id) => stockedProducts.has(id)).length / productIds.length;

      return {
        warehouse: wh,
        distance,
        coverage,
        // Prefer full coverage, then closest
        score: coverage * 1000 - distance,
      };
    })
    .filter((s) => s.coverage > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.warehouse ?? null;
}

// ─── PERISHABLE VALIDATION ──────────────────────────────────

export function validateCartForDelivery(
  items: Array<{ isPerishable: boolean; name: string }>,
  isLocal: boolean
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!isLocal) {
    const perishables = items.filter((i) => i.isPerishable);
    if (perishables.length > 0) {
      warnings.push(
        `The following perishable items cannot be shipped to your area and will be removed: ${perishables.map((p) => p.name).join(", ")}`
      );
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
