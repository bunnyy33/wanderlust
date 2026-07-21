import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeFlightBooking } from "@/lib/agency-types";
import { calcFlightPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx { params: Promise<{ id: string; flightId: string }> }

// PUT /api/agency/reservations/[id]/flights/[flightId]
export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, flightId } = await params;
    const existing = await db.flightBooking.findFirst({ where: { id: flightId, reservationId: id } });
    if (!existing) return NextResponse.json({ error: "Flight booking not found" }, { status: 404 });

    const body = await req.json();
    const data: any = {};
    if (body.airline !== undefined) data.airline = String(body.airline);
    if (body.flightNumber !== undefined) data.flightNumber = body.flightNumber ? String(body.flightNumber) : null;
    if (body.flightType !== undefined) data.flightType = String(body.flightType);
    if (body.cabinClass !== undefined) data.cabinClass = String(body.cabinClass);
    if (body.origin !== undefined) data.origin = String(body.origin);
    if (body.destination !== undefined) data.destination = String(body.destination);
    if (body.departDate !== undefined) data.departDate = body.departDate ? new Date(body.departDate) : existing.departDate;
    if (body.returnDate !== undefined) data.returnDate = body.returnDate ? new Date(body.returnDate) : null;
    if (body.noOfAdults !== undefined) data.noOfAdults = Math.max(0, Number(body.noOfAdults));
    if (body.noOfChildren !== undefined) data.noOfChildren = Math.max(0, Number(body.noOfChildren));
    if (body.noOfInfants !== undefined) data.noOfInfants = Math.max(0, Number(body.noOfInfants));
    if (body.supplierId !== undefined) {
      data.supplierId = body.supplierId ? String(body.supplierId) : null;
      if (data.supplierId) { const sup = await db.supplier.findUnique({ where: { id: data.supplierId } }); data.supplierName = sup?.name ?? null; }
      else data.supplierName = null;
    }
    if (body.pnr !== undefined) data.pnr = body.pnr ? String(body.pnr) : null;
    if (body.confirmationNumber !== undefined) data.confirmationNumber = body.confirmationNumber ? String(body.confirmationNumber) : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.comments !== undefined) data.comments = body.comments ? String(body.comments) : null;
    if (body.adultCostRate !== undefined) data.adultCostRate = Number(body.adultCostRate);
    if (body.childCostRate !== undefined) data.childCostRate = Number(body.childCostRate);
    if (body.infantCostRate !== undefined) data.infantCostRate = Number(body.infantCostRate);
    if (body.adultSellRate !== undefined) data.adultSellRate = Number(body.adultSellRate);
    if (body.childSellRate !== undefined) data.childSellRate = Number(body.childSellRate);
    if (body.infantSellRate !== undefined) data.infantSellRate = Number(body.infantSellRate);
    if (body.showOnVoucher !== undefined) data.showOnVoucher = Boolean(body.showOnVoucher);

    const merged = { ...existing, ...data };
    const pricing = calcFlightPricing({ adultCostRate: merged.adultCostRate, childCostRate: merged.childCostRate, infantCostRate: merged.infantCostRate, adultSellRate: merged.adultSellRate, childSellRate: merged.childSellRate, infantSellRate: merged.infantSellRate, noOfAdults: merged.noOfAdults, noOfChildren: merged.noOfChildren, noOfInfants: merged.noOfInfants });
    data.totalCost = pricing.totalCost;
    data.totalSell = pricing.totalSell;

    const updated = await db.flightBooking.update({ where: { id: flightId }, data });
    await recalcReservation(id);
    return NextResponse.json({ flight: serializeFlightBooking(updated) });
  } catch (err) {
    console.error("agency flight PUT error:", err);
    return NextResponse.json({ error: "Failed to update flight" }, { status: 500 });
  }
}

// DELETE /api/agency/reservations/[id]/flights/[flightId]
export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, flightId } = await params;
    const existing = await db.flightBooking.findFirst({ where: { id: flightId, reservationId: id } });
    if (!existing) return NextResponse.json({ error: "Flight booking not found" }, { status: 404 });
    await db.flightBooking.delete({ where: { id: flightId } });
    await recalcReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency flight DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete flight" }, { status: 500 });
  }
}
