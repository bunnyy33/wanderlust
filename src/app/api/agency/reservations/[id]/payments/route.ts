import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializePayment } from "@/lib/agency-types";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const payments = await db.payment.findMany({
      where: { reservationId: id },
      orderBy: { paymentDate: "desc" },
    });
    return NextResponse.json({ payments: payments.map(serializePayment) });
  } catch (err) {
    console.error("agency payments GET error:", err);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}

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
    const amount = Number(body.amount ?? 0);
    if (!(amount > 0)) {
      return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
    }

    const created = await db.payment.create({
      data: {
        reservationId: id,
        amount,
        currency: String(body.currency ?? reservation.currency ?? "AED"),
        paymentMethod: String(body.paymentMethod ?? "CASH"),
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        reference: body.reference ? String(body.reference) : null,
        status: String(body.status ?? "RECEIVED"),
        notes: body.notes ? String(body.notes) : null,
        receivedBy: body.receivedBy ? String(body.receivedBy) : null,
      },
    });

    await recalcReservation(id);
    return NextResponse.json({ payment: serializePayment(created) });
  } catch (err) {
    console.error("agency payment POST error:", err);
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 });
  }
}
