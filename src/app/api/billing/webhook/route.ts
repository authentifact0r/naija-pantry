import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { db as prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (tenant) {
          // Parse invoice line items for split billing
          const lines = invoice.lines?.data || [];
          let baseRetainer = 0;
          let hostingUsage = 0;
          let backendUsage = 0;

          for (const line of lines) {
            const meta = line.price?.metadata || line.metadata || {};
            if (meta.type === "hosting") {
              hostingUsage += (line.amount || 0) / 100;
            } else if (meta.type === "backend") {
              backendUsage += (line.amount || 0) / 100;
            } else {
              baseRetainer += (line.amount || 0) / 100;
            }
          }

          const totalGbp = (invoice.amount_paid || 0) / 100;

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              billingStatus: "active",
              lastPaymentStatus: "succeeded",
              lastPaymentDate: new Date(),
              nextInvoiceDate: invoice.next_payment_attempt
                ? new Date(invoice.next_payment_attempt * 1000)
                : null,
              lastInvoiceTotalGbp: totalGbp,
              lastInvoiceBaseRetainerGbp: baseRetainer,
              lastInvoiceHostingUsageGbp: hostingUsage,
              lastInvoiceBackendUsageGbp: backendUsage,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              billingStatus: "delinquent",
              lastPaymentStatus: "failed",
              lastPaymentDate: new Date(),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (tenant) {
          const status = subscription.status === "active" ? "active" :
                         subscription.status === "past_due" ? "delinquent" :
                         subscription.status === "paused" ? "paused" : tenant.billingStatus;

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              billingStatus: status,
              billingPlan: (subscription.metadata.planId as string) || tenant.billingPlan,
              nextInvoiceDate: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              billingStatus: "paused",
              stripeSubscriptionId: null,
              lastPaymentStatus: "cancelled",
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
