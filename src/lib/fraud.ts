// Fraud detection heuristics for booking submissions.
import { db } from "./db";

const DISPOSABLE_DOMAINS = [
  "tempmail.com", "guerrillamail.com", "mailinator.com", "10minutemail.com",
  "throwaway.email", "trashmail.com", "yopmail.com", "getnada.com",
  "temp-mail.org", "sharklasers.com", "dispostable.com", "maildrop.cc",
];

interface FraudInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  totalAmount: number;
}

export interface FraudResult {
  score: number;
  signals: string[];
  isFlagged: boolean;
}

export async function computeFraudScore(input: FraudInput): Promise<FraudResult> {
  const signals: string[] = [];
  let score = 0;

  if (!input.userId) {
    score += 20;
    signals.push("Guest checkout (no account)");
  } else {
    score -= 20;
  }

  const domain = input.customerEmail.split("@")[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
    score += 35;
    signals.push(`Disposable email domain (${domain})`);
  }

  const localPart = input.customerEmail.split("@")[0]?.toLowerCase() || "";
  const nameLower = input.customerName.toLowerCase().replace(/[^a-z]/g, "");
  if (nameLower.length > 2 && localPart.length > 2) {
    const matches = nameLower.split("").some((ch) => localPart.includes(ch));
    if (!matches) {
      score += 12;
      signals.push("Email doesn't match customer name");
    }
  }

  if (!input.customerPhone || input.customerPhone.trim().length < 7) {
    score += 10;
    signals.push("No phone number provided");
  }

  if (!input.userId && input.totalAmount > 1000) {
    score += 15;
    signals.push("High-value guest booking");
  }

  if (input.ipAddress) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFromIp = await db.booking.count({
      where: { ipAddress: input.ipAddress, createdAt: { gte: oneHourAgo } },
    });
    if (recentFromIp >= 3) {
      score += 30;
      signals.push(`${recentFromIp} bookings from this IP in the last hour`);
    } else if (recentFromIp >= 2) {
      score += 15;
      signals.push(`${recentFromIp} bookings from this IP in the last hour`);
    }
  }

  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentFromEmail = await db.booking.count({
    where: { customerEmail: input.customerEmail.toLowerCase(), createdAt: { gte: tenMinAgo } },
  });
  if (recentFromEmail >= 2) {
    score += 25;
    signals.push(`${recentFromEmail} bookings from this email in 10 minutes`);
  }

  const ua = (input.userAgent || "").toLowerCase();
  if (!ua || ua.includes("curl") || ua.includes("bot") || ua.includes("scrapy") || ua.includes("python") || ua.includes("postman")) {
    score += 30;
    signals.push(ua ? `Automated client detected (${ua.slice(0, 40)})` : "No user-agent");
  }

  score = Math.max(0, Math.min(100, score));
  const isFlagged = score >= 50;
  if (signals.length === 0) signals.push("No risk signals detected");

  return { score, signals, isFlagged };
}

export function getClientIp(req: Request): string | null {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || headers.get("x-vercel-forwarded-for") || null;
}

export function getClientUserAgent(req: Request): string | null {
  return req.headers.get("user-agent") || null;
}
