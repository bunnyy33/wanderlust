import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { recalcReservation } from "@/lib/agency-recalc";
import { serializePayment } from "@/lib/agency-types";

interface ctx {
  params: Promise<{ id: string; paymentId: string }>;
}

// PUT /api/agency/reservations/[id]/payments/[paymentId]
export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, paymentId } = await params;
    const existing = await db.payment.findFirst({
      where: { id: paymentId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.paymentMethod !== undefined) data.paymentMethod = String(body.paymentMethod);
    if (body.paymentDate !== undefined)
      data.paymentDate = body.paymentDate ? new Date(body.paymentDate) : existing.paymentDate;
    if (body.reference !== undefined)
      data.reference = body.reference ? String(body.reference) : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.notes !== undefined)
      data.notes = body.notes ? String(body.notes) : null;
    if (body.receivedBy !== undefined)
      data.receivedBy = body.receivedBy ? String(body.receivedBy) : null;

    const updated = await db.payment.update({ where: { id: paymentId }, data });
    await recalcReservation(id);
    return NextResponse.json({ payment: serializePayment(updated) });
  } catch (err) {
    console.error("agency payment PUT error:", err);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, paymentId } = await params;
    const existing = await db.payment.findFirst({
      where: { id: paymentId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    await db.payment.delete({ where: { id: paymentId } });
    await recalcReservation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency payment DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
