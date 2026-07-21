import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeVisaBooking } from "@/lib/agency-types";
import { calcVisaPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const visas = await db.visaBooking.findMany({ where: { reservationId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ visas: visas.map(serializeVisaBooking) });
  } catch (err) {
    console.error("agency visas GET error:", err);
    return NextResponse.json({ error: "Failed to load visas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const destinationCountry = String(body.destinationCountry ?? "").trim();
    if (!destinationCountry) {
      return NextResponse.json({ error: "destinationCountry is required" }, { status: 400 });
    }

    const noOfAdults = Math.max(0, Number(body.noOfAdults ?? 1));
    const noOfChildren = Math.max(0, Number(body.noOfChildren ?? 0));
    const adultCostRate = Number(body.adultCostRate ?? 0);
    const childCostRate = Number(body.childCostRate ?? 0);
    const adultSellRate = Number(body.adultSellRate ?? 0);
    const childSellRate = Number(body.childSellRate ?? 0);
    const pricing = calcVisaPricing({ adultCostRate, childCostRate, adultSellRate, childSellRate, noOfAdults, noOfChildren });

    let supplierName: string | null = null;
    if (body.supplierId) {
      const sup = await db.supplier.findUnique({ where: { id: String(body.supplierId) } });
      supplierName = sup?.name ?? null;
    }

    const created = await db.visaBooking.create({
      data: {
        reservationId: id,
        visaType: String(body.visaType ?? "TOURIST"),
        destinationCountry,
        visaDuration: body.visaDuration ? String(body.visaDuration) : null,
        processingType: String(body.processingType ?? "NORMAL"),
        applicationDate: body.applicationDate ? new Date(body.applicationDate) : new Date(),
        travelDate: body.travelDate ? new Date(body.travelDate) : null,
        noOfAdults, noOfChildren,
        supplierId: body.supplierId ? String(body.supplierId) : null,
        supplierName,
        applicationNumber: body.applicationNumber ? String(body.applicationNumber) : null,
        confirmationNumber: body.confirmationNumber ? String(body.confirmationNumber) : null,
        status: String(body.status ?? "INITIATED"),
        comments: body.comments ? String(body.comments) : null,
        adultCostRate, childCostRate, totalCost: pricing.totalCost,
        adultSellRate, childSellRate, totalSell: pricing.totalSell,
        showOnVoucher: Boolean(body.showOnVoucher ?? true),
      },
    });
    await recalcReservation(id);
    return NextResponse.json({ visa: serializeVisaBooking(created) });
  } catch (err) {
    console.error("agency visas POST error:", err);
    return NextResponse.json({ error: "Failed to create visa" }, { status: 500 });
  }
}
