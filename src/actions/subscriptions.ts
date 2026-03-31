"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { SubscriptionInterval } from "@prisma/client";

export async function createSubscription(
  productId: string,
  interval: SubscriptionInterval,
  quantity: number = 1
) {
  const user = await requireAuth();

  // Calculate next delivery date based on interval
  const now = new Date();
  const nextDelivery = new Date(now);
  switch (interval) {
    case "WEEKLY":
      nextDelivery.setDate(now.getDate() + 7);
      break;
    case "BIWEEKLY":
      nextDelivery.setDate(now.getDate() + 14);
      break;
    case "MONTHLY":
      nextDelivery.setMonth(now.getMonth() + 1);
      break;
  }

  const subscription = await db.subscription.create({
    data: {
      userId: user.id,
      productId,
      quantity,
      interval,
      nextDelivery,
      discountPercent: 5.0,
    },
  });

  revalidatePath("/account/subscriptions");
  return { success: true, subscriptionId: subscription.id };
}

export async function pauseSubscription(subscriptionId: string): Promise<void> {
  const user = await requireAuth();

  await db.subscription.update({
    where: { id: subscriptionId, userId: user.id },
    data: { status: "PAUSED" },
  });

  revalidatePath("/account/subscriptions");
}

export async function resumeSubscription(subscriptionId: string): Promise<void> {
  const user = await requireAuth();

  const now = new Date();
  const nextDelivery = new Date(now);
  nextDelivery.setDate(now.getDate() + 7);

  await db.subscription.update({
    where: { id: subscriptionId, userId: user.id },
    data: { status: "ACTIVE", nextDelivery },
  });

  revalidatePath("/account/subscriptions");
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const user = await requireAuth();

  await db.subscription.update({
    where: { id: subscriptionId, userId: user.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/account/subscriptions");
}

// Called by cron/scheduled job to process due subscriptions
export async function processDueSubscriptions() {
  const dueSubscriptions = await db.subscription.findMany({
    where: {
      status: "ACTIVE",
      nextDelivery: { lte: new Date() },
    },
    include: {
      user: { include: { addresses: { where: { isDefault: true } } } },
      product: true,
    },
  });

  const results = [];

  for (const sub of dueSubscriptions) {
    const address = sub.user.addresses[0];
    if (!address) continue;

    const unitPrice = Number(sub.product.price);
    const discountMultiplier = 1 - Number(sub.discountPercent) / 100;
    const discountedPrice = unitPrice * discountMultiplier;
    const total = discountedPrice * sub.quantity;

    // Create auto-ship order
    const order = await db.order.create({
      data: {
        orderNumber: `SUB-${Date.now().toString(36).toUpperCase()}`,
        userId: sub.userId,
        addressId: address.id,
        subtotal: total,
        shippingCost: 0, // free shipping for subscriptions
        total,
        totalWeightKg: Number(sub.product.weightKg) * sub.quantity,
        shippingMethod: "STANDARD",
        paymentProvider: "PAYSTACK",
        notes: `Auto-ship subscription #${sub.id}`,
        items: {
          create: {
            productId: sub.productId,
            quantity: sub.quantity,
            unitPrice: discountedPrice,
            totalPrice: total,
            weightKg: Number(sub.product.weightKg) * sub.quantity,
          },
        },
      },
    });

    // Update next delivery date
    const nextDelivery = new Date();
    switch (sub.interval) {
      case "WEEKLY":
        nextDelivery.setDate(nextDelivery.getDate() + 7);
        break;
      case "BIWEEKLY":
        nextDelivery.setDate(nextDelivery.getDate() + 14);
        break;
      case "MONTHLY":
        nextDelivery.setMonth(nextDelivery.getMonth() + 1);
        break;
    }

    await db.subscription.update({
      where: { id: sub.id },
      data: { nextDelivery },
    });

    results.push({ subscriptionId: sub.id, orderId: order.id });
  }

  return { processed: results.length, results };
}
