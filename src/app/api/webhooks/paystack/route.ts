import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPaystackClient } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // Parse event first to resolve tenant from the payment reference
  const event = JSON.parse(body);
  const reference = event.data?.reference as string | undefined;

  if (!reference) {
    return NextResponse.json({ error: "No reference" }, { status: 400 });
  }

  // Find order to determine the tenant for signature verification
  const order = await db.order.findFirst({
    where: { orderNumber: reference },
    include: { tenant: { select: { paystackSecretKey: true } } },
  });

  // Use tenant-specific key or fallback to env
  const paystackKey = order?.tenant?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY!;
  const paystack = createPaystackClient(paystackKey);

  if (!signature || !paystack.verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  switch (event.event) {
    case "charge.success": {
      // Update order payment status
      await db.order.updateMany({
        where: { orderNumber: reference },
        data: {
          paymentStatus: "PAID",
          paymentRef: reference,
          status: "CONFIRMED",
        },
      });
      break;
    }

    case "charge.failed": {
      await db.order.updateMany({
        where: { orderNumber: reference },
        data: {
          paymentStatus: "FAILED",
        },
      });
      break;
    }

    case "subscription.create":
    case "invoice.payment_failed": {
      // Handle subscription lifecycle events
      // Log and process as needed
      console.log(`Paystack event: ${event.event}`, event.data);
      break;
    }

    default:
      console.log(`Unhandled Paystack event: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}
