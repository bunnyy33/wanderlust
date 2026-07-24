import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSupplier } from "@/lib/supplier-auth";
import { fetchReservationList } from "@/lib/agency-queries";

// GET /api/supplier/reservations — list reservations that have at least one
// service assigned to the currently-logged-in supplier. Read-only: no
// mutation endpoints exist on the supplier API surface.
//
// Query params:
//   status — filter by bookingStatus (PENDING | SUPPLIER_PENDING | SUPPLIER_CONFIRMED | CUSTOMER_CONFIRMED | COMPLETED | CANCELLED)
//   limit  — 1..100 (default 50)
export async function GET(req: NextRequest) {
  const sup = await getCurrentSupplier();
  if (!sup) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

    // Build the WHERE clause: any service with supplierId == this supplier.
    // Wrap the optional new-table relations in try/catch — on databases
    // where FlightBooking/VisaBooking/ExtraBooking tables haven't been
    // migrated yet, those filters would throw P2021.
    const orClauses: any[] = [
      { tours: { some: { supplierId: sup.id } } },
      { hotels: { some: { supplierId: sup.id } } },
      { transports: { some: { supplierId: sup.id } } },
    ];
    try {
      orClauses.push({ flights: { some: { supplierId: sup.id } } });
      orClauses.push({ visas: { some: { supplierId: sup.id } } });
      orClauses.push({ extras: { some: { supplierId: sup.id } } });
    } catch { /* ignore — table may not exist */ }

    const where: any = { OR: orClauses };
    if (status && status !== "ALL") where.bookingStatus = status;

    const reservations = await fetchReservationList(where, limit);

    // Build a slim, supplier-facing shape: only the services assigned to
    // this supplier are included, and we strip internal pricing (cost rates,
    // margin, etc.) so the supplier can't see the agency's books.
    const out = reservations.map((r: any) => {
      const services: any[] = [];
      for (const t of (r.tours ?? [])) {
        if (t.supplierId === sup.id) {
          services.push({
            type: "TOUR",
            id: t.id,
            name: t.tourName,
            tourDate: t.tourDate?.toISOString?.() ?? t.tourDate,
            pickupTime: t.pickupTime ?? null,
            pickupLocation: t.pickupLocation ?? null,
            pax: `${t.noOfAdults}A${t.noOfChildren ? ` ${t.noOfChildren}C` : ""}`,
            status: t.status,
            confirmationNumber: t.confirmationNumber ?? null,
            comments: t.comments ?? null,
          });
        }
      }
      for (const h of (r.hotels ?? [])) {
        if (h.supplierId === sup.id) {
          services.push({
            type: "HOTEL",
            id: h.id,
            name: h.hotelName,
            roomType: h.roomType,
            mealPlan: h.mealPlan,
            checkInDate: h.checkInDate?.toISOString?.() ?? h.checkInDate,
            checkOutDate: h.checkOutDate?.toISOString?.() ?? h.checkOutDate,
            nights: h.nights,
            noOfRooms: h.noOfRooms,
            pax: `${h.noOfAdults}A${h.noOfChildren ? ` ${h.noOfChildren}C` : ""}`,
            status: h.status,
            confirmationNumber: h.confirmationNumber ?? null,
            comments: h.comments ?? null,
          });
        }
      }
      for (const t of (r.transports ?? [])) {
        if (t.supplierId === sup.id) {
          services.push({
            type: "TRANSPORT",
            id: t.id,
            name: `${t.carType} — ${t.transportType}`,
            pickupDateTime: t.pickupDateTime?.toISOString?.() ?? t.pickupDateTime,
            pickupLocation: t.pickupLocation,
            dropoffLocation: t.dropoffLocation,
            flightNumber: t.flightNumber ?? null,
            noOfPax: t.noOfPax,
            status: t.status,
            contactNumber: t.contactNumber ?? null,
            confirmationNumber: t.confirmationNumber ?? null,
            comments: t.comments ?? null,
          });
        }
      }
      for (const f of (r.flights ?? [])) {
        if (f.supplierId === sup.id) {
          services.push({
            type: "FLIGHT",
            id: f.id,
            name: `${f.airline} ${f.flightNumber || ""}`.trim(),
            departDate: f.departDate?.toISOString?.() ?? f.departDate,
            returnDate: f.returnDate?.toISOString?.() ?? f.returnDate ?? null,
            origin: f.origin,
            destination: f.destination,
            cabinClass: f.cabinClass,
            flightType: f.flightType,
            pax: `${f.noOfAdults}A${f.noOfChildren ? ` ${f.noOfChildren}C` : ""}${f.noOfInfants ? ` ${f.noOfInfants}I` : ""}`,
            status: f.status,
            pnr: f.pnr ?? null,
            confirmationNumber: f.confirmationNumber ?? null,
            comments: f.comments ?? null,
          });
        }
      }
      for (const v of (r.visas ?? [])) {
        if (v.supplierId === sup.id) {
          services.push({
            type: "VISA",
            id: v.id,
            name: `${v.visaType} Visa — ${v.destinationCountry}`,
            travelDate: v.travelDate?.toISOString?.() ?? v.travelDate ?? null,
            applicationDate: v.applicationDate?.toISOString?.() ?? v.applicationDate,
            processingType: v.processingType,
            visaDuration: v.visaDuration ?? null,
            pax: `${v.noOfAdults}A${v.noOfChildren ? ` ${v.noOfChildren}C` : ""}`,
            status: v.status,
            applicationNumber: v.applicationNumber ?? null,
            confirmationNumber: v.confirmationNumber ?? null,
            comments: v.comments ?? null,
          });
        }
      }
      for (const e of (r.extras ?? [])) {
        if (e.supplierId === sup.id) {
          services.push({
            type: "EXTRA",
            id: e.id,
            name: e.extraName,
            extraOption: e.extraOption ?? null,
            serviceDate: e.serviceDate?.toISOString?.() ?? e.serviceDate ?? null,
            quantity: e.quantity,
            status: e.status,
            confirmationNumber: e.confirmationNumber ?? null,
            comments: e.comments ?? null,
          });
        }
      }

      return {
        id: r.id,
        reference: r.reference,
        invoiceNumber: r.invoiceNumber,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        customerPhone: r.customerPhone ?? null,
        bookingStatus: r.bookingStatus,
        orderDate: r.orderDate?.toISOString?.() ?? r.orderDate,
        currency: r.currency,
        totalAmount: r.totalAmount,
        amountPaid: r.amountPaid,
        balanceDue: r.balanceDue,
        serviceCount: services.length,
        services,
      };
    });

    return NextResponse.json({ supplier: { id: sup.id, name: sup.name }, reservations: out, count: out.length });
  } catch (err) {
    console.error("supplier reservations GET error:", err);
    return NextResponse.json({ error: "Failed to load reservations" }, { status: 500 });
  }
}
