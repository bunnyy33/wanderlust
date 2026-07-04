import nodemailer from "nodemailer";
import { db } from "./db";

// SMTP config from env. If not set, emails are logged to EmailLog but not sent.
// Production env vars:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "Wanderlust <bookings@wanderlust.travel>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return !!getTransporter();
}

export interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: string;
  relatedRef?: string;
}

// Send an email. Always logs to EmailLog (so admin can see it).
// Actually sends via SMTP only if configured.
export async function sendEmail(opts: SendEmailOpts): Promise<{ sent: boolean; logged: boolean }> {
  const transport = getTransporter();
  let sent = false;

  try {
    if (transport) {
      await transport.sendMail({
        from: SMTP_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text || opts.html.replace(/<[^>]+>/g, ""),
      });
      sent = true;
    } else {
      // Sandbox / not configured — just log
      console.log(`[EMAIL (not configured — logging only)] To: ${opts.to} | Subject: ${opts.subject}`);
    }
  } catch (err) {
    console.error("Email send error:", err);
  }

  let logged = false;
  try {
    await db.emailLog.create({
      data: {
        toEmail: opts.to,
        subject: opts.subject,
        body: opts.html,
        type: opts.type || "MANUAL",
        status: sent ? "SENT" : "LOGGED",
        relatedRef: opts.relatedRef || null,
      },
    });
    logged = true;
  } catch (err) {
    console.error("EmailLog write error:", err);
  }

  return { sent, logged };
}

// Booking confirmation email template
export function bookingConfirmationEmail(opts: {
  customerName: string;
  reference: string;
  title: string;
  date: string;
  guests?: number;
  nights?: number;
  total: number;
  currency?: string;
  type: string;
}): { subject: string; html: string } {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: opts.currency || "USD" }).format(n);
  const subject = `Your Wanderlust booking is confirmed — ${opts.reference}`;
  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1a4d4d 0%,#0f3a3a 100%);padding:32px 40px;color:#ffffff;">
        <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">Wander<span style="color:#d4af6a;">lust</span></div>
        <div style="margin-top:8px;font-size:13px;opacity:0.8;">Curated Luxury Travel</div>
      </div>
      <div style="padding:32px 40px;">
        <h1 style="margin:0 0 8px;font-size:24px;color:#1a4d4d;font-weight:700;">You're going! 🎉</h1>
        <p style="margin:0 0 24px;color:#5a6a6a;font-size:15px;line-height:1.6;">Hi ${opts.customerName}, your booking is confirmed. We can't wait to host you.</p>

        <div style="background:#f8f6f0;border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:#7a8a8a;font-size:13px;">Booking reference</span>
            <span style="font-weight:700;color:#1a4d4d;font-family:monospace;">${opts.reference}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:#7a8a8a;font-size:13px;">Experience</span>
            <span style="font-weight:600;color:#1a4d4d;font-size:13px;text-align:right;max-width:300px;">${opts.title}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:#7a8a8a;font-size:13px;">Date</span>
            <span style="font-weight:600;color:#1a4d4d;font-size:13px;">${opts.date}</span>
          </div>
          ${opts.type === "EXPERIENCE" ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#7a8a8a;font-size:13px;">Guests</span><span style="font-weight:600;color:#1a4d4d;font-size:13px;">${opts.guests}</span></div>` : ""}
          ${opts.type === "HOTEL" ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#7a8a8a;font-size:13px;">Nights</span><span style="font-weight:600;color:#1a4d4d;font-size:13px;">${opts.nights}</span></div>` : ""}
          <div style="border-top:1px solid #e5e0d4;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;">
            <span style="font-weight:700;color:#1a4d4d;">Total paid</span>
            <span style="font-weight:700;color:#d4af6a;font-size:18px;">${fmt(opts.total)}</span>
          </div>
        </div>

        <div style="background:#eaf4f4;border-left:3px solid #1a4d4d;padding:14px 18px;border-radius:8px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#1a4d4d;line-height:1.5;">📋 Save your reference <strong>${opts.reference}</strong>. You'll need it for changes or to look up your booking.</p>
        </div>

        <p style="margin:0 0 8px;color:#5a6a6a;font-size:14px;line-height:1.6;">Need help? Our concierge is available 24/7 — just reply to this email or chat with us on the site.</p>
        <p style="margin:0;color:#5a6a6a;font-size:14px;line-height:1.6;">Have an amazing trip,<br><strong style="color:#1a4d4d;">The Wanderlust Team</strong></p>
      </div>
      <div style="background:#f8f6f0;padding:20px 40px;text-align:center;font-size:12px;color:#9aa8a8;">
        © ${new Date().getFullYear()} Wanderlust Travel Co. · This email was sent regarding your booking.
      </div>
    </div>
  </body>
</html>`;
  return { subject, html };
}
