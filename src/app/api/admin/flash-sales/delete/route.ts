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

    const { id } = await request.json();
    const sale = await db.flashSale.findFirst({ where: { id, tenantId } });
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.flashSale.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
