import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        primaryColor: true,
        billingPlan: true,
        billingStatus: true,
        billingEmail: true,
        hostingProvider: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        nextInvoiceDate: true,
        lastPaymentStatus: true,
        lastPaymentDate: true,
        lastInvoiceTotalGbp: true,
        lastInvoiceBaseRetainerGbp: true,
        lastInvoiceHostingUsageGbp: true,
        lastInvoiceBackendUsageGbp: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
            tenantUsers: true,
          },
        },
      },
    });

    return NextResponse.json({ tenants });
  } catch (error: any) {
    console.error("Superadmin tenants error:", error);
    return NextResponse.json({ tenants: [], error: error.message }, { status: 500 });
  }
}
