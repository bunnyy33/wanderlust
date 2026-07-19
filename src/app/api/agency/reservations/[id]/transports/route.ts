import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeTransportBooking } from "@/lib/agency-types";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string }>;
}

// GET /api/agency/reservations/[id]/transports
export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const transports = await db.transportBooking.findMany({
      where: { reservationId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      transports: transports.map(serializeTransportBooking),
    });
  } catch (err) {
    console.error("agency transports GET error:", err);
    return NextResponse.json({ error: "Failed to load transports" }, { status: 500 });
  }
}

// POST /api/agency/reservations/[id]/transports
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
    const pickupLocation = String(body.pickupLocation ?? "").trim();
    if (!pickupLocation) {
      return NextResponse.json(
        { error: "pickupLocation is required" },
        { status: 400 },
      );
    }

    const netRate = Number(body.netRate ?? 0);
    const sellRate = Number(body.sellRate ?? 0);
    const margin = sellRate - netRate;

    const supplierId = body.supplierId ? String(body.supplierId) : null;
    let supplierName: string | null = null;
    if (supplierId) {
      const sup = await db.supplier.findUnique({ where: { id: supplierId } });
      supplierName = sup?.name ?? null;
    }

    const created = await db.transportBooking.create({
      data: {
        reservationId: id,
        carType: String(body.carType ?? "SEDAN"),
        noOfPax: Math.max(1, Number(body.noOfPax ?? 1)),
        transportType: String(body.transportType ?? "ARRIVAL"),
        pickupDateTime: body.pickupDateTime
          ? new Date(body.pickupDateTime)
          : new Date(),
        pickupLocation,
        dropoffLocation: String(body.dropoffLocation ?? ""),
        flightNumber: body.flightNumber ? String(body.flightNumber) : null,
        supplierId,
        supplierName,
        contactNumber: body.contactNumber ? String(body.contactNumber) : null,
        confirmationNumber: body.confirmationNumber
          ? String(body.confirmationNumber)
          : null,
        status: String(body.status ?? "INITIATED"),
        comments: body.comments ? String(body.comments) : null,
        netRate,
        sellRate,
        margin,
        showOnVoucher: Boolean(body.showOnVoucher ?? true),
        createdBy: body.createdBy ? String(body.createdBy) : null,
      },
    });

    await recalcReservation(id);
    return NextResponse.json({ transport: serializeTransportBooking(created) });
  } catch (err) {
    console.error("agency transport POST error:", err);
    return NextResponse.json({ error: "Failed to add transport" }, { status: 500 });
  }
}
