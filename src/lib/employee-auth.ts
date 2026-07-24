import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { db } from "@/lib/db";

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || "wl-session-secret-dev";
const EMPLOYEE_COOKIE = "wl_employee";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

/** Create a signed session token for an employee ID */
export function makeEmployeeToken(employeeId: string): string {
  const payload = `emp:${employeeId}`;
  return `${Buffer.from(payload).toString("base64")}.${sign(payload)}`;
}

/** Verify + extract employee ID from a session token. Returns null if invalid. */
export function verifyEmployeeToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const payload = Buffer.from(payloadB64, "base64").toString("utf8");
    if (!payload.startsWith("emp:")) return null;
    if (sign(payload) !== sig) return null;
    return payload.slice(4); // extract employeeId
  } catch {
    return null;
  }
}

/** Get the current logged-in employee ID from the session cookie */
export async function getCurrentEmployeeId(): Promise<string | null> {
  const store = await cookies();
  return verifyEmployeeToken(store.get(EMPLOYEE_COOKIE)?.value);
}

/** Get the current logged-in employee record (or null) */
export async function getCurrentEmployee() {
  const id = await getCurrentEmployeeId();
  if (!id) return null;
  try {
    const emp = await db.employee.findUnique({ where: { id } });
    if (!emp || !emp.active) return null;
    return emp;
  } catch {
    return null;
  }
}

/** Set the employee session cookie */
export async function setEmployeeCookie(employeeId: string): Promise<void> {
  const store = await cookies();
  store.set(EMPLOYEE_COOKIE, makeEmployeeToken(employeeId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/** Clear the employee session cookie */
export async function clearEmployeeCookie(): Promise<void> {
  const store = await cookies();
  store.delete(EMPLOYEE_COOKIE);
}

/** Check if an employee session is active */
export async function isEmployeeAuthed(): Promise<boolean> {
  const emp = await getCurrentEmployee();
  return !!emp;
}

/** Hash a password (for seeding / creating employees) */
export function hashPassword(password: string): string {
  return sign(`pwd:${password}`);
}

/** Verify a password against a hash */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export { EMPLOYEE_COOKIE };
