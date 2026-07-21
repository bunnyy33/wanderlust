import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeReservation } from "@/lib/agency-types";
import { calcReservationTotals, VAT_RATE } from "@/lib/agency-pricing";
import { fetchReservationById } from "@/lib/agency-queries";

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
    const reservation = await fetchReservationById(id);
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
    if (body.manualReview !== undefined) {
      const review = String(body.manualReview);
      if (["PENDING", "REAL", "SPAM"].includes(review)) {
        data.manualReview = review;
      }
    }
    if (body.isFlagged !== undefined) data.isFlagged = Boolean(body.isFlagged);
    if (body.fraudScore !== undefined) data.fraudScore = Number(body.fraudScore) || 0;

    await db.reservation.update({ where: { id }, data });

    // Re-fetch with resilient include
    const updated = await fetchReservationById(id);
    if (!updated) {
      return NextResponse.json(
        { error: "Reservation not found after update" },
        { status: 404 },
      );
    }

    // Recalculate totals
    const totals = calcReservationTotals(
      updated.tours ?? [],
      updated.transports ?? [],
      updated.hotels ?? [],
      updated.payments ?? [],
      updated.invoiceType,
      VAT_RATE,
      updated.flights ?? [],
      updated.visas ?? [],
      updated.extras ?? [],
    );
    const { subTotal, vatAmount, totalAmount, amountPaid, balanceDue } = totals;
    await db.reservation.update({
      where: { id },
      data: { subTotal, vatAmount, totalAmount, amountPaid, balanceDue },
    });
    const final_ = await fetchReservationById(id);

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

    await db.reservation.update({ where: { id }, data });
    const updated = await fetchReservationById(id);
    if (!updated) {
      return NextResponse.json(
        { error: "Reservation not found after update" },
        { status: 404 },
      );
    }
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
    // Delete children first. Wrap new-model deletes in try/catch.
    await db.tourBooking.deleteMany({ where: { reservationId: id } });
    await db.transportBooking.deleteMany({ where: { reservationId: id } });
    await db.hotelBooking.deleteMany({ where: { reservationId: id } });
    try { await db.flightBooking.deleteMany({ where: { reservationId: id } }); } catch { /* table may not exist */ }
    try { await db.visaBooking.deleteMany({ where: { reservationId: id } }); } catch { /* table may not exist */ }
    try { await db.extraBooking.deleteMany({ where: { reservationId: id } }); } catch { /* table may not exist */ }
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
