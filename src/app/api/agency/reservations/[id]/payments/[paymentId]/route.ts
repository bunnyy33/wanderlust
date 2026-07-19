import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx {
  params: Promise<{ id: string; paymentId: string }>;
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
