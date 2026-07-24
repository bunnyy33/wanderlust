// Supplier portal auth — mirrors employee-auth.ts but for the read-only
// supplier portal. Suppliers log in with their email + an accessCode that
// the agency sets on the Supplier record. Sessions are signed HMAC cookies
// exactly like the employee flow.

import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { db } from "@/lib/db";

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || "wl-supplier-secret-dev";
const SUPPLIER_COOKIE = "wl_supplier";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

/** Create a signed session token for a supplier ID */
export function makeSupplierToken(supplierId: string): string {
  const payload = `sup:${supplierId}`;
  return `${Buffer.from(payload).toString("base64")}.${sign(payload)}`;
}

/** Verify + extract supplier ID from a session token. Returns null if invalid. */
export function verifySupplierToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const payload = Buffer.from(payloadB64, "base64").toString("utf8");
    if (!payload.startsWith("sup:")) return null;
    if (sign(payload) !== sig) return null;
    return payload.slice(4);
  } catch {
    return null;
  }
}

/** Get the current logged-in supplier ID from the session cookie */
export async function getCurrentSupplierId(): Promise<string | null> {
  const store = await cookies();
  return verifySupplierToken(store.get(SUPPLIER_COOKIE)?.value);
}

/** Get the current logged-in supplier record (or null) */
export async function getCurrentSupplier() {
  const id = await getCurrentSupplierId();
  if (!id) return null;
  try {
    const sup = await db.supplier.findUnique({ where: { id } });
    if (!sup || !sup.active) return null;
    return sup;
  } catch {
    return null;
  }
}

/** Set the supplier session cookie */
export async function setSupplierCookie(supplierId: string): Promise<void> {
  const store = await cookies();
  store.set(SUPPLIER_COOKIE, makeSupplierToken(supplierId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/** Clear the supplier session cookie */
export async function clearSupplierCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SUPPLIER_COOKIE);
}

/** Check if a supplier session is active */
export async function isSupplierAuthed(): Promise<boolean> {
  const sup = await getCurrentSupplier();
  return !!sup;
}

export { SUPPLIER_COOKIE };
