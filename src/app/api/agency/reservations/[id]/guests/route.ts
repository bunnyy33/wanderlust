import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeGuest } from "@/lib/agency-types";

interface ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const guests = await db.guest.findMany({
      where: { reservationId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ guests: guests.map(serializeGuest) });
  } catch (err) {
    console.error("agency guests GET error:", err);
    return NextResponse.json({ error: "Failed to load guests" }, { status: 500 });
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
    const fullName = String(body.fullName ?? "").trim();
    if (!fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    const created = await db.guest.create({
      data: {
        reservationId: id,
        title: String(body.title ?? "Mr"),
        fullName,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        passportNumber: body.passportNumber ? String(body.passportNumber) : null,
        paxType: String(body.paxType ?? "ADULT"),
        nationality: body.nationality ? String(body.nationality) : null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      },
    });
    return NextResponse.json({ guest: serializeGuest(created) });
  } catch (err) {
    console.error("agency guest POST error:", err);
    return NextResponse.json({ error: "Failed to add guest" }, { status: 500 });
  }
}
