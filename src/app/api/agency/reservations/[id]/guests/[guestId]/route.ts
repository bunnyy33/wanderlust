import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeGuest } from "@/lib/agency-types";

interface ctx {
  params: Promise<{ id: string; guestId: string }>;
}

export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, guestId } = await params;
    const existing = await db.guest.findFirst({
      where: { id: guestId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.fullName !== undefined) data.fullName = String(body.fullName);
    if (body.email !== undefined) data.email = body.email ? String(body.email) : null;
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone) : null;
    if (body.passportNumber !== undefined)
      data.passportNumber = body.passportNumber ? String(body.passportNumber) : null;
    if (body.paxType !== undefined) data.paxType = String(body.paxType);
    if (body.nationality !== undefined)
      data.nationality = body.nationality ? String(body.nationality) : null;
    if (body.dateOfBirth !== undefined)
      data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;

    const updated = await db.guest.update({ where: { id: guestId }, data });
    return NextResponse.json({ guest: serializeGuest(updated) });
  } catch (err) {
    console.error("agency guest PUT error:", err);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, guestId } = await params;
    const existing = await db.guest.findFirst({
      where: { id: guestId, reservationId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    await db.guest.delete({ where: { id: guestId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency guest DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}
