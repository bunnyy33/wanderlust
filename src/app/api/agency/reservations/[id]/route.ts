import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeReservation } from "@/lib/agency-types";
import { calcReservationTotals } from "@/lib/agency-pricing";

interface ctx {
  params: Promise<{ id: string }>;
}

// GET /api/agency/reservations/[id] — full reservation
export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const reservation = await db.reservation.findUnique({
      where: { id },
      include: {
        tours: true,
        transports: true,
        hotels: true,
        guests: true,
        payments: true,
        employee: true,
      },
    });
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ reservation: serializeReservation(reservation) });
  } catch (err) {
    console.error("agency reservation GET error:", err);
    return NextResponse.json(
      { error: "Failed to load reservation" },
      { status: 500 },
    );
  }
}

// PUT /api/agency/reservations/[id] — update reservation
export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await db.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    const data: any = {};
    if (body.customerName !== undefined) data.customerName = String(body.customerName);
    if (body.customerEmail !== undefined) data.customerEmail = String(body.customerEmail);
    if (body.customerPhone !== undefined)
      data.customerPhone = body.customerPhone ? String(body.customerPhone) : null;
    if (body.isGuest !== undefined) data.isGuest = Boolean(body.isGuest);
    if (body.orderDate !== undefined)
      data.orderDate = body.orderDate ? new Date(body.orderDate) : existing.orderDate;
    if (body.invoiceDate !== undefined)
      data.invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null;
    if (body.bookingStatus !== undefined)
      data.bookingStatus = String(body.bookingStatus);
    if (body.saleById !== undefined)
      data.saleById = body.saleById ? String(body.saleById) : null;
    if (body.invoiceType !== undefined) data.invoiceType = String(body.invoiceType);
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.remarks !== undefined) data.remarks = body.remarks ? String(body.remarks) : null;
    if (body.termsAccepted !== undefined)
      data.termsAccepted = Boolean(body.termsAccepted);
    // Fraud fields
    if (body.manualReview !== undefined) {
      const review = String(body.manualReview);
      if (["PENDING", "REAL", "SPAM"].includes(review)) {
        data.manualReview = review;
      }
    }
    if (body.isFlagged !== undefined) data.isFlagged = Boolean(body.isFlagged);
    if (body.fraudScore !== undefined) data.fraudScore = Number(body.fraudScore) || 0;

    const updated = await db.reservation.update({
      where: { id },
      data,
      include: {
        tours: true,
        transports: true,
        hotels: true,
        guests: true,
        payments: true,
        employee: true,
      },
    });

    // Recalculate totals (invoice type may have changed)
    const totals = calcReservationTotals(
      updated.tours,
      updated.transports,
      updated.hotels,
      updated.payments,
      updated.invoiceType,
    );
    const final_ = await db.reservation.update({
      where: { id },
      data: totals,
      include: {
        tours: true,
        transports: true,
        hotels: true,
        guests: true,
        payments: true,
        employee: true,
      },
    });

    return NextResponse.json({ reservation: serializeReservation(final_) });
  } catch (err) {
    console.error("agency reservation PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 },
    );
  }
}

// PATCH /api/agency/reservations/[id] — partial update
// Used by the booking list "Open" button to flip status → "In Process",
// and by the eye-dialog Real / Spam / Reset buttons to update manualReview.
// Body: { bookingStatus?, manualReview?, isFlagged? }
export async function PATCH(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await db.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    const data: any = {};
    if (body.bookingStatus !== undefined) {
      const status = String(body.bookingStatus);
      const allowed = [
        "PENDING",
        "SUPPLIER_PENDING",
        "SUPPLIER_CONFIRMED",
        "CUSTOMER_CONFIRMED",
        "COMPLETED",
        "CANCELLED",
      ];
      if (allowed.includes(status)) {
        data.bookingStatus = status;
      }
    }
    if (body.manualReview !== undefined) {
      const review = String(body.manualReview);
      if (["PENDING", "REAL", "SPAM"].includes(review)) {
        data.manualReview = review;
      }
    }
    if (body.isFlagged !== undefined) data.isFlagged = Boolean(body.isFlagged);
    if (body.fraudScore !== undefined) data.fraudScore = Number(body.fraudScore) || 0;

    const updated = await db.reservation.update({
      where: { id },
      data,
      include: {
        tours: true,
        transports: true,
        hotels: true,
        guests: true,
        payments: true,
        employee: true,
      },
    });

    return NextResponse.json({ reservation: serializeReservation(updated) });
  } catch (err) {
    console.error("agency reservation PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 },
    );
  }
}

// DELETE /api/agency/reservations/[id] — remove reservation
export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }
    // Prisma does not auto-cascade — delete children first.
    await db.tourBooking.deleteMany({ where: { reservationId: id } });
    await db.transportBooking.deleteMany({ where: { reservationId: id } });
    await db.hotelBooking.deleteMany({ where: { reservationId: id } });
    await db.guest.deleteMany({ where: { reservationId: id } });
    await db.payment.deleteMany({ where: { reservationId: id } });
    await db.reservation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency reservation DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete reservation" },
      { status: 500 },
    );
  }
}
