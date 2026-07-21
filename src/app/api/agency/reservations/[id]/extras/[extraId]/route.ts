import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeExtraBooking } from "@/lib/agency-types";
import { calcExtraPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx { params: Promise<{ id: string; extraId: string }> }

export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, extraId } = await params;
    const existing = await db.extraBooking.findFirst({ where: { id: extraId, reservationId: id } });
    if (!existing) return NextResponse.json({ error: "Extra booking not found" }, { status: 404 });

    const body = await req.json();
    const data: any = {};
    if (body.extraName !== undefined) data.extraName = String(body.extraName);
    if (body.extraOption !== undefined) data.extraOption = body.extraOption ? String(body.extraOption) : null;
    if (body.serviceDate !== undefined) data.serviceDate = body.serviceDate ? new Date(body.serviceDate) : null;
    if (body.quantity !== undefined) data.quantity = Math.max(1, Number(body.quantity));
    if (body.supplierId !== undefined) {
      data.supplierId = body.supplierId ? String(body.supplierId) : null;
      if (data.supplierId) { const sup = await db.supplier.findUnique({ where: { id: data.supplierId } }); data.supplierName = sup?.name ?? null; }
      else data.supplierName = null;
    }
    if (body.confirmationNumber !== undefined) data.confirmationNumber = body.confirmationNumber ? String(body.confirmationNumber) : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.comments !== undefined) data.comments = body.comments ? String(body.comments) : null;
    if (body.costRate !== undefined) data.costRate = Number(body.costRate);
    if (body.sellRate !== undefined) data.sellRate = Number(body.sellRate);
    if (body.showOnVoucher !== undefined) data.showOnVoucher = Boolean(body.showOnVoucher);

    const merged = { ...existing, ...data };
    const pricing = calcExtraPricing({ costRate: merged.costRate, sellRate: merged.sellRate, quantity: merged.quantity });
    data.totalCost = pricing.totalCost;
    data.totalSell = pricing.totalSell;

    const updated = await db.extraBooking.update({ where: { id: extraId }, data });
    await recalcReservation(id);
    return NextResponse.json({ extra: serializeExtraBooking(updated) });
  } catch (err) {
    console.error("agency extra PUT error:", err);
    return NextResponse.json({ error: "Failed to update extra" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, extraId } = await params;
    const existing = await db.extraBooking.findFirst({ where: { id: extraId, reservationId: id } });
    if (!existing) return NextResponse.json({ error: "Extra booking not found" }, { status: 404 });
    await db.extraBooking.delete({ where: { id: extraId } });
    await recalcReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency extra DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete extra" }, { status: 500 });
  }
}
