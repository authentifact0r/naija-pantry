export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      updatedAt: true,
      tenant: { select: { slug: true, customDomain: true } },
    },
  });

  const recipes = await db.recipe.findMany({
    select: {
      slug: true,
      updatedAt: true,
      tenant: { select: { slug: true, customDomain: true } },
    },
  });

  const entries: MetadataRoute.Sitemap = [
    {
      url: "/",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "/products",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "/recipes",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  for (const p of products) {
    entries.push({
      url: `/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const r of recipes) {
    entries.push({
      url: `/recipes/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
