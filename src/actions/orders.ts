"use server";

import { db, getScopedDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { calculateShippingOptions, findClosestWarehouse } from "@/lib/shipping";
import { createPaystackClient } from "@/lib/paystack";
import { getTenant } from "@/lib/tenant";
import type { ShippingMethod, PaymentProvider } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

interface PlaceOrderInput {
  addressId: string;
  shippingMethod: ShippingMethod;
  paymentProvider: PaymentProvider;
  notes?: string;
}

export async function placeOrder(input: PlaceOrderInput) {
  const user = await requireAuth();
  const tdb = await getScopedDb();
  const tenant = await getTenant();

  // Get cart items
  const cartItems = await tdb.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          inventoryBatches: { select: { quantity: true, warehouseId: true } },
        },
      },
    },
  });

  if (cartItems.length === 0) {
    return { error: "Cart is empty" };
  }

  // Validate address (addresses are user-global)
  const address = await db.address.findFirst({
    where: { id: input.addressId, userId: user.id },
  });
  if (!address) {
    return { error: "Invalid address" };
  }

  // Calculate totals
  let subtotal = 0;
  let totalWeightKg = 0;
  const orderItems: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    weightKg: number;
  }> = [];

  for (const item of cartItems) {
    const unitPrice = Number(item.product.price);
    const weight = Number(item.product.weightKg);
    const totalStock = item.product.inventoryBatches.reduce((s, b) => s + b.quantity, 0);

    if (totalStock < item.quantity) {
      return { error: `Insufficient stock for ${item.product.name}` };
    }

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    totalWeightKg += weight * item.quantity;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice: itemTotal,
      weightKg: weight * item.quantity,
    });
  }

  // Calculate shipping
  const shippingOptions = await calculateShippingOptions(
    {
      totalWeightKg,
      hasPerishable: cartItems.some((i) => i.product.isPerishable),
      hasFragile: cartItems.some((i) => i.product.isFragile),
      items: cartItems.map((i) => ({
        weightKg: Number(i.product.weightKg),
        isPerishable: i.product.isPerishable,
        quantity: i.quantity,
      })),
    },
    address.postcode,
    address.latitude ?? undefined,
    address.longitude ?? undefined
  );

  const selectedShipping = shippingOptions.find(
    (o) => o.method === input.shippingMethod
  );
  const shippingCost = selectedShipping?.cost ?? 0;

  const total = subtotal + shippingCost;

  // Find closest warehouse
  const productIds = cartItems.map((i) => i.productId);
  const warehouse = address.latitude && address.longitude
    ? await findClosestWarehouse(address.latitude, address.longitude, productIds)
    : null;

  // Create order
  const orderNumber = generateOrderNumber();

  const order = await tdb.order.create({
    data: {
      orderNumber,
      userId: user.id,
      addressId: input.addressId,
      warehouseId: warehouse?.id,
      subtotal,
      shippingCost,
      total,
      totalWeightKg,
      shippingMethod: input.shippingMethod,
      paymentProvider: input.paymentProvider,
      items: {
        create: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          weightKg: item.weightKg,
        })),
      },
    },
  });

  // Deduct inventory (FEFO — First Expiry First Out)
  for (const item of orderItems) {
    let remaining = item.quantity;
    const batches = await tdb.inventoryBatch.findMany({
      where: {
        productId: item.productId,
        quantity: { gt: 0 },
        ...(warehouse ? { warehouseId: warehouse.id } : {}),
      },
      orderBy: { expiryDate: "asc" },
    });

    for (const batch of batches) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, batch.quantity);
      await tdb.inventoryBatch.update({
        where: { id: batch.id },
        data: { quantity: { decrement: deduct } },
      });
      remaining -= deduct;
    }
  }

  // Clear cart
  await tdb.cartItem.deleteMany({ where: { userId: user.id } });

  // Initialize payment using tenant's Paystack key
  if (input.paymentProvider === "PAYSTACK") {
    const paystackKey = tenant.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY!;
    const paystack = createPaystackClient(paystackKey);

    const paymentResult = await paystack.initializePayment({
      email: user.email,
      amount: total,
      reference: orderNumber,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/verify?ref=${orderNumber}`,
      metadata: { orderId: order.id, tenantId: tenant.id },
    });

    if (paymentResult.status) {
      return { paymentUrl: paymentResult.data.authorization_url };
    }
  }

  // Fallback: redirect to order confirmation
  revalidatePath("/account/orders");
  return { orderId: order.id, orderNumber };
}

export async function reorderAction(orderId: string): Promise<void> {
  const user = await requireAuth();
  const tdb = await getScopedDb();

  const order = await tdb.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    redirect("/account/orders?error=Order+not+found");
  }

  // Add items back to cart
  for (const item of order.items) {
    await tdb.cartItem.upsert({
      where: {
        userId_productId_tenantId: { userId: user.id, productId: item.productId, tenantId: user.tenantId },
      },
      update: { quantity: item.quantity },
      create: {
        tenantId: "", // injected by scoped client
        userId: user.id,
        productId: item.productId,
        quantity: item.quantity,
      },
    });
  }

  revalidatePath("/cart");
  redirect("/cart");
}

export async function updateOrderStatus(
  orderId: string,
  status: "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
  const tdb = await getScopedDb();

  // Admin action — auth checked at route level
  const data: Record<string, unknown> = { status };
  if (status === "SHIPPED") data.shippedAt = new Date();
  if (status === "DELIVERED") data.deliveredAt = new Date();

  await tdb.order.update({ where: { id: orderId }, data });
  revalidatePath("/admin/orders");
}
