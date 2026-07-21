import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeReservation } from "@/lib/agency-types";
import { fetchReservationById } from "@/lib/agency-queries";
import type { ReservationT } from "@/lib/agency-types";

interface ctx { params: Promise<{ id: string }> }

const AGENCY_NAME = "Wanderlust Travel LLC";
const AGENCY_EMAIL = "reservations@wanderlust.travel";
const AGENCY_PHONE = "+971 4 123 4567";
const AGENCY_ADDRESS = "Sheikh Zayed Road, Dubai, UAE";
const AGENCY_TRN = "100-XXXX-XXXX-XXXX";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
}

function buildInvoiceHTML(r: ReservationT): string {
  const cur = r.currency || "AED";
  const isTaxable = r.invoiceType === "TAXABLE";

  // Build line items
  const items: { desc: string; qty: string; unit: string; total: string }[] = [];
  for (const t of r.tours) items.push({ desc: `Tour: ${t.tourName}${t.tourOption ? ` — ${t.tourOption}` : ""} | ${fmtDate(t.tourDate)} | ${t.noOfAdults}A ${t.noOfChildren}C`, qty: "1", unit: `${cur} ${t.totalSell.toFixed(2)}`, total: `${cur} ${t.totalSell.toFixed(2)}` });
  for (const h of r.hotels) items.push({ desc: `Hotel: ${h.hotelName} — ${h.roomType} | ${fmtDate(h.checkInDate)} → ${fmtDate(h.checkOutDate)} | ${h.nights}N × ${h.noOfRooms}R`, qty: "1", unit: `${cur} ${h.totalSell.toFixed(2)}`, total: `${cur} ${h.totalSell.toFixed(2)}` });
  for (const t of r.transports) items.push({ desc: `Transport: ${t.carType} — ${t.transportType} | ${fmtDate(t.pickupDateTime)} | ${t.pickupLocation} → ${t.dropoffLocation}`, qty: "1", unit: `${cur} ${t.sellRate.toFixed(2)}`, total: `${cur} ${t.sellRate.toFixed(2)}` });
  for (const f of r.flights) items.push({ desc: `Flight: ${f.airline} ${f.flightNumber || ""} | ${fmtDate(f.departDate)} | ${f.origin} → ${f.destination} | ${f.cabinClass}`, qty: "1", unit: `${cur} ${f.totalSell.toFixed(2)}`, total: `${cur} ${f.totalSell.toFixed(2)}` });
  for (const v of r.visas) items.push({ desc: `Visa: ${v.visaType} — ${v.destinationCountry} | ${fmtDate(v.travelDate)} | ${v.noOfAdults}A ${v.noOfChildren}C`, qty: "1", unit: `${cur} ${v.totalSell.toFixed(2)}`, total: `${cur} ${v.totalSell.toFixed(2)}` });
  for (const e of r.extras) items.push({ desc: `Extra: ${e.extraName}${e.extraOption ? ` — ${e.extraOption}` : ""} | Qty: ${e.quantity}`, qty: String(e.quantity), unit: `${cur} ${e.sellRate.toFixed(2)}`, total: `${cur} ${e.totalSell.toFixed(2)}` });

  const itemRows = items.map((item, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${item.desc}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${item.total}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tax Invoice — ${r.invoiceNumber}</title>
<style>@media print{.no-print{display:none}body{margin:0}}</style>
</head><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;">
  <div style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#0f766e;color:#fff;padding:28px 32px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:26px;font-weight:bold;">${AGENCY_NAME}</div>
          <div style="font-size:12px;opacity:0.85;margin-top:6px;line-height:1.6;">
            ${AGENCY_ADDRESS}<br>${AGENCY_PHONE} · ${AGENCY_EMAIL}<br>
            TRN: ${AGENCY_TRN}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:bold;letter-spacing:2px;">TAX INVOICE</div>
          <div style="font-size:14px;margin-top:6px;opacity:0.85;">${r.invoiceNumber}</div>
        </div>
      </div>
    </div>

    <!-- Bill To + Invoice info -->
    <div style="padding:24px 32px;display:flex;justify-content:space-between;gap:32px;">
      <div style="flex:1;">
        <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Bill To</div>
        <div style="font-size:15px;font-weight:600;">${r.customerName}</div>
        <div style="font-size:13px;color:#475569;margin-top:4px;">${r.customerEmail}</div>
        ${r.customerPhone ? `<div style="font-size:13px;color:#475569;">${r.customerPhone}</div>` : ""}
      </div>
      <div style="flex:1;text-align:right;">
        <table style="font-size:13px;width:100%;">
          <tr><td style="color:#64748b;padding:2px 0;">Invoice #:</td><td style="font-weight:600;padding:2px 0 2px 12px;">${r.invoiceNumber}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0;">Booking Ref:</td><td style="font-weight:600;padding:2px 0 2px 12px;">${r.reference}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0;">Invoice Date:</td><td style="font-weight:600;padding:2px 0 2px 12px;">${r.invoiceDate ? fmtDate(r.invoiceDate) : fmtDate(r.orderDate)}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0;">Invoice Type:</td><td style="font-weight:600;padding:2px 0 2px 12px;">${isTaxable ? "Taxable (5% VAT)" : r.invoiceType}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0;">Status:</td><td style="font-weight:600;padding:2px 0 2px 12px;">${r.bookingStatus}</td></tr>
        </table>
      </div>
    </div>

    <!-- Line items -->
    <div style="padding:0 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#0f766e;color:#fff;">
            <th style="padding:10px 12px;text-align:left;width:40px;">#</th>
            <th style="padding:10px 12px;text-align:left;">Description</th>
            <th style="padding:10px 12px;text-align:center;width:60px;">Qty</th>
            <th style="padding:10px 12px;text-align:right;width:100px;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;width:110px;">Line Total</th>
          </tr>
        </thead>
        <tbody>${itemRows || '<tr><td colspan="5" style="padding:24px;text-align:center;color:#94a3b8;">No services added to this booking yet.</td></tr>'}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:24px 32px;display:flex;justify-content:flex-end;">
      <table style="font-size:14px;width:300px;">
        <tr><td style="padding:6px 0;color:#64748b;">Subtotal:</td><td style="padding:6px 0;text-align:right;font-weight:600;">${cur} ${r.subTotal.toFixed(2)}</td></tr>
        ${isTaxable ? `<tr><td style="padding:6px 0;color:#64748b;">VAT (5%):</td><td style="padding:6px 0;text-align:right;font-weight:600;">${cur} ${r.vatAmount.toFixed(2)}</td></tr>` : ""}
        <tr style="border-top:2px solid #0f766e;"><td style="padding:10px 0;font-weight:bold;color:#0f766e;">Total:</td><td style="padding:10px 0;text-align:right;font-weight:bold;font-size:16px;color:#0f766e;">${cur} ${r.totalAmount.toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0;color:#10b981;">Amount Paid:</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#10b981;">${cur} ${r.amountPaid.toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0;color:${r.balanceDue > 0 ? "#ef4444" : "#10b981"};font-weight:bold;">Balance Due:</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:${r.balanceDue > 0 ? "#ef4444" : "#10b981"};">${cur} ${r.balanceDue.toFixed(2)}</td></tr>
      </table>
    </div>

    <!-- Payment instructions -->
    <div style="padding:0 32px 24px;">
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;">
        <h4 style="margin:0 0 8px;font-size:13px;color:#0f766e;">PAYMENT INSTRUCTIONS</h4>
        <div style="font-size:12px;color:#475569;line-height:1.6;">
          Bank: Dubai Islamic Bank · Account: Wanderlust Travel LLC · IBAN: AE00 XXXX XXXX XXXX<br>
          Or pay by card via the secure payment link sent to your email.<br>
          Please include invoice number <strong>${r.invoiceNumber}</strong> as reference.
        </div>
      </div>
    </div>

    <!-- Terms -->
    <div style="padding:0 32px 24px;">
      <div style="font-size:11px;color:#94a3b8;line-height:1.6;">
        <strong>Terms &amp; Conditions:</strong> All services subject to supplier terms &amp; cancellation policies. Cancellations within 48 hours may be non-refundable. No-shows charged in full. Prices valid for 7 days from invoice date. ${AGENCY_NAME} acts as a booking agent. VAT 5% applied per UAE Federal Tax Authority regulations (TRN: ${AGENCY_TRN}).
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f766e;color:#fff;padding:16px 32px;font-size:12px;text-align:center;opacity:0.9;">
      ${AGENCY_NAME} · ${AGENCY_EMAIL} · ${AGENCY_PHONE} | Thank you for your business!
    </div>

    <div style="text-align:center;padding:16px;">
      <button class="no-print" onclick="window.print()" style="background:#0f766e;color:#fff;border:none;padding:10px 32px;border-radius:6px;font-size:14px;cursor:pointer;">Print Invoice</button>
    </div>
  </div>
</body></html>`;
}

// GET /api/agency/reservations/[id]/invoice
export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const reservation = await fetchReservationById(id);
    if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    const serialized = serializeReservation(reservation);
    const html = buildInvoiceHTML(serialized);
    return NextResponse.json({ html, reservation: serialized });
  } catch (err) {
    console.error("agency invoice GET error:", err);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
