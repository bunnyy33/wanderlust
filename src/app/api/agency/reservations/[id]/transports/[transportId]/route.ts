import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeTransportBooking } from "@/lib/agency-types";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string; transportId: string }>;
}

export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, transportId } = await params;
    const existing = await db.transportBooking.findFirst({
      where: { id: transportId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Transport booking not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const data: any = {};

    if (body.carType !== undefined) data.carType = String(body.carType);
    if (body.noOfPax !== undefined) data.noOfPax = Math.max(1, Number(body.noOfPax));
    if (body.transportType !== undefined) data.transportType = String(body.transportType);
    if (body.pickupDateTime !== undefined)
      data.pickupDateTime = body.pickupDateTime
        ? new Date(body.pickupDateTime)
        : existing.pickupDateTime;
    if (body.pickupLocation !== undefined) data.pickupLocation = String(body.pickupLocation);
    if (body.dropoffLocation !== undefined)
      data.dropoffLocation = String(body.dropoffLocation);
    if (body.flightNumber !== undefined)
      data.flightNumber = body.flightNumber ? String(body.flightNumber) : null;
    if (body.supplierId !== undefined) {
      data.supplierId = body.supplierId ? String(body.supplierId) : null;
      if (data.supplierId) {
        const sup = await db.supplier.findUnique({ where: { id: data.supplierId } });
        data.supplierName = sup?.name ?? null;
      } else {
        data.supplierName = null;
      }
    }
    if (body.contactNumber !== undefined)
      data.contactNumber = body.contactNumber ? String(body.contactNumber) : null;
    if (body.confirmationNumber !== undefined)
      data.confirmationNumber = body.confirmationNumber
        ? String(body.confirmationNumber)
        : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.comments !== undefined)
      data.comments = body.comments ? String(body.comments) : null;
    if (body.netRate !== undefined) data.netRate = Number(body.netRate);
    if (body.sellRate !== undefined) data.sellRate = Number(body.sellRate);
    if (body.showOnVoucher !== undefined) data.showOnVoucher = Boolean(body.showOnVoucher);

    const merged = { ...existing, ...data };
    data.margin = merged.sellRate - merged.netRate;

    const updated = await db.transportBooking.update({
      where: { id: transportId },
      data,
    });

    await recalcReservation(id);
    return NextResponse.json({ transport: serializeTransportBooking(updated) });
  } catch (err) {
    console.error("agency transport PUT error:", err);
    return NextResponse.json({ error: "Failed to update transport" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, transportId } = await params;
    const existing = await db.transportBooking.findFirst({
      where: { id: transportId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Transport booking not found" },
        { status: 404 },
      );
    }
    await db.transportBooking.delete({ where: { id: transportId } });
    await recalcReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency transport DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete transport" }, { status: 500 });
  }
}
