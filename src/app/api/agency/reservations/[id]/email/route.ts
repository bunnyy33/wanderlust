import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeReservation } from "@/lib/agency-types";
import { fetchReservationById } from "@/lib/agency-queries";
import type { ReservationT } from "@/lib/agency-types";

interface ctx { params: Promise<{ id: string }> }

const AGENCY_NAME = process.env.AGENCY_NAME || "Wanderlust Travel";
const AGENCY_EMAIL = process.env.AGENCY_EMAIL || "reservations@wanderlust.travel";
const AGENCY_PHONE = process.env.AGENCY_PHONE || "+971 4 123 4567";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
}
function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return String(d); }
}

interface ServiceLine {
  type: string;
  name: string;
  date: string;
  pax: string;
  pickup: string;
  supplier: string;
  confirm: string;
  price: string;
  details: string;
}

function collectServices(r: ReservationT, filter?: { tours?: string[]; hotels?: string[]; transports?: string[]; flights?: string[]; visas?: string[]; extras?: string[] }): ServiceLine[] {
  const lines: ServiceLine[] = [];
  const cur = r.currency || "AED";

  for (const t of (r.tours || [])) {
    if (filter?.tours && !filter.tours.includes(t.id)) continue;
    lines.push({
      type: "Tour", name: t.tourName, date: fmtDate(t.tourDate),
      pax: `${t.noOfAdults} Adult${t.noOfAdults !== 1 ? "s" : ""}${t.noOfChildren ? `, ${t.noOfChildren} Child` : ""}`,
      pickup: t.pickupLocation ? `${t.pickupLocation}${t.pickupTime ? ` @ ${t.pickupTime}` : ""}` : "—",
      supplier: t.supplierName ?? "—", confirm: t.confirmationNumber ?? "—",
      price: `${cur} ${t.totalSell.toFixed(2)}`,
      details: `Tour Option: ${t.tourOption || "—"} | Transfer: ${t.transferOption || "—"} | Time Slot: ${t.timeSlot || "—"}`,
    });
  }
  for (const h of (r.hotels || [])) {
    if (filter?.hotels && !filter.hotels.includes(h.id)) continue;
    lines.push({
      type: "Hotel", name: h.hotelName, date: `${fmtDate(h.checkInDate)} → ${fmtDate(h.checkOutDate)}`,
      pax: `${h.noOfAdults} Adult${h.noOfAdults !== 1 ? "s" : ""}${h.noOfChildren ? `, ${h.noOfChildren} Child` : ""}`,
      pickup: `Room: ${h.roomType} | ${h.nights}N × ${h.noOfRooms}R`,
      supplier: h.supplierName ?? "—", confirm: h.confirmationNumber ?? "—",
      price: `${cur} ${h.totalSell.toFixed(2)}`,
      details: `Meal Plan: ${h.mealPlan}`,
    });
  }
  for (const t of (r.transports || [])) {
    if (filter?.transports && !filter.transports.includes(t.id)) continue;
    lines.push({
      type: "Transport", name: `${t.carType} — ${t.transportType}`, date: fmtDateTime(t.pickupDateTime),
      pax: `${t.noOfPax} Pax`,
      pickup: `${t.pickupLocation} → ${t.dropoffLocation}${t.flightNumber ? ` | Flight: ${t.flightNumber}` : ""}`,
      supplier: t.supplierName ?? "—", confirm: t.confirmationNumber ?? "—",
      price: `${cur} ${t.sellRate.toFixed(2)}`,
      details: `Contact: ${t.contactNumber || "—"}`,
    });
  }
  for (const f of (r.flights || [])) {
    if (filter?.flights && !filter.flights.includes(f.id)) continue;
    lines.push({
      type: "Flight", name: `${f.airline} ${f.flightNumber || ""}`.trim(), date: fmtDateTime(f.departDate),
      pax: `${f.noOfAdults}A${f.noOfChildren ? ` ${f.noOfChildren}C` : ""}${f.noOfInfants ? ` ${f.noOfInfants}I` : ""}`,
      pickup: `${f.origin} → ${f.destination} | ${f.cabinClass}`,
      supplier: f.supplierName ?? "—", confirm: f.confirmationNumber ?? f.pnr ?? "—",
      price: `${cur} ${f.totalSell.toFixed(2)}`,
      details: `Flight Type: ${f.flightType}`,
    });
  }
  for (const v of (r.visas || [])) {
    if (filter?.visas && !filter.visas.includes(v.id)) continue;
    lines.push({
      type: "Visa", name: `${v.visaType} Visa — ${v.destinationCountry}`, date: fmtDate(v.travelDate),
      pax: `${v.noOfAdults}A${v.noOfChildren ? ` ${v.noOfChildren}C` : ""}`,
      pickup: `Processing: ${v.processingType}${v.visaDuration ? ` | Duration: ${v.visaDuration}` : ""}`,
      supplier: v.supplierName ?? "—", confirm: v.applicationNumber ?? v.confirmationNumber ?? "—",
      price: `${cur} ${v.totalSell.toFixed(2)}`,
      details: `Applied: ${fmtDate(v.applicationDate)}`,
    });
  }
  for (const e of (r.extras || [])) {
    if (filter?.extras && !filter.extras.includes(e.id)) continue;
    lines.push({
      type: "Extra", name: e.extraName, date: fmtDate(e.serviceDate),
      pax: `Qty: ${e.quantity}`,
      pickup: e.extraOption || "—",
      supplier: e.supplierName ?? "—", confirm: e.confirmationNumber ?? "—",
      price: `${cur} ${e.totalSell.toFixed(2)}`,
      details: "",
    });
  }
  return lines;
}

