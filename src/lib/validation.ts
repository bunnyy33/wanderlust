/**
 * Input validation helpers for agency API routes.
 * Prevents bad/malicious data from reaching the database.
 */

/** Sanitize a string: trim, limit length, remove null bytes */
export function sanitizeString(value: unknown, maxLength = 500): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\0/g, "") // remove null bytes
    .slice(0, maxLength)
    .trim();
}

/** Validate an email address (basic RFC-like check) */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Validate a positive number (for amounts, rates) */
export function sanitizeNumber(value: unknown, min = 0, max = 10_000_000): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Validate a non-negative integer (for pax counts, quantities) */
export function sanitizeInt(value: unknown, min = 0, max = 1000): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Validate a date string (ISO or YYYY-MM-DD) — returns ISO string or null */
export function sanitizeDate(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    // Reject dates more than 100 years in the future or past
    const now = new Date();
    const hundredYears = 100 * 365 * 24 * 60 * 60 * 1000;
    if (Math.abs(d.getTime() - now.getTime()) > hundredYears) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/** Validate an enum value against allowed values */
export function sanitizeEnum(value: unknown, allowed: string[], fallback: string): string {
  const v = String(value ?? "");
  return allowed.includes(v) ? v : fallback;
}

/** Validate a phone number (digits, spaces, +, -, parentheses, max 30 chars) */
export function sanitizePhone(value: unknown): string | null {
  if (!value) return null;
  const s = String(value).trim();
  if (s.length > 30) return null;
  if (!/^[+]?[\d\s\-()]+$/.test(s)) return null;
  return s;
}

/** Validate a reference/confirmation number (alphanumeric + dashes, max 50 chars) */
export function sanitizeReference(value: unknown): string | null {
  if (!value) return null;
  const s = String(value).trim();
  if (s.length > 50) return null;
  if (!/^[a-zA-Z0-9\-_]+$/.test(s)) return null;
  return s;
}
