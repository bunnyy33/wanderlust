import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeExtraBooking } from "@/lib/agency-types";
import { calcExtraPricing } from "@/lib/agency-pricing";
import { recalcReservation } from "@/lib/agency-recalc";

interface ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const extras = await db.extraBooking.findMany({ where: { reservationId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ extras: extras.map(serializeExtraBooking) });
  } catch (err) {
    console.error("agency extras GET error:", err);
    return NextResponse.json({ error: "Failed to load extras" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const extraName = String(body.extraName ?? "").trim();
    if (!extraName) {
      return NextResponse.json({ error: "extraName is required" }, { status: 400 });
    }

    const quantity = Math.max(1, Number(body.quantity ?? 1));
    const costRate = Number(body.costRate ?? 0);
    const sellRate = Number(body.sellRate ?? 0);
    const pricing = calcExtraPricing({ costRate, sellRate, quantity });

    let supplierName: string | null = null;
    if (body.supplierId) {
      const sup = await db.supplier.findUnique({ where: { id: String(body.supplierId) } });
      supplierName = sup?.name ?? null;
    }

    const created = await db.extraBooking.create({
      data: {
        reservationId: id,
        extraName,
        extraOption: body.extraOption ? String(body.extraOption) : null,
        serviceDate: body.serviceDate ? new Date(body.serviceDate) : null,
        quantity,
        supplierId: body.supplierId ? String(body.supplierId) : null,
        supplierName,
        confirmationNumber: body.confirmationNumber ? String(body.confirmationNumber) : null,
        status: String(body.status ?? "INITIATED"),
        comments: body.comments ? String(body.comments) : null,
        costRate, totalCost: pricing.totalCost,
        sellRate, totalSell: pricing.totalSell,
        showOnVoucher: Boolean(body.showOnVoucher ?? true),
      },
    });
    await recalcReservation(id);
    return NextResponse.json({ extra: serializeExtraBooking(created) });
  } catch (err) {
    console.error("agency extras POST error:", err);
    return NextResponse.json({ error: "Failed to create extra" }, { status: 500 });
  }
}
