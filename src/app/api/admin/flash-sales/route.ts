import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-dev-secret");

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const tenantId = payload.tenantId as string;

    const { productId, discountPercent, reason, durationHours } = await request.json();
    if (!productId || !discountPercent) return NextResponse.json({ error: "productId and discountPercent required" }, { status: 400 });

    // Verify product belongs to tenant
    const product = await db.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Check no existing flash sale
    const existing = await db.flashSale.findUnique({ where: { productId } });
    if (existing) return NextResponse.json({ error: "This product already has a flash sale. Remove it first." }, { status: 400 });

    const now = new Date();
    const sale = await db.flashSale.create({
      data: {
        tenantId,
        productId,
        discountPercent,
        reason: reason || null,
        startsAt: now,
        endsAt: new Date(now.getTime() + (durationHours || 24) * 3600000),
        isActive: true,
      },
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
