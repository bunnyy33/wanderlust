import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeFlightBooking } from "@/lib/agency-types";
import { calcFlightPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx { params: Promise<{ id: string }> }

// GET /api/agency/reservations/[id]/flights
export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const flights = await db.flightBooking.findMany({ where: { reservationId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ flights: flights.map(serializeFlightBooking) });
  } catch (err) {
    console.error("agency flights GET error:", err);
    return NextResponse.json({ error: "Failed to load flights" }, { status: 500 });
  }
}

// POST /api/agency/reservations/[id]/flights
export async function POST(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const airline = String(body.airline ?? "").trim();
    const flightNumber = String(body.flightNumber ?? "").trim();
    if (!airline && !flightNumber) {
      return NextResponse.json({ error: "airline or flightNumber is required" }, { status: 400 });
    }

    const noOfAdults = Math.max(0, Number(body.noOfAdults ?? 1));
    const noOfChildren = Math.max(0, Number(body.noOfChildren ?? 0));
    const noOfInfants = Math.max(0, Number(body.noOfInfants ?? 0));
    const adultCostRate = Number(body.adultCostRate ?? 0);
    const childCostRate = Number(body.childCostRate ?? 0);
    const infantCostRate = Number(body.infantCostRate ?? 0);
    const adultSellRate = Number(body.adultSellRate ?? 0);
    const childSellRate = Number(body.childSellRate ?? 0);
    const infantSellRate = Number(body.infantSellRate ?? 0);
    const pricing = calcFlightPricing({ adultCostRate, childCostRate, infantCostRate, adultSellRate, childSellRate, infantSellRate, noOfAdults, noOfChildren, noOfInfants });

    let supplierName: string | null = null;
    if (body.supplierId) {
      const sup = await db.supplier.findUnique({ where: { id: String(body.supplierId) } });
      supplierName = sup?.name ?? null;
    }

    const created = await db.flightBooking.create({
      data: {
        reservationId: id,
        airline,
        flightNumber: flightNumber || null,
        flightType: String(body.flightType ?? "ONE_WAY"),
        cabinClass: String(body.cabinClass ?? "ECONOMY"),
        origin: String(body.origin ?? ""),
        destination: String(body.destination ?? ""),
        departDate: body.departDate ? new Date(body.departDate) : new Date(),
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        noOfAdults, noOfChildren, noOfInfants,
        supplierId: body.supplierId ? String(body.supplierId) : null,
        supplierName,
        pnr: body.pnr ? String(body.pnr) : null,
        confirmationNumber: body.confirmationNumber ? String(body.confirmationNumber) : null,
        status: String(body.status ?? "INITIATED"),
        comments: body.comments ? String(body.comments) : null,
        adultCostRate, childCostRate, infantCostRate, totalCost: pricing.totalCost,
        adultSellRate, childSellRate, infantSellRate, totalSell: pricing.totalSell,
        showOnVoucher: Boolean(body.showOnVoucher ?? true),
      },
    });
    await recalcReservation(id);
    return NextResponse.json({ flight: serializeFlightBooking(created) });
  } catch (err) {
    console.error("agency flights POST error:", err);
    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 });
  }
}
