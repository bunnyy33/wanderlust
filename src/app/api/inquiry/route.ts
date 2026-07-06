import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

// POST /api/inquiry — customer sends an inquiry, logged + emailed to concierge
export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const subject = String(body.subject || "General inquiry");
  const message = String(body.message || "").trim();

  // Validate — reject dummy/empty data
  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your full name" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
  }
  if (phone && phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
  }

  const html = `
<!doctype html>
<html><body style="font-family:sans-serif;background:#f5f3ee;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#1a4d4d;padding:20px;color:#fff;">
      <div style="font-size:20px;font-weight:700;">Wander<span style="color:#d4af6a;">lust</span> — New Inquiry</div>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#888;padding:4px 0;width:100px;">Name:</td><td style="font-weight:600;">${name}</td></tr>
        <tr><td style="color:#888;padding:4px 0;">Email:</td><td style="font-weight:600;">${email}</td></tr>
        <tr><td style="color:#888;padding:4px 0;">Phone:</td><td>${phone || "—"}</td></tr>
        <tr><td style="color:#888;padding:4px 0;">Subject:</td><td style="font-weight:600;">${subject}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#f8f6f0;border-radius:8px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">Message:</div>
        <div style="white-space:pre-wrap;line-height:1.6;">${message}</div>
      </div>
    </div>
  </div>
</body></html>`;

  // Log to EmailLog + attempt to send via SMTP if configured
  try {
    await sendEmail({
      to: process.env.SMTP_FROM || "concierge@wanderlust.travel",
      subject: `New inquiry: ${subject} — ${name}`,
      html,
      type: "INQUIRY",
      relatedRef: email,
    });
  } catch (err) {
    console.error("Inquiry email error:", err);
  }

  return NextResponse.json({ ok: true });
}
