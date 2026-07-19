import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeTourBooking } from "@/lib/agency-types";
import { calcTourPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string; tourId: string }>;
}

// PUT /api/agency/reservations/[id]/tours/[tourId]
export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, tourId } = await params;
    const existing = await db.tourBooking.findFirst({
      where: { id: tourId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tour booking not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};

    if (body.tourName !== undefined) data.tourName = String(body.tourName);
    if (body.tourId !== undefined) data.tourId = body.tourId ? String(body.tourId) : null;
    if (body.tourOption !== undefined)
      data.tourOption = body.tourOption ? String(body.tourOption) : null;
    if (body.transferOption !== undefined)
      data.transferOption = String(body.transferOption);
    if (body.pickupLocation !== undefined)
      data.pickupLocation = body.pickupLocation ? String(body.pickupLocation) : null;
    if (body.tourDate !== undefined)
      data.tourDate = body.tourDate ? new Date(body.tourDate) : existing.tourDate;
    if (body.pickupTime !== undefined)
      data.pickupTime = body.pickupTime ? String(body.pickupTime) : null;
    if (body.timeSlot !== undefined)
      data.timeSlot = body.timeSlot ? String(body.timeSlot) : null;
    if (body.noOfAdults !== undefined) data.noOfAdults = Math.max(0, Number(body.noOfAdults));
    if (body.noOfChildren !== undefined)
      data.noOfChildren = Math.max(0, Number(body.noOfChildren));
    if (body.supplierId !== undefined) {
      data.supplierId = body.supplierId ? String(body.supplierId) : null;
      if (data.supplierId) {
        const sup = await db.supplier.findUnique({ where: { id: data.supplierId } });
        data.supplierName = sup?.name ?? null;
      } else {
        data.supplierName = null;
      }
    }
    if (body.confirmationNumber !== undefined)
      data.confirmationNumber = body.confirmationNumber
        ? String(body.confirmationNumber)
        : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.comments !== undefined)
      data.comments = body.comments ? String(body.comments) : null;
    if (body.costUnit !== undefined) data.costUnit = String(body.costUnit);
    if (body.adultCostRate !== undefined)
      data.adultCostRate = Number(body.adultCostRate);
    if (body.childCostRate !== undefined)
      data.childCostRate = Number(body.childCostRate);
    if (body.carCostRate !== undefined) data.carCostRate = Number(body.carCostRate);
    if (body.adultSellRate !== undefined)
      data.adultSellRate = Number(body.adultSellRate);
    if (body.childSellRate !== undefined)
      data.childSellRate = Number(body.childSellRate);
    if (body.carSellRate !== undefined) data.carSellRate = Number(body.carSellRate);
    if (body.showOnVoucher !== undefined) data.showOnVoucher = Boolean(body.showOnVoucher);

    // Recompute pricing from the merged values
    const merged = { ...existing, ...data };
    const pricing = calcTourPricing({
      costUnit: merged.costUnit,
      adultCostRate: merged.adultCostRate,
      childCostRate: merged.childCostRate,
      carCostRate: merged.carCostRate,
      adultSellRate: merged.adultSellRate,
      childSellRate: merged.childSellRate,
      carSellRate: merged.carSellRate,
      noOfAdults: merged.noOfAdults,
      noOfChildren: merged.noOfChildren,
    });
    data.netAdultRate = pricing.netAdultRate;
    data.netChildRate = pricing.netChildRate;
    data.totalCost = pricing.totalCost;
    data.sellNetAdult = pricing.sellNetAdult;
    data.sellNetChild = pricing.sellNetChild;
    data.totalSell = pricing.totalSell;

    const updated = await db.tourBooking.update({
      where: { id: tourId },
      data,
    });

    await recalcReservation(id);
    return NextResponse.json({ tour: serializeTourBooking(updated) });
  } catch (err) {
    console.error("agency tour PUT error:", err);
    return NextResponse.json({ error: "Failed to update tour" }, { status: 500 });
  }
}

// DELETE /api/agency/reservations/[id]/tours/[tourId]
export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, tourId } = await params;
    const existing = await db.tourBooking.findFirst({
      where: { id: tourId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tour booking not found" }, { status: 404 });
    }
    await db.tourBooking.delete({ where: { id: tourId } });
    await recalcReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency tour DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete tour" }, { status: 500 });
  }
}
