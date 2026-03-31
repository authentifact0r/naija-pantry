import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "charge.success": {
      const { reference } = event.data;

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
      const { reference } = event.data;

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
