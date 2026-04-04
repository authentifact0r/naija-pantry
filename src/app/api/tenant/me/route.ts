import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret"
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const tenantId = payload.tenantId as string;

    if (!tenantId) {
      // Try x-tenant-slug header from middleware
      const slug = request.headers.get("x-tenant-slug");
      if (slug) {
        const tenant = await db.tenant.findUnique({ where: { slug } });
        if (tenant) {
          return NextResponse.json({ tenant });
        }
      }
      return NextResponse.json({ error: "No tenant context" }, { status: 404 });
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
