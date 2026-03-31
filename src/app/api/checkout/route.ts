import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { calculateShippingOptions, findClosestWarehouse } from "@/lib/shipping";
import { initializePayment } from "@/lib/paystack";
import type { ShippingMethod, PaymentProvider } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to place an order" }, { status: 401 });
    }

    const body = await req.json();
    const { address, shippingMethod, paymentProvider, items } = body;

    if (!address || !shippingMethod || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create or find address
    const savedAddress = await db.address.create({
      data: {
        userId: user.id,
        firstName: address.firstName,
        lastName: address.lastName,
        line1: address.line1,
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        phone: address.phone,
      },
    });

    // Validate products and calculate totals
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: {
        inventoryBatches: { select: { id: true, quantity: true, warehouseId: true, expiryDate: true } },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let totalWeightKg = 0;
    const orderItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      weightKg: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const totalStock = product.inventoryBatches.reduce((s, b) => s + b.quantity, 0);
      if (totalStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Only ${totalStock} available.` },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.price);
      const weight = Number(product.weightKg);
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

    // Calculate shipping cost
    const shippingOptions = await calculateShippingOptions({
      totalWeightKg,
      hasPerishable: products.some((p) => p.isPerishable),
      hasFragile: products.some((p) => p.isFragile),
      items: items.map((i: { productId: string; quantity: number }) => {
        const p = productMap.get(i.productId)!;
        return { weightKg: Number(p.weightKg), isPerishable: p.isPerishable, quantity: i.quantity };
      }),
    });

    const selectedShipping = shippingOptions.find((o) => o.method === shippingMethod);
    const shippingCost = selectedShipping?.cost ?? 0;
    const total = subtotal + shippingCost;

    // Find closest warehouse
    const warehouse = savedAddress.latitude && savedAddress.longitude
      ? await findClosestWarehouse(savedAddress.latitude, savedAddress.longitude, productIds)
      : null;

    // Create order
    const orderNumber = generateOrderNumber();
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: savedAddress.id,
        warehouseId: warehouse?.id,
        subtotal,
        shippingCost,
        total,
        totalWeightKg,
        shippingMethod: shippingMethod as ShippingMethod,
        paymentProvider: (paymentProvider || "PAYSTACK") as PaymentProvider,
        items: {
          create: orderItems,
        },
      },
    });

    // Deduct inventory (FEFO — First Expiry First Out)
    for (const item of orderItems) {
      let remaining = item.quantity;
      const batches = await db.inventoryBatch.findMany({
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
        await db.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: { decrement: deduct } },
        });
        remaining -= deduct;
      }
    }

    // Also sync to DB cart (clear it)
    await db.cartItem.deleteMany({ where: { userId: user.id } });

    // Initialize payment
    if ((paymentProvider || "PAYSTACK") === "PAYSTACK") {
      try {
        const paymentResult = await initializePayment({
          email: user.email,
          amount: total,
          reference: orderNumber,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order=${orderNumber}`,
          metadata: { orderId: order.id },
        });

        if (paymentResult.status) {
          return NextResponse.json({
            orderId: order.id,
            orderNumber,
            paymentUrl: paymentResult.data.authorization_url,
          });
        }
      } catch {
        // Paystack init failed — order still created, return success without payment URL
      }
    }

    return NextResponse.json({ orderId: order.id, orderNumber });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
