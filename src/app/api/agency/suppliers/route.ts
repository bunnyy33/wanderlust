import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeSupplier } from "@/lib/agency-types";

// GET /api/agency/suppliers — list suppliers (optionally filter by type)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const activeOnly = searchParams.get("active") === "1";

    const where: any = {};
    if (type && type !== "ALL") where.type = type;
    if (activeOnly) where.active = true;

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ suppliers: suppliers.map(serializeSupplier) });
  } catch (err) {
    console.error("agency suppliers GET error:", err);
    return NextResponse.json({ error: "Failed to load suppliers" }, { status: 500 });
  }
}

// POST /api/agency/suppliers — create supplier
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const created = await db.supplier.create({
      data: {
        name,
        type: String(body.type ?? "TOUR"),
        contactPerson: body.contactPerson ? String(body.contactPerson) : null,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        whatsapp: body.whatsapp ? String(body.whatsapp) : null,
        address: body.address ? String(body.address) : null,
        city: body.city ? String(body.city) : null,
        country: body.country ? String(body.country) : null,
        accessCode: body.accessCode ? String(body.accessCode) : null,
        currency: String(body.currency ?? "AED"),
        paymentTerms: body.paymentTerms ? String(body.paymentTerms) : null,
        markupType: String(body.markupType ?? "PERCENT"),
        markupValue: Number(body.markupValue ?? 20),
        active: Boolean(body.active ?? true),
        rating: Math.min(5, Math.max(1, Number(body.rating ?? 5))),
      },
    });
    return NextResponse.json({ supplier: serializeSupplier(created) });
  } catch (err) {
    console.error("agency supplier POST error:", err);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
