import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import {
  serializeReservation,
  serializeReservationListItem,
} from "@/lib/agency-types";
import { calcReservationTotals } from "@/lib/agency-pricing";

function genReference(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `WL-RES-${n}`;
}

function genInvoice(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `WL-INV-${n}`;
}

// GET /api/agency/reservations — list with filters
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").trim();
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 100)));

    const where: any = {};
    if (status && status !== "ALL") where.bookingStatus = status;
    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    const reservations = await db.reservation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { employee: true, tours: true, transports: true, hotels: true },
    });

    return NextResponse.json({
      reservations: reservations.map(serializeReservationListItem),
    });
  } catch (err) {
    console.error("agency reservations GET error:", err);
    return NextResponse.json(
      { error: "Failed to load reservations" },
      { status: 500 },
    );
  }
}

// POST /api/agency/reservations — create a new reservation
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const customerName = String(body.customerName ?? "").trim();
    const customerEmail = String(body.customerEmail ?? "").trim();

    if (!customerName) {
      return NextResponse.json(
        { error: "customerName is required" },
        { status: 400 },
      );
    }
    if (!customerEmail) {
      return NextResponse.json(
        { error: "customerEmail is required" },
        { status: 400 },
      );
    }

    // Generate unique reference & invoice
    let reference = genReference();
    let invoiceNumber = genInvoice();
    for (let i = 0; i < 5; i++) {
      const refExists = await db.reservation.findUnique({
        where: { reference },
        select: { id: true },
      });
      const invExists = await db.reservation.findUnique({
        where: { invoiceNumber },
        select: { id: true },
      });
      if (!refExists && !invExists) break;
      reference = genReference();
      invoiceNumber = genInvoice();
    }

    const orderDate = body.orderDate ? new Date(body.orderDate) : new Date();
    const invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null;

    const created = await db.reservation.create({
      data: {
        reference,
        invoiceNumber,
        customerName,
        customerEmail,
        customerPhone: body.customerPhone ? String(body.customerPhone) : null,
        isGuest: Boolean(body.isGuest ?? false),
        orderDate,
        invoiceDate,
        bookingStatus: String(body.bookingStatus ?? "PENDING"),
        saleById: body.saleById ? String(body.saleById) : null,
        createdById: body.createdById ? String(body.createdById) : null,
        invoiceType: String(body.invoiceType ?? "TAXABLE"),
        currency: String(body.currency ?? "AED"),
        remarks: body.remarks ? String(body.remarks) : null,
        termsAccepted: Boolean(body.termsAccepted ?? false),
      },
      include: {
        tours: true,
        transports: true,
        hotels: true,
        guests: true,
        payments: true,
        employee: true,
      },
    });

    // Compute initial totals (empty services)
    const totals = calcReservationTotals([], [], [], [], created.invoiceType);
    const updated = await db.reservation.update({
      where: { id: created.id },
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

    return NextResponse.json({ reservation: serializeReservation(updated) });
  } catch (err) {
    console.error("agency reservations POST error:", err);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 },
    );
  }
}
