import { NextResponse } from "next/server";
import { getCurrentSupplier } from "@/lib/supplier-auth";

// GET /api/supplier/me — current supplier info (read-only)
export async function GET() {
  const sup = await getCurrentSupplier();
  if (!sup) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    supplier: {
      id: sup.id,
      name: sup.name,
      type: sup.type,
      contactPerson: sup.contactPerson ?? null,
      email: sup.email ?? null,
      phone: sup.phone ?? null,
      whatsapp: sup.whatsapp ?? null,
      city: sup.city ?? null,
      country: sup.country ?? null,
      currency: sup.currency,
      paymentTerms: sup.paymentTerms ?? null,
    },
  });
}
