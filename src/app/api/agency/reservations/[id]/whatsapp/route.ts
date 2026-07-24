import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getCurrentEmployee } from "@/lib/employee-auth";
import { serializeReservation } from "@/lib/agency-types";
import { fetchReservationById } from "@/lib/agency-queries";
import { logAudit } from "@/lib/audit";

interface ctx { params: Promise<{ id: string }> }

// Normalize a phone number for wa.me — strip everything but digits,
// drop a leading 0 or +, and accept the rest as-is.
// wa.me expects the full international number without "+".
function normalizeWaPhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("00")) p = p.slice(2);
  // UAE local numbers often come in as 05XXXXXXXX — convert to 9715…
  if (p.startsWith("0")) p = "971" + p.slice(1);
  return p;
}

// POST /api/agency/reservations/[id]/whatsapp
// Body: { phone, message }
//   - If WHATSAPP_API_KEY is set: attempt to send via WhatsApp Business API
//     (placeholder implementation — actual provider wiring left to env).
//   - If not set: return a wa.me link the agent can click to open WhatsApp
//     Web/Desktop with the message pre-filled.
// Always logs to AuditLog so there's a record of every attempt.
export async function POST(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const reservation = await fetchReservationById(id);
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const body = await req.json();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const normalized = normalizeWaPhone(phone);
    if (!/^\d{6,15}$/.test(normalized)) {
      return NextResponse.json(
        { error: "phone number looks invalid after normalization" },
        { status: 400 },
      );
    }

    const waLink = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    let sent = false;
    let providerResponse: any = null;

    // If a WhatsApp Business API key is configured, attempt to actually send
    // the message through the provider's REST endpoint. We don't ship a
    // specific provider client here — the contract is left intentionally
    // generic so deployment can wire in Twilio / 360dialog / Meta Cloud API
    // by setting WHATSAPP_API_KEY + WHATSAPP_API_URL.
    const apiKey = process.env.WHATSAPP_API_KEY;
    const apiUrl = process.env.WHATSAPP_API_URL;
    if (apiKey && apiUrl) {
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            to: normalized,
            type: "text",
            text: { body: message },
          }),
          signal: AbortSignal.timeout(10_000),
        });
        const text = await res.text();
        providerResponse = { status: res.status, body: text };
        sent = res.ok;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        providerResponse = { error: msg };
      }
    }

    // Audit — always log the attempt
    try {
      const emp = await getCurrentEmployee();
      const ip = req.headers.get("x-forwarded-for") || null;
      await logAudit({
        reservationId: id,
        employeeId: emp?.id ?? null,
        employeeName: emp?.name ?? null,
        action: "EMAIL_SENT", // re-using the existing "comms sent" bucket
        entityType: "RESERVATION",
        entityId: id,
        changes: {
          channel: { old: null, new: "WHATSAPP" },
          phone: { old: null, new: normalized },
          message: { old: null, new: message },
          sent: { old: null, new: sent },
          waLink: { old: null, new: waLink },
          providerResponse: { old: null, new: providerResponse },
        },
        ipAddress: ip,
      });
    } catch { /* audit never blocks */ }

    return NextResponse.json({
      ok: true,
      sent,
      channel: "WHATSAPP",
      phone: normalized,
      waLink,
      providerResponse,
      reservation: serializeReservation(reservation),
    });
  } catch (err) {
    console.error("agency whatsapp POST error:", err);
    return NextResponse.json({ error: "Failed to send WhatsApp" }, { status: 500 });
  }
}
