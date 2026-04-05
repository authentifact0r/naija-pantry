import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-dev-secret");

async function getTenantId(request: NextRequest): Promise<string> {
  const token = request.cookies.get("access_token")?.value;
  if (!token) throw new Error("Not authenticated");
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload.tenantId as string;
}

// PATCH /api/admin/products/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await db.product.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        shortDescription: body.shortDescription || null,
        category: body.category,
        price: body.price,
        compareAtPrice: body.compareAtPrice || null,
        material: body.material || null,
        careInstructions: body.careInstructions || null,
        brand: body.brand || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        seoKeywords: body.seoKeywords || [],
        sizes: body.sizes || [],
        colors: body.colors || [],
        tags: body.tags || [],
        images: body.images || [],
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;

    const existing = await db.product.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Delete inventory batches first
    await db.inventoryBatch.deleteMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
