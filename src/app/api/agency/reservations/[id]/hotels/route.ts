import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeHotelBooking } from "@/lib/agency-types";
import { calcHotelPricing, calcNights } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string }>;
}

// GET /api/agency/reservations/[id]/hotels
export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const hotels = await db.hotelBooking.findMany({
      where: { reservationId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ hotels: hotels.map(serializeHotelBooking) });
  } catch (err) {
    console.error("agency hotels GET error:", err);
    return NextResponse.json({ error: "Failed to load hotels" }, { status: 500 });
  }
}

// POST /api/agency/reservations/[id]/hotels
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
    const hotelName = String(body.hotelName ?? "").trim();
    if (!hotelName) {
      return NextResponse.json({ error: "hotelName is required" }, { status: 400 });
    }

    const checkInDate = body.checkInDate ? new Date(body.checkInDate) : new Date();
    const checkOutDate = body.checkOutDate
      ? new Date(body.checkOutDate)
      : new Date(Date.now() + 86400000);
    const nights = body.nights
      ? Math.max(1, Number(body.nights))
      : calcNights(checkInDate, checkOutDate);
    const noOfRooms = Math.max(1, Number(body.noOfRooms ?? 1));

    const costPerNight = Number(body.costPerNight ?? 0);
    const sellPerNight = Number(body.sellPerNight ?? 0);
    const pricing = calcHotelPricing({
      costPerNight,
      sellPerNight,
      nights,
      noOfRooms,
    });

    const supplierId = body.supplierId ? String(body.supplierId) : null;
    let supplierName: string | null = null;
    if (supplierId) {
      const sup = await db.supplier.findUnique({ where: { id: supplierId } });
      supplierName = sup?.name ?? null;
    }

    const created = await db.hotelBooking.create({
      data: {
        reservationId: id,
        hotelId: body.hotelId ? String(body.hotelId) : null,
        hotelName,
        roomType: String(body.roomType ?? "Standard"),
        mealPlan: String(body.mealPlan ?? "BB"),
        checkInDate,
        checkOutDate,
        nights,
        noOfRooms,
        noOfAdults: Math.max(1, Number(body.noOfAdults ?? 1)),
        noOfChildren: Math.max(0, Number(body.noOfChildren ?? 0)),
        supplierId,
        supplierName,
        confirmationNumber: body.confirmationNumber
          ? String(body.confirmationNumber)
          : null,
        status: String(body.status ?? "INITIATED"),
        comments: body.comments ? String(body.comments) : null,
        costPerNight,
        totalCost: pricing.totalCost,
        sellPerNight,
        totalSell: pricing.totalSell,
        showOnVoucher: Boolean(body.showOnVoucher ?? true),
        createdBy: body.createdBy ? String(body.createdBy) : null,
      },
    });

    await recalcReservation(id);
    return NextResponse.json({ hotel: serializeHotelBooking(created) });
  } catch (err) {
    console.error("agency hotel POST error:", err);
    return NextResponse.json({ error: "Failed to add hotel" }, { status: 500 });
  }
}
