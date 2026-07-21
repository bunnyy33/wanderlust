import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeHotelBooking } from "@/lib/agency-types";
import { calcHotelPricing, calcNights } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string; hotelId: string }>;
}

export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, hotelId } = await params;
    const existing = await db.hotelBooking.findFirst({
      where: { id: hotelId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Hotel booking not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const data: any = {};

    if (body.hotelName !== undefined) data.hotelName = String(body.hotelName);
    if (body.hotelId !== undefined) data.hotelId = body.hotelId ? String(body.hotelId) : null;
    if (body.roomType !== undefined) data.roomType = String(body.roomType);
    if (body.mealPlan !== undefined) data.mealPlan = String(body.mealPlan);
    if (body.checkInDate !== undefined)
      data.checkInDate = body.checkInDate ? new Date(body.checkInDate) : existing.checkInDate;
    if (body.checkOutDate !== undefined)
      data.checkOutDate = body.checkOutDate
        ? new Date(body.checkOutDate)
        : existing.checkOutDate;
    if (body.noOfRooms !== undefined) data.noOfRooms = Math.max(1, Number(body.noOfRooms));
    if (body.noOfAdults !== undefined) data.noOfAdults = Math.max(1, Number(body.noOfAdults));
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
    if (body.costPerNight !== undefined) data.costPerNight = Number(body.costPerNight);
    if (body.sellPerNight !== undefined) data.sellPerNight = Number(body.sellPerNight);
    if (body.showOnVoucher !== undefined) data.showOnVoucher = Boolean(body.showOnVoucher);

    // Merge values + recompute nights/totals
    const merged = { ...existing, ...data } as any;
    merged.nights = body.nights
      ? Math.max(1, Number(body.nights))
      : calcNights(new Date(merged.checkInDate), new Date(merged.checkOutDate));
    data.nights = merged.nights;
    const pricing = calcHotelPricing({
      costPerNight: merged.costPerNight,
      sellPerNight: merged.sellPerNight,
      nights: merged.nights,
      noOfRooms: merged.noOfRooms,
    });
    data.totalCost = pricing.totalCost;
    data.totalSell = pricing.totalSell;

    const updated = await db.hotelBooking.update({
      where: { id: hotelId },
      data,
    });

    await recalcReservation(id);
    return NextResponse.json({ hotel: serializeHotelBooking(updated) });
  } catch (err) {
    console.error("agency hotel PUT error:", err);
    return NextResponse.json({ error: "Failed to update hotel" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, hotelId } = await params;
    const existing = await db.hotelBooking.findFirst({
      where: { id: hotelId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Hotel booking not found" },
        { status: 404 },
      );
    }
    await db.hotelBooking.delete({ where: { id: hotelId } });
    await recalcReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency hotel DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete hotel" }, { status: 500 });
  }
}
