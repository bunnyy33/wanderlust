import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeSupplier } from "@/lib/agency-types";

interface ctx {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name);
    if (body.type !== undefined) data.type = String(body.type);
    if (body.contactPerson !== undefined)
      data.contactPerson = body.contactPerson ? String(body.contactPerson) : null;
    if (body.email !== undefined) data.email = body.email ? String(body.email) : null;
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone) : null;
    if (body.whatsapp !== undefined)
      data.whatsapp = body.whatsapp ? String(body.whatsapp) : null;
    if (body.address !== undefined)
      data.address = body.address ? String(body.address) : null;
    if (body.city !== undefined) data.city = body.city ? String(body.city) : null;
    if (body.country !== undefined)
      data.country = body.country ? String(body.country) : null;
    if (body.accessCode !== undefined)
      data.accessCode = body.accessCode ? String(body.accessCode) : null;
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.paymentTerms !== undefined)
      data.paymentTerms = body.paymentTerms ? String(body.paymentTerms) : null;
    if (body.markupType !== undefined) data.markupType = String(body.markupType);
    if (body.markupValue !== undefined) data.markupValue = Number(body.markupValue);
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.rating !== undefined)
      data.rating = Math.min(5, Math.max(1, Number(body.rating)));

    const updated = await db.supplier.update({ where: { id }, data });
    return NextResponse.json({ supplier: serializeSupplier(updated) });
  } catch (err) {
    console.error("agency supplier PUT error:", err);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
    await db.supplier.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency supplier DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
