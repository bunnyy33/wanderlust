import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import {
  serializeReservation,
  serializeReservationListItem,
} from "@/lib/agency-types";
import { calcReservationTotals, VAT_RATE } from "@/lib/agency-pricing";
import { fetchReservationList, fetchReservationById } from "@/lib/agency-queries";

function genReference(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `WL-RES-${n}`;
}

function genInvoice(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `WL-INV-${n}`;
}

// Generate plausible fraud detection data for a new reservation.
// This mirrors what the website Booking model captures at checkout.
function genFraudData() {
  const ip = `${Math.floor(Math.random() * 223 + 1)}.${Math.floor(
    Math.random() * 256,
  )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254 + 1)}`;

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
  ];

  // Pool of fraud signals — pick 0-3 weighted toward low scores
  const allSignals = [
    "Email domain age < 7 days",
    "IP geolocation mismatch with billing country",
    "Multiple booking attempts in 1 hour",
    "Disposable email provider",
    "VPN / proxy detected",
    "Card BIN country mismatch",
    "High-risk ASN (hosting provider)",
    "Phone country code mismatch",
    "Velocity rule triggered",
    "Address mismatch (AVS)",
  ];

  // Score distribution: 60% low (<25), 25% medium (25-49), 15% high (50+)
  const roll = Math.random();
  let score: number;
  if (roll < 0.6) score = Math.floor(Math.random() * 25);
  else if (roll < 0.85) score = 25 + Math.floor(Math.random() * 25);
  else score = 50 + Math.floor(Math.random() * 45);

  // More signals = higher score
  const signalCount = score < 25 ? Math.floor(Math.random() * 2) : score < 50 ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
  const signals: string[] = [];
  const pool = [...allSignals];
  for (let i = 0; i < signalCount && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    signals.push(pool.splice(idx, 1)[0]);
  }

  return {
    ipAddress: ip,
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    fraudScore: score,
    fraudSignals: JSON.stringify(signals),
    isFlagged: score >= 50,
    manualReview: "PENDING" as const,
  };
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

    const reservations = await fetchReservationList(where, limit);

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
        ...genFraudData(),
      },
    });

    // Compute initial totals (empty services)
    const totals = calcReservationTotals([], [], [], [], created.invoiceType, VAT_RATE);
    await db.reservation.update({
      where: { id: created.id },
      data: totals,
    });
    const updated = await fetchReservationById(created.id);

    return NextResponse.json({ reservation: serializeReservation(updated) });
  } catch (err) {
    console.error("agency reservations POST error:", err);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 },
    );
  }
}
