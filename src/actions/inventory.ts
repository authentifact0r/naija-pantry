"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["GROCERIES", "SPICES", "DRINKS", "BEAUTY"]),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().optional(),
  weightKg: z.coerce.number().positive(),
  isPerishable: z.coerce.boolean().default(false),
  isFragile: z.coerce.boolean().default(false),
  isSubscribable: z.coerce.boolean().default(false),
  tags: z.string().optional(),
});

export async function createProduct(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    weightKg: formData.get("weightKg"),
    isPerishable: formData.get("isPerishable") === "on",
    isFragile: formData.get("isFragile") === "on",
    isSubscribable: formData.get("isSubscribable") === "on",
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    redirect("/admin/products/new?error=" + encodeURIComponent(parsed.error.issues[0].message));
  }

  const { tags, ...data } = parsed.data;
  const slug = slugify(data.name);

  await db.product.create({
    data: {
      ...data,
      slug,
      tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : [],
      images: [],
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    weightKg: formData.get("weightKg"),
    isPerishable: formData.get("isPerishable") === "on",
    isFragile: formData.get("isFragile") === "on",
    isSubscribable: formData.get("isSubscribable") === "on",
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { tags, ...data } = parsed.data;

  await db.product.update({
    where: { id: productId },
    data: {
      ...data,
      tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : [],
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

export async function batchUpdatePrices(
  productIds: string[],
  adjustmentPercent: number
) {
  await requireAdmin();

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  });

  const multiplier = 1 + adjustmentPercent / 100;

  for (const product of products) {
    const newPrice = Number(product.price) * multiplier;
    await db.product.update({
      where: { id: product.id },
      data: { price: Math.round(newPrice * 100) / 100 },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, updated: products.length };
}

export async function addInventoryBatch(formData: FormData): Promise<void> {
  await requireAdmin();

  const productId = formData.get("productId") as string;
  const warehouseId = formData.get("warehouseId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const batchNumber = (formData.get("batchNumber") as string) || undefined;
  const expiryDate = formData.get("expiryDate")
    ? new Date(formData.get("expiryDate") as string)
    : undefined;
  const costPrice = formData.get("costPrice")
    ? parseFloat(formData.get("costPrice") as string)
    : undefined;

  await db.inventoryBatch.create({
    data: {
      productId,
      warehouseId,
      quantity,
      batchNumber,
      expiryDate,
      costPrice,
    },
  });

  revalidatePath("/admin/inventory");
}

export async function createFlashSale(formData: FormData): Promise<void> {
  await requireAdmin();

  const productId = formData.get("productId") as string;
  const discountPercent = parseFloat(formData.get("discountPercent") as string);
  const reason = (formData.get("reason") as string) || undefined;
  const endsAt = new Date(formData.get("endsAt") as string);

  await db.flashSale.upsert({
    where: { productId },
    update: { discountPercent, reason, endsAt, isActive: true, startsAt: new Date() },
    create: {
      productId,
      discountPercent,
      reason,
      startsAt: new Date(),
      endsAt,
      isActive: true,
    },
  });

  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
}
