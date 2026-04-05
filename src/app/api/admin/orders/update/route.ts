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

    const { orderId, status, trackingNumber, notes } = await request.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    // Verify ownership
    const order = await db.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const data: any = {};
    if (status) data.status = status;
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber || null;
    if (notes !== undefined) data.notes = notes || null;

    // Set timestamps
    if (status === "SHIPPED" && !order.shippedAt) data.shippedAt = new Date();
    if (status === "DELIVERED" && !order.deliveredAt) data.deliveredAt = new Date();

    const updated = await db.order.update({ where: { id: orderId }, data });

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
