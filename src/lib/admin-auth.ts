import { cookies } from "next/headers";
import { createHmac } from "crypto";

// Admin password — set ADMIN_PASSWORD env var in production.
// For the demo we ship a default; CHANGE THIS in production.
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "wanderlust-admin-2024";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "wl-admin-secret-key";

const COOKIE_NAME = "wl_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
  return createHmac("sha256", ADMIN_SECRET).update(value).digest("hex");
}

export function makeAdminToken(): string {
  const payload = `admin:${Date.now()}`;
  return `${Buffer.from(payload).toString("base64")}.${sign(payload)}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  try {
    const payload = Buffer.from(payloadB64, "base64").toString("utf8");
    return sign(payload) === sig;
  } catch {
    return false;
  }
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(COOKIE_NAME)?.value);
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
