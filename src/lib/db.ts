import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ─── TENANT-SCOPED PRISMA CLIENT ────────────────────────────

const TENANT_SCOPED_MODELS = [
  "product",
  "warehouse",
  "inventoryBatch",
  "cartItem",
  "order",
  "subscription",
  "recipe",
  "flashSale",
  "shippingRule",
  "seoSettings",
] as const;

type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

function isTenantScoped(model: string): model is TenantScopedModel {
  return (TENANT_SCOPED_MODELS as readonly string[]).includes(model);
}

export function tenantDb(tenantId: string) {
  return db.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId } as typeof args.where;
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async create({ model, args, query }) {
          if (isTenantScoped(model)) {
            (args.data as Record<string, unknown>).tenantId = tenantId;
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (isTenantScoped(model)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: Record<string, unknown>) => ({ ...d, tenantId }));
            } else {
              (args.data as Record<string, unknown>).tenantId = tenantId;
            }
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId } as typeof args.where;
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId } as typeof args.where;
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async upsert({ model, args, query }) {
          if (isTenantScoped(model)) {
            args.where = { ...args.where, tenantId } as typeof args.where;
            (args.create as Record<string, unknown>).tenantId = tenantId;
          }
          return query(args);
        },
      },
    },
  });
}

export async function getScopedDb() {
  const { getTenantId } = await import("./tenant");
  const id = await getTenantId();
  return tenantDb(id);
}
