import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderNumber = session.metadata?.orderNumber;

      if (orderNumber) {
        await db.order.updateMany({
          where: { orderNumber },
          data: {
            paymentStatus: "PAID",
            paymentRef: session.payment_intent as string,
            status: "CONFIRMED",
          },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = intent.metadata?.orderNumber;

      if (orderNumber) {
        await db.order.updateMany({
          where: { orderNumber },
          data: { paymentStatus: "FAILED" },
        });
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
