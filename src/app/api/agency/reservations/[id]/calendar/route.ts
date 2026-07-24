import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeReservation } from "@/lib/agency-types";
import { fetchReservationById } from "@/lib/agency-queries";
import type { ReservationT } from "@/lib/agency-types";

interface ctx { params: Promise<{ id: string }> }

// iCal (RFC 5545) export for a single reservation. Each service becomes a
// VEVENT so the agent can drop the whole booking into Outlook/Google Cal.
//
//   Tours       → DTSTART=tourDate+pickupTime, DURATION=durationHours (or 4h)
//   Hotels      → all-day DTSTART=checkIn, DTEND=checkOut (DATE values)
//   Transports  → DTSTART=pickupDateTime, DURATION=1h
//   Flights     → DTSTART=departDate, DURATION=3h

const PRODID = "-//Wanderlust Travel//Reservation Calendar//EN";

/** Escape a text value per RFC 5545 §3.3.11. */
function escText(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Format a Date as UTC date-time: YYYYMMDDTHHMMSSZ */
function fmtUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Format a Date as iCal DATE (all-day): YYYYMMDD */
function fmtDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

/** Build a DTSTART line for a tour — combines tourDate + pickupTime "HH:MM". */
function tourStart(t: ReservationT["tours"][number]): Date {
  const base = new Date(t.tourDate);
  const time = t.pickupTime || "09:00";
  const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
  if (!isNaN(hh)) base.setUTCHours(hh);
  if (!isNaN(mm)) base.setUTCMinutes(mm);
  return base;
}

interface VEvent {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

function collectEvents(r: ReservationT): VEvent[] {
  const events: VEvent[] = [];
  const ref = r.reference;

  for (const t of r.tours) {
    const start = tourStart(t);
    const durationHours = 4; // default; could read from catalog later
    const end = new Date(start.getTime() + durationHours * 3600_000);
    const pax = `${t.noOfAdults} Adult${t.noOfAdults !== 1 ? "s" : ""}${t.noOfChildren ? `, ${t.noOfChildren} Child${t.noOfChildren !== 1 ? "ren" : ""}` : ""}`;
    events.push({
      uid: `${ref}-tour-${t.id}@wanderlust.travel`,
      summary: `Tour: ${t.tourName}`,
      description: [
        `Booking: ${ref}`,
        t.tourOption ? `Option: ${t.tourOption}` : null,
        t.pickupLocation ? `Pickup: ${t.pickupLocation}${t.pickupTime ? ` @ ${t.pickupTime}` : ""}` : null,
        `Pax: ${pax}`,
        t.supplierName ? `Supplier: ${t.supplierName}` : null,
        t.confirmationNumber ? `Confirmation #: ${t.confirmationNumber}` : null,
        `Status: ${t.status}`,
      ].filter(Boolean).join("\\n"),
      location: t.pickupLocation || undefined,
      start,
      end,
    });
  }

  for (const h of r.hotels) {
    const start = new Date(h.checkInDate);
    const end = new Date(h.checkOutDate);
    events.push({
      uid: `${ref}-hotel-${h.id}@wanderlust.travel`,
      summary: `Hotel: ${h.hotelName} — ${h.roomType}`,
      description: [
        `Booking: ${ref}`,
        `Room: ${h.roomType}`,
        `Meal Plan: ${h.mealPlan}`,
        `Nights: ${h.nights} × ${h.noOfRooms} room(s)`,
        `${h.noOfAdults} Adult${h.noOfAdults !== 1 ? "s" : ""}${h.noOfChildren ? `, ${h.noOfChildren} Child` : ""}`,
        h.supplierName ? `Supplier: ${h.supplierName}` : null,
        h.confirmationNumber ? `Confirmation #: ${h.confirmationNumber}` : null,
        `Status: ${h.status}`,
      ].filter(Boolean).join("\\n"),
      location: h.hotelName,
      start,
      end,
      allDay: true,
    });
  }

  for (const t of r.transports) {
    const start = new Date(t.pickupDateTime);
    const end = new Date(start.getTime() + 3600_000); // +1h default
    events.push({
      uid: `${ref}-transport-${t.id}@wanderlust.travel`,
      summary: `Transfer: ${t.carType} — ${t.pickupLocation} → ${t.dropoffLocation}`,
      description: [
        `Booking: ${ref}`,
        `Type: ${t.transportType}`,
        `Pickup: ${t.pickupLocation}`,
        `Drop-off: ${t.dropoffLocation}`,
        t.flightNumber ? `Flight #: ${t.flightNumber}` : null,
        `Pax: ${t.noOfPax}`,
        t.supplierName ? `Supplier: ${t.supplierName}` : null,
        t.contactNumber ? `Contact: ${t.contactNumber}` : null,
        t.confirmationNumber ? `Confirmation #: ${t.confirmationNumber}` : null,
        `Status: ${t.status}`,
      ].filter(Boolean).join("\\n"),
      location: t.pickupLocation || undefined,
      start,
      end,
    });
  }

  for (const f of r.flights) {
    const start = new Date(f.departDate);
    const end = new Date(start.getTime() + 3 * 3600_000); // +3h default
    events.push({
      uid: `${ref}-flight-${f.id}@wanderlust.travel`,
      summary: `Flight: ${f.airline} ${f.flightNumber || ""} — ${f.origin} → ${f.destination}`.trim(),
      description: [
        `Booking: ${ref}`,
        `Route: ${f.origin} → ${f.destination}`,
        `Cabin: ${f.cabinClass}`,
        `Type: ${f.flightType}`,
        f.returnDate ? `Return: ${new Date(f.returnDate).toUTCString()}` : null,
        `${f.noOfAdults} Adult${f.noOfAdults !== 1 ? "s" : ""}${f.noOfChildren ? `, ${f.noOfChildren} Child` : ""}${f.noOfInfants ? `, ${f.noOfInfants} Infant${f.noOfInfants !== 1 ? "s" : ""}` : ""}`,
        f.supplierName ? `Supplier: ${f.supplierName}` : null,
        f.pnr ? `PNR: ${f.pnr}` : null,
        f.confirmationNumber ? `Confirmation #: ${f.confirmationNumber}` : null,
        `Status: ${f.status}`,
      ].filter(Boolean).join("\\n"),
      location: f.origin || undefined,
      start,
      end,
    });
  }

  return events;
}

function buildICS(r: ReservationT): string {
  const events = collectEvents(r);
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Wanderlust — ${r.reference}`,
    `X-WR-CALDESC:${escText(`Reservation ${r.reference} — ${r.customerName}`)}`,
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${fmtUtc(now)}`);
    if (e.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${fmtDate(e.start)}`);
      lines.push(`DTEND;VALUE=DATE:${fmtDate(e.end)}`);
    } else {
      lines.push(`DTSTART:${fmtUtc(e.start)}`);
      lines.push(`DTEND:${fmtUtc(e.end)}`);
    }
    lines.push(`SUMMARY:${escText(e.summary)}`);
    if (e.description) lines.push(`DESCRIPTION:${escText(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escText(e.location)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  // CRLF line endings are mandatory per RFC 5545.
  return lines.join("\r\n");
}

// GET /api/agency/reservations/[id]/calendar — returns an .ics file
export async function GET(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const reservation = await fetchReservationById(id);
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const serialized = serializeReservation(reservation);
    const ics = buildICS(serialized);
    const filename = `${serialized.reference}.ics`;

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("agency calendar GET error:", err);
    return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 });
  }
}
