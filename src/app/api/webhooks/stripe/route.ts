import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // Parse event metadata to resolve tenant
  // We need to verify the signature — for multi-tenant, each tenant may have its own
  // Stripe keys. We'll try to resolve from the event metadata.
  // First try with the default key, then resolve tenant-specific if needed.

  // Attempt to parse unverified to get order reference for tenant lookup
  let rawEvent: { type: string; data: { object: Record<string, unknown> } };
  try {
    rawEvent = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const metadata = (rawEvent.data?.object as Record<string, unknown>)?.metadata as Record<string, string> | undefined;
  const orderNumber = metadata?.orderNumber;

  // Resolve tenant's Stripe key
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (orderNumber) {
    const order = await db.order.findFirst({
      where: { orderNumber },
      include: { tenant: { select: { stripeSecretKey: true } } },
    });
    if (order?.tenant?.stripeSecretKey) {
      stripeSecretKey = order.tenant.stripeSecretKey;
    }
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ref = session.metadata?.orderNumber;

      if (ref) {
        await db.order.updateMany({
          where: { orderNumber: ref },
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
      const ref = intent.metadata?.orderNumber;

      if (ref) {
        await db.order.updateMany({
          where: { orderNumber: ref },
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
