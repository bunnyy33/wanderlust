import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

const SESSION_COOKIE = "wl_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "wl-session-secret-dev";
const MAX_AGE = 60 * 60 * 24 * 30;

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

export function makeSessionToken(userId: string, email: string): string {
  const payload = `${userId}:${email}`;
  return `${Buffer.from(payload).toString("base64")}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): { userId: string; email: string } | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const payload = Buffer.from(payloadB64, "base64").toString("utf8");
    const expected = sign(payload);
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const [userId, email] = payload.split(":");
    if (!userId || !email) return null;
    return { userId, email };
  } catch { return null; }
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const parsed = verifySessionToken(token);
  if (!parsed) return null;
  const user = await db.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, email: true, name: true, phone: true },
  });
  return user;
}

export async function setSessionCookie(userId: string, email: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeSessionToken(userId, email), {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE, path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export { SESSION_COOKIE };
