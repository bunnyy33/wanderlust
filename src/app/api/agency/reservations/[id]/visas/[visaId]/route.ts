import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeVisaBooking } from "@/lib/agency-types";
import { calcVisaPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx { params: Promise<{ id: string; visaId: string }> }

export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, visaId } = await params;
    const existing = await db.visaBooking.findFirst({ where: { id: visaId, reservationId: id } });
    if (!existing) return NextResponse.json({ error: "Visa booking not found" }, { status: 404 });

    const body = await req.json();
    const data: any = {};
    if (body.visaType !== undefined) data.visaType = String(body.visaType);
    if (body.destinationCountry !== undefined) data.destinationCountry = String(body.destinationCountry);
    if (body.visaDuration !== undefined) data.visaDuration = body.visaDuration ? String(body.visaDuration) : null;
    if (body.processingType !== undefined) data.processingType = String(body.processingType);
    if (body.applicationDate !== undefined) data.applicationDate = body.applicationDate ? new Date(body.applicationDate) : existing.applicationDate;
    if (body.travelDate !== undefined) data.travelDate = body.travelDate ? new Date(body.travelDate) : null;
    if (body.noOfAdults !== undefined) data.noOfAdults = Math.max(0, Number(body.noOfAdults));
    if (body.noOfChildren !== undefined) data.noOfChildren = Math.max(0, Number(body.noOfChildren));
    if (body.supplierId !== undefined) {
      data.supplierId = body.supplierId ? String(body.supplierId) : null;
      if (data.supplierId) { const sup = await db.supplier.findUnique({ where: { id: data.supplierId } }); data.supplierName = sup?.name ?? null; }
      else data.supplierName = null;
    }
    if (body.applicationNumber !== undefined) data.applicationNumber = body.applicationNumber ? String(body.applicationNumber) : null;
    if (body.confirmationNumber !== undefined) data.confirmationNumber = body.confirmationNumber ? String(body.confirmationNumber) : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.comments !== undefined) data.comments = body.comments ? String(body.comments) : null;
    if (body.adultCostRate !== undefined) data.adultCostRate = Number(body.adultCostRate);
    if (body.childCostRate !== undefined) data.childCostRate = Number(body.childCostRate);
    if (body.adultSellRate !== undefined) data.adultSellRate = Number(body.adultSellRate);
    if (body.childSellRate !== undefined) data.childSellRate = Number(body.childSellRate);
    if (body.showOnVoucher !== undefined) data.showOnVoucher = Boolean(body.showOnVoucher);

    const merged = { ...existing, ...data };
    const pricing = calcVisaPricing({ adultCostRate: merged.adultCostRate, childCostRate: merged.childCostRate, adultSellRate: merged.adultSellRate, childSellRate: merged.childSellRate, noOfAdults: merged.noOfAdults, noOfChildren: merged.noOfChildren });
    data.totalCost = pricing.totalCost;
    data.totalSell = pricing.totalSell;

    const updated = await db.visaBooking.update({ where: { id: visaId }, data });
    await recalcReservation(id);
    return NextResponse.json({ visa: serializeVisaBooking(updated) });
  } catch (err) {
    console.error("agency visa PUT error:", err);
    return NextResponse.json({ error: "Failed to update visa" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, visaId } = await params;
    const existing = await db.visaBooking.findFirst({ where: { id: visaId, reservationId: id } });
    if (!existing) return NextResponse.json({ error: "Visa booking not found" }, { status: 404 });
    await db.visaBooking.delete({ where: { id: visaId } });
    await recalcReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency visa DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete visa" }, { status: 500 });
  }
}
