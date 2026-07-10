import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    coupons: coupons.map((c) => ({
      ...c,
      validFrom: c.validFrom instanceof Date ? c.validFrom.toISOString() : c.validFrom,
      validTo: c.validTo instanceof Date ? c.validTo?.toISOString() ?? null : c.validTo,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const code = String(body.code || "").toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });
  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  const coupon = await db.coupon.create({
    data: {
      code,
      description: body.description || "",
      discountType: body.discountType || "PERCENT",
      discountValue: parseFloat(body.discountValue) || 0,
      minSpend: parseFloat(body.minSpend) || 0,
      maxDiscount: body.maxDiscount ? parseFloat(body.maxDiscount) : null,
      usageLimit: parseInt(body.usageLimit) || 1000,
      validTo: body.validTo ? new Date(body.validTo) : null,
      active: body.active !== false,
    },
  });
  return NextResponse.json({ coupon });
}
