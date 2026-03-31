import { headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import type { Tenant } from "@prisma/client";

export const getTenant = cache(async (): Promise<Tenant> => {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");
  if (!slug) throw new Error("No tenant context");

  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.isActive) throw new Error("Tenant not found or inactive");

  return tenant;
});

export const getTenantId = cache(async (): Promise<string> => {
  const tenant = await getTenant();
  return tenant.id;
});