function buildSupplierEmail(r: ReservationT, lines: ServiceLine[]): string {
  const servicesRows = lines.map(l => `
    <tr>
      <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">${l.type}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.name}<br><span style="color:#64748b;font-size:12px;">${l.details}</span></td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.date}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.pax}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.pickup}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.confirm}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supplier Confirmation — ${r.reference}</title></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#0f766e;color:#fff;padding:24px 32px;">
      <div style="font-size:22px;font-weight:bold;">${AGENCY_NAME}</div>
      <div style="font-size:13px;opacity:0.85;margin-top:4px;">${AGENCY_EMAIL} · ${AGENCY_PHONE}</div>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Dear partner,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">Please confirm the following services for our mutual customer. Booking details are below.</p>

      <!-- Customer info -->
      <div style="background:#f1f5f9;border-radius:6px;padding:16px;margin-bottom:24px;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#64748b;width:140px;">Lead Passenger:</td><td style="font-weight:600;">${r.customerName}</td></tr>
          <tr><td style="color:#64748b;">Order Number:</td><td style="font-weight:600;">${r.reference}</td></tr>
          <tr><td style="color:#64748b;">Passenger's Phone:</td><td style="font-weight:600;">${r.customerPhone || "—"}</td></tr>
          <tr><td style="color:#64748b;">Passenger's Email:</td><td style="font-weight:600;">${r.customerEmail}</td></tr>
        </table>
      </div>

      <!-- Services table -->
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <thead>
          <tr style="background:#0f766e;color:#fff;">
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;">Type</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;">Service</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;">Date</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;">Pax</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;">Pickup / Details</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;">Confirm #</th>
          </tr>
        </thead>
        <tbody>${servicesRows}</tbody>
      </table>

      <!-- Confirm button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="mailto:${AGENCY_EMAIL}?subject=RE: Confirm ${r.reference}" style="display:inline-block;background:#10b981;color:#fff;font-weight:bold;font-size:15px;padding:12px 48px;border-radius:6px;text-decoration:none;">Confirm</a>
      </div>

      <p style="margin:24px 0 0;font-size:14px;">Thank you,</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f766e;">${AGENCY_NAME} Team</p>
    </div>
    <!-- Footer -->
    <div style="background:#f1f5f9;padding:16px 32px;font-size:12px;color:#94a3b8;text-align:center;">
      This is an automated confirmation request from ${AGENCY_NAME}. Please reply to confirm availability.
    </div>
  </div>
</body></html>`;
}

function buildCustomerEmail(r: ReservationT, lines: ServiceLine[]): string {
  const servicesRows = lines.map(l => `
    <tr>
      <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">${l.type}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.name}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.date}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.pax}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;">${l.pickup}</td>
    </tr>`).join("");

  const cur = r.currency || "AED";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Your Booking Confirmation — ${r.reference}</title></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f766e;color:#fff;padding:24px 32px;">
      <div style="font-size:22px;font-weight:bold;">${AGENCY_NAME}</div>
      <div style="font-size:13px;opacity:0.85;margin-top:4px;">${AGENCY_EMAIL} · ${AGENCY_PHONE}</div>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f766e;">Booking Confirmation</h1>
      <p style="margin:0 0 24px;font-size:15px;">Dear ${r.customerName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">Thank you for booking with ${AGENCY_NAME}. We are pleased to confirm your reservation. Below are the details of your booking:</p>

      <div style="background:#f1f5f9;border-radius:6px;padding:16px;margin-bottom:24px;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#64748b;width:140px;">Booking Reference:</td><td style="font-weight:600;">${r.reference}</td></tr>
          <tr><td style="color:#64748b;">Invoice Number:</td><td style="font-weight:600;">${r.invoiceNumber}</td></tr>
          <tr><td style="color:#64748b;">Total Amount:</td><td style="font-weight:600;">${cur} ${r.totalAmount.toFixed(2)}</td></tr>
          <tr><td style="color:#64748b;">Amount Paid:</td><td style="font-weight:600;color:#10b981;">${cur} ${r.amountPaid.toFixed(2)}</td></tr>
          <tr><td style="color:#64748b;">Balance Due:</td><td style="font-weight:600;color:${r.balanceDue > 0 ? "#ef4444" : "#10b981"};">${cur} ${r.balanceDue.toFixed(2)}</td></tr>
        </table>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <thead>
          <tr style="background:#0f766e;color:#fff;">
            <th style="padding:8px;text-align:left;">Type</th>
            <th style="padding:8px;text-align:left;">Service</th>
            <th style="padding:8px;text-align:left;">Date</th>
            <th style="padding:8px;text-align:left;">Pax</th>
            <th style="padding:8px;text-align:left;">Pickup / Details</th>
          </tr>
        </thead>
        <tbody>${servicesRows}</tbody>
      </table>

      <p style="margin:24px 0 0;font-size:14px;">We look forward to serving you.</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f766e;">${AGENCY_NAME} Team</p>
    </div>
    <div style="background:#f1f5f9;padding:16px 32px;font-size:12px;color:#94a3b8;text-align:center;">
      Need help? Contact us at ${AGENCY_EMAIL} or ${AGENCY_PHONE}. This is an automated email — please do not reply directly.
    </div>
  </div>
</body></html>`;
}

// Try to dynamically load Resend only if a key is set.
async function getResendClient(): Promise<any | null> {
  if (!process.env.RESEND_API_KEY) return null;
  try {
    const dynamicImport = new Function("spec", "return import(spec)");
    const mod: any = await dynamicImport("resend");
    const Resend = mod.default ?? mod.Resend ?? mod;
    return new Resend(process.env.RESEND_API_KEY);
  } catch { return null; }
}

// POST /api/agency/reservations/[id]/email
export async function POST(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const reservation = await fetchReservationById(id);
    if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

    const body = await req.json();
    const type = String(body.type ?? "");
    if (!["SUPPLIER_CONFIRMATION", "CUSTOMER_CONFIRMATION"].includes(type)) {
      return NextResponse.json({ error: "type must be SUPPLIER_CONFIRMATION or CUSTOMER_CONFIRMATION" }, { status: 400 });
    }

    const serialized = serializeReservation(reservation);
    const filter = body.serviceIds as { tours?: string[]; hotels?: string[]; transports?: string[]; flights?: string[]; visas?: string[]; extras?: string[] } | undefined;
    const lines = collectServices(serialized, filter);

    if (type === "SUPPLIER_CONFIRMATION" && lines.length === 0) {
      return NextResponse.json({ error: "No services selected" }, { status: 400 });
    }

    const html = type === "SUPPLIER_CONFIRMATION" ? buildSupplierEmail(serialized, lines) : buildCustomerEmail(serialized, lines);
    const subject = type === "SUPPLIER_CONFIRMATION"
      ? `CONFIRM: Services — ${serialized.customerName} — ${serialized.reference}`
      : `Your Booking Confirmation — ${serialized.reference}`;

    const resend = await getResendClient();
    let sent = false;
    let logged = false;
    const results: any[] = [];

    if (type === "SUPPLIER_CONFIRMATION") {
      // Group by supplier
      const bySupplier = new Map<string, { name: string | null; email: string | null }>();
      for (const l of lines) {
        if (l.supplier && l.supplier !== "—") {
          if (!bySupplier.has(l.supplier)) bySupplier.set(l.supplier, { name: l.supplier, email: null });
        }
      }
      const supplierIds = Array.from(bySupplier.keys());
      if (supplierIds.length > 0) {
        const suppliers = await db.supplier.findMany({ where: { id: { in: supplierIds } } });
        for (const s of suppliers) {
          const entry = bySupplier.get(s.id);
          if (entry) entry.email = s.email;
        }
      }

      for (const [sid, info] of bySupplier) {
        if (resend && info.email) {
          try {
            await resend.emails.send({ from: AGENCY_EMAIL, to: info.email, subject, html });
            sent = true;
            results.push({ to: info.email, subject, sent: true, logged: false });
          } catch (e: any) {
            results.push({ to: info.email, subject, sent: false, logged: false, error: e.message });
          }
        } else {
          results.push({ to: info.email ?? "no-email", subject, sent: false, logged: true });
        }
      }
    } else {
      // Customer confirmation
      if (resend && serialized.customerEmail) {
        try {
          await resend.emails.send({ from: AGENCY_EMAIL, to: serialized.customerEmail, subject, html });
          sent = true;
          results.push({ to: serialized.customerEmail, subject, sent: true, logged: false });
        } catch (e: any) {
          results.push({ to: serialized.customerEmail, subject, sent: false, logged: false, error: e.message });
        }
      } else {
        results.push({ to: serialized.customerEmail, subject, sent: false, logged: true });
      }
    }

    // Log to EmailLog
    try {
      await db.emailLog.create({
        data: {
          toEmail: results.map(r => r.to).filter(Boolean).join(", ") || "—",
          subject,
          body: html,
          type: type === "SUPPLIER_CONFIRMATION" ? "MANUAL" : "BOOKING_CONFIRMATION",
          status: sent ? "SENT" : "PENDING",
          relatedRef: serialized.reference,
        },
      });
      logged = true;
    } catch { /* EmailLog table may not exist */ }

    return NextResponse.json({ ok: true, results, preview: html, logged, sent });
  } catch (err) {
    console.error("agency email POST error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
