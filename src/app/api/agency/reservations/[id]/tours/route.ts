import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeTourBooking } from "@/lib/agency-types";
import { calcTourPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string }>;
}

// GET /api/agency/reservations/[id]/tours
export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const tours = await db.tourBooking.findMany({
      where: { reservationId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ tours: tours.map(serializeTourBooking) });
  } catch (err) {
    console.error("agency tours GET error:", err);
    return NextResponse.json({ error: "Failed to load tours" }, { status: 500 });
  }
}

// POST /api/agency/reservations/[id]/tours
export async function POST(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const tourName = String(body.tourName ?? "").trim();
    if (!tourName) {
      return NextResponse.json({ error: "tourName is required" }, { status: 400 });
    }

    const noOfAdults = Math.max(0, Number(body.noOfAdults ?? 0));
    const noOfChildren = Math.max(0, Number(body.noOfChildren ?? 0));
    const adultCostRate = Number(body.adultCostRate ?? 0);
    const childCostRate = Number(body.childCostRate ?? 0);
    const carCostRate = Number(body.carCostRate ?? 0);
    const adultSellRate = Number(body.adultSellRate ?? 0);
    const childSellRate = Number(body.childSellRate ?? 0);
    const carSellRate = Number(body.carSellRate ?? 0);
    const costUnit = String(body.costUnit ?? "PER_PERSON");

    const pricing = calcTourPricing({
      costUnit,
      adultCostRate,
      childCostRate,
      carCostRate,
      adultSellRate,
      childSellRate,
      carSellRate,
      noOfAdults,
      noOfChildren,
    });

    const tourDate = body.tourDate ? new Date(body.tourDate) : new Date();
    const supplierId = body.supplierId ? String(body.supplierId) : null;
    let supplierName: string | null = null;
    if (supplierId) {
      const sup = await db.supplier.findUnique({ where: { id: supplierId } });
      supplierName = sup?.name ?? null;
    }

    const created = await db.tourBooking.create({
      data: {
        reservationId: id,
        tourId: body.tourId ? String(body.tourId) : null,
        tourName,
        tourOption: body.tourOption ? String(body.tourOption) : null,
        transferOption: String(body.transferOption ?? "WITHOUT_TRANSFER"),
        pickupLocation: body.pickupLocation ? String(body.pickupLocation) : null,
        tourDate,
        pickupTime: body.pickupTime ? String(body.pickupTime) : null,
        timeSlot: body.timeSlot ? String(body.timeSlot) : null,
        noOfAdults,
        noOfChildren,
        supplierId,
        supplierName,
        confirmationNumber: body.confirmationNumber
          ? String(body.confirmationNumber)
          : null,
        status: String(body.status ?? "INITIATED"),
        comments: body.comments ? String(body.comments) : null,
        costUnit,
        adultCostRate,
        childCostRate,
        carCostRate,
        netAdultRate: pricing.netAdultRate,
        netChildRate: pricing.netChildRate,
        totalCost: pricing.totalCost,
        adultSellRate,
        childSellRate,
        carSellRate,
        sellNetAdult: pricing.sellNetAdult,
        sellNetChild: pricing.sellNetChild,
        totalSell: pricing.totalSell,
        showOnVoucher: Boolean(body.showOnVoucher ?? true),
        createdBy: body.createdBy ? String(body.createdBy) : null,
      },
    });

    await recalcReservation(id);
    return NextResponse.json({ tour: serializeTourBooking(created) });
  } catch (err) {
    console.error("agency tour POST error:", err);
    return NextResponse.json({ error: "Failed to add tour" }, { status: 500 });
  }
}
