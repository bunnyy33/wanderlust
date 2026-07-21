import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeReservation } from "@/lib/agency-types";
import { fetchReservationById } from "@/lib/agency-queries";
import type { ReservationT } from "@/lib/agency-types";

interface ctx { params: Promise<{ id: string }> }

const AGENCY_NAME = "Wanderlust Travel";
const AGENCY_EMAIL = "reservations@wanderlust.travel";
const AGENCY_PHONE = "+971 4 123 4567";
const AGENCY_ADDRESS = "Sheikh Zayed Road, Dubai, UAE";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
}

function buildVoucherHTML(r: ReservationT, serviceType?: string, serviceId?: string): string {
  const cur = r.currency || "AED";
  const services: { type: string; name: string; rows: [string, string][] }[] = [];

  // Filter to single service if requested
  if (serviceType === "tour" && serviceId) {
    const t = r.tours.find(x => x.id === serviceId);
    if (t) services.push({
      type: "TOUR", name: t.tourName,
      rows: [
        ["Tour Date", fmtDate(t.tourDate)],
        ["Tour Option", t.tourOption || "—"],
        ["Transfer", t.transferOption || "—"],
        ["Pickup Location", t.pickupLocation || "—"],
        ["Pickup Time", t.pickupTime || "—"],
        ["Time Slot", t.timeSlot || "—"],
        ["Adults", String(t.noOfAdults)],
        ["Children", String(t.noOfChildren)],
        ["Supplier", t.supplierName || "—"],
        ["Confirmation #", t.confirmationNumber || "—"],
        ["Status", t.status],
        ["Total", `${cur} ${t.totalSell.toFixed(2)}`],
      ],
    });
  } else if (serviceType === "hotel" && serviceId) {
    const h = r.hotels.find(x => x.id === serviceId);
    if (h) services.push({
      type: "HOTEL", name: h.hotelName,
      rows: [
        ["Room Type", h.roomType],
        ["Meal Plan", h.mealPlan],
        ["Check-in", fmtDate(h.checkInDate)],
        ["Check-out", fmtDate(h.checkOutDate)],
        ["Nights", String(h.nights)],
        ["Rooms", String(h.noOfRooms)],
        ["Adults", String(h.noOfAdults)],
        ["Children", String(h.noOfChildren)],
        ["Supplier", h.supplierName || "—"],
        ["Confirmation #", h.confirmationNumber || "—"],
        ["Status", h.status],
        ["Total", `${cur} ${h.totalSell.toFixed(2)}`],
      ],
    });
  } else if (serviceType === "transport" && serviceId) {
    const t = r.transports.find(x => x.id === serviceId);
    if (t) services.push({
      type: "TRANSPORT", name: `${t.carType} — ${t.transportType}`,
      rows: [
        ["Pickup Date/Time", new Date(t.pickupDateTime).toLocaleString("en-GB")],
        ["Pickup Location", t.pickupLocation],
        ["Drop-off Location", t.dropoffLocation],
        ["Flight Number", t.flightNumber || "—"],
        ["No. of Pax", String(t.noOfPax)],
        ["Supplier", t.supplierName || "—"],
        ["Contact Number", t.contactNumber || "—"],
        ["Confirmation #", t.confirmationNumber || "—"],
        ["Status", t.status],
        ["Total", `${cur} ${t.sellRate.toFixed(2)}`],
      ],
    });
  } else if (serviceType === "flight" && serviceId) {
    const f = r.flights.find(x => x.id === serviceId);
    if (f) services.push({
      type: "FLIGHT", name: `${f.airline} ${f.flightNumber || ""}`.trim(),
      rows: [
        ["Departure", new Date(f.departDate).toLocaleString("en-GB")],
        ["Return", f.returnDate ? new Date(f.returnDate).toLocaleString("en-GB") : "—"],
        ["Route", `${f.origin} → ${f.destination}`],
        ["Cabin Class", f.cabinClass],
        ["Flight Type", f.flightType],
        ["Adults", String(f.noOfAdults)],
        ["Children", String(f.noOfChildren)],
        ["Infants", String(f.noOfInfants)],
        ["Supplier", f.supplierName || "—"],
        ["PNR", f.pnr || "—"],
        ["Confirmation #", f.confirmationNumber || "—"],
        ["Status", f.status],
        ["Total", `${cur} ${f.totalSell.toFixed(2)}`],
      ],
    });
  } else if (serviceType === "visa" && serviceId) {
    const v = r.visas.find(x => x.id === serviceId);
    if (v) services.push({
      type: "VISA", name: `${v.visaType} Visa — ${v.destinationCountry}`,
      rows: [
        ["Travel Date", fmtDate(v.travelDate)],
        ["Visa Duration", v.visaDuration || "—"],
        ["Processing Type", v.processingType],
        ["Application Date", fmtDate(v.applicationDate)],
        ["Adults", String(v.noOfAdults)],
        ["Children", String(v.noOfChildren)],
        ["Supplier", v.supplierName || "—"],
        ["Application #", v.applicationNumber || "—"],
        ["Confirmation #", v.confirmationNumber || "—"],
        ["Status", v.status],
        ["Total", `${cur} ${v.totalSell.toFixed(2)}`],
      ],
    });
  } else if (serviceType === "extra" && serviceId) {
    const e = r.extras.find(x => x.id === serviceId);
    if (e) services.push({
      type: "EXTRA", name: e.extraName,
      rows: [
        ["Option", e.extraOption || "—"],
        ["Service Date", fmtDate(e.serviceDate)],
        ["Quantity", String(e.quantity)],
        ["Supplier", e.supplierName || "—"],
        ["Confirmation #", e.confirmationNumber || "—"],
        ["Status", e.status],
        ["Total", `${cur} ${e.totalSell.toFixed(2)}`],
      ],
    });
  } else {
    // Combined voucher — all services with showOnVoucher=true
    for (const t of r.tours.filter(x => x.showOnVoucher)) services.push({ type: "TOUR", name: t.tourName, rows: [["Date", fmtDate(t.tourDate)], ["Pax", `${t.noOfAdults}A ${t.noOfChildren}C`], ["Pickup", `${t.pickupLocation || "—"} ${t.pickupTime || ""}`.trim()], ["Supplier", t.supplierName || "—"], ["Confirm #", t.confirmationNumber || "—"], ["Total", `${cur} ${t.totalSell.toFixed(2)}`]] });
    for (const h of r.hotels.filter(x => x.showOnVoucher)) services.push({ type: "HOTEL", name: h.hotelName, rows: [["Dates", `${fmtDate(h.checkInDate)} → ${fmtDate(h.checkOutDate)}`], ["Room", h.roomType], ["Nights", `${h.nights}N × ${h.noOfRooms}R`], ["Supplier", h.supplierName || "—"], ["Confirm #", h.confirmationNumber || "—"], ["Total", `${cur} ${h.totalSell.toFixed(2)}`]] });
    for (const t of r.transports.filter(x => x.showOnVoucher)) services.push({ type: "TRANSPORT", name: `${t.carType} — ${t.transportType}`, rows: [["Date", fmtDate(t.pickupDateTime)], ["Route", `${t.pickupLocation} → ${t.dropoffLocation}`], ["Pax", String(t.noOfPax)], ["Supplier", t.supplierName || "—"], ["Confirm #", t.confirmationNumber || "—"], ["Total", `${cur} ${t.sellRate.toFixed(2)}`]] });
    for (const f of r.flights.filter(x => x.showOnVoucher)) services.push({ type: "FLIGHT", name: `${f.airline} ${f.flightNumber || ""}`.trim(), rows: [["Date", fmtDate(f.departDate)], ["Route", `${f.origin} → ${f.destination}`], ["Pax", `${f.noOfAdults}A`], ["Confirm #", f.confirmationNumber || f.pnr || "—"], ["Total", `${cur} ${f.totalSell.toFixed(2)}`]] });
    for (const v of r.visas.filter(x => x.showOnVoucher)) services.push({ type: "VISA", name: `${v.visaType} — ${v.destinationCountry}`, rows: [["Travel Date", fmtDate(v.travelDate)], ["Pax", `${v.noOfAdults}A`], ["Confirm #", v.applicationNumber || v.confirmationNumber || "—"], ["Total", `${cur} ${v.totalSell.toFixed(2)}`]] });
    for (const e of r.extras.filter(x => x.showOnVoucher)) services.push({ type: "EXTRA", name: e.extraName, rows: [["Date", fmtDate(e.serviceDate)], ["Qty", String(e.quantity)], ["Total", `${cur} ${e.totalSell.toFixed(2)}`]] });
  }

  const serviceCards = services.map(s => `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="background:#0f766e;color:#fff;font-size:11px;font-weight:bold;padding:4px 12px;border-radius:4px;letter-spacing:1px;">${s.type}</span>
        <h3 style="margin:0;font-size:18px;color:#0f766e;">${s.name}</h3>
      </div>
      <table style="width:100%;font-size:13px;">
        ${s.rows.map(([label, val]) => `<tr><td style="color:#64748b;padding:4px 12px 4px 0;width:160px;">${label}</td><td style="font-weight:600;padding:4px 0;">${val}</td></tr>`).join("")}
      </table>
    </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Voucher — ${r.reference}</title>
<style>@media print{.no-print{display:none}body{margin:0}}</style>
</head><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f766e;color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:24px;font-weight:bold;">${AGENCY_NAME}</div>
        <div style="font-size:12px;opacity:0.85;margin-top:4px;">${AGENCY_ADDRESS} · ${AGENCY_PHONE}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:18px;font-weight:bold;letter-spacing:1px;">VOUCHER</div>
        <div style="font-size:12px;opacity:0.85;margin-top:4px;">${r.reference}</div>
      </div>
    </div>
    <div style="padding:24px 32px;">
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#64748b;width:140px;">Customer:</td><td style="font-weight:600;">${r.customerName}</td>
              <td style="color:#64748b;width:140px;">Booking Ref:</td><td style="font-weight:600;">${r.reference}</td></tr>
          <tr><td style="color:#64748b;">Invoice #:</td><td style="font-weight:600;">${r.invoiceNumber}</td>
              <td style="color:#64748b;">Status:</td><td style="font-weight:600;">${r.bookingStatus}</td></tr>
        </table>
      </div>
      ${serviceCards || '<p style="text-align:center;color:#94a3b8;">No voucherable services found.</p>'}
      <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;font-size:12px;color:#92400e;">
        <strong>Terms &amp; Conditions:</strong> All services are subject to the supplier's terms &amp; cancellation policy. Cancellations within 48 hours may be non-refundable. No-shows charged in full. Please carry valid photo ID. For changes, contact ${AGENCY_EMAIL} at least 24 hours in advance.
      </div>
      <div style="text-align:center;margin-top:24px;">
        <button class="no-print" onclick="window.print()" style="background:#0f766e;color:#fff;border:none;padding:10px 32px;border-radius:6px;font-size:14px;cursor:pointer;">Print Voucher</button>
      </div>
    </div>
  </div>
</body></html>`;
}

// GET /api/agency/reservations/[id]/voucher
export async function GET(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const reservation = await fetchReservationById(id);
    if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const serviceType = searchParams.get("serviceType") || undefined;
    const serviceId = searchParams.get("serviceId") || undefined;

    const serialized = serializeReservation(reservation);
    const html = buildVoucherHTML(serialized, serviceType, serviceId);
    return NextResponse.json({ html, reservation: serialized });
  } catch (err) {
    console.error("agency voucher GET error:", err);
    return NextResponse.json({ error: "Failed to generate voucher" }, { status: 500 });
  }
}
