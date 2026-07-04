import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeCoupon } from "@/lib/transform";

// POST /api/coupons/validate  { code, amount }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, amount } = body;
  if (!code) {
    return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
  }

  const coupon = await db.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  });
  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
  }
  if (coupon.validTo && coupon.validTo < new Date()) {
    return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
  }
  const amt = parseFloat(amount);
  if (amt < coupon.minSpend) {
    return NextResponse.json({
      error: `Minimum spend of $${coupon.minSpend} required for this coupon`,
    }, { status: 400 });
  }

  // Compute discount preview
  let discount = 0;
  if (coupon.discountType === "PERCENT") {
    discount = (amt * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  } else {
    discount = coupon.discountValue;
  }

  return NextResponse.json({
    coupon: serializeCoupon(coupon),
    discount: Math.round(discount * 100) / 100,
  });
}
