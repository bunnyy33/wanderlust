import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const coupon = await db.coupon.update({
    where: { id },
    data: {
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue !== undefined ? parseFloat(body.discountValue) : undefined,
      minSpend: body.minSpend !== undefined ? parseFloat(body.minSpend) : undefined,
      maxDiscount: body.maxDiscount !== undefined ? (body.maxDiscount ? parseFloat(body.maxDiscount) : null) : undefined,
      usageLimit: body.usageLimit !== undefined ? parseInt(body.usageLimit) : undefined,
      validTo: body.validTo !== undefined ? (body.validTo ? new Date(body.validTo) : null) : undefined,
      active: body.active,
    },
  });
  return NextResponse.json({ coupon });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
