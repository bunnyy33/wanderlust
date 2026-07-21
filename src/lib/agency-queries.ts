// Resilient query helpers for the agency reservation system.
//
// On local SQLite (the dev sandbox) the FlightBooking / VisaBooking /
// ExtraBooking tables exist and the FULL_INCLUDE below works fine. On
// Neon/Postgres production deployments where the schema migration that
// adds those tables hasn't been applied yet, querying them throws
// PrismaClientKnownRequestError P2021 (table does not exist). These
// helpers try the full include first and, on P2021, fall back to a
// SAFE_INCLUDE that only touches the legacy tables — and they backfill
// flights/visas/extras to [] so the rest of the code can stay uniform.

import { db } from "@/lib/db";

// Full include — works when all tables exist.
export const FULL_INCLUDE = {
  tours: true,
  transports: true,
  hotels: true,
  flights: true,
  visas: true,
  extras: true,
  guests: true,
  payments: true,
  employee: true,
} as const;

// Safe include — works even on databases where the new
// flightBooking/visaBooking/extraBooking tables don't exist yet.
export const SAFE_INCLUDE = {
  tours: true,
  transports: true,
  hotels: true,
  guests: true,
  payments: true,
  employee: true,
} as const;

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "P2021") return true;
  // Some Prisma builds throw a raw Error with the code embedded in the
  // message — accept either form.
  if (typeof e.message === "string" && /P2021|does not exist/i.test(e.message)) {
    return true;
  }
  return false;
}

// Backfill the optional relations so callers can rely on the same shape
// regardless of which include actually ran.
function normalize<T extends Record<string, any>>(r: T | null): T | null {
  if (!r) return null;
  return {
    ...r,
    flights: (r as any).flights ?? [],
    visas: (r as any).visas ?? [],
    extras: (r as any).extras ?? [],
  } as T;
}

/**
 * Fetch a single reservation by id, including all relations.
 * Falls back to SAFE_INCLUDE if the new tables don't exist on the DB.
 */
export async function fetchReservationById(id: string) {
  try {
    const r = await db.reservation.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    return normalize(r);
  } catch (err) {
    if (isMissingTableError(err)) {
      const r = await db.reservation.findUnique({
        where: { id },
        include: SAFE_INCLUDE,
      });
      return normalize(r);
    }
    throw err;
  }
}

/**
 * Fetch a list of reservations. `include` is locked to a list-shaped
 * subset (employee + service arrays for the firstServiceName + service
 * count helpers). Falls back to SAFE_INCLUDE on P2021.
 */
export async function fetchReservationList(where: any, limit: number) {
  try {
    return await db.reservation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        employee: true,
        tours: true,
        transports: true,
        hotels: true,
        flights: true,
        visas: true,
        extras: true,
      },
    });
  } catch (err) {
    if (isMissingTableError(err)) {
      return await db.reservation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          employee: true,
          tours: true,
          transports: true,
          hotels: true,
        },
      });
    }
    throw err;
  }
}

/**
 * Fetch a reservation for the recalc helper — same as fetchReservationById
 * but typed for the pricing helper (tours/transports/hotels/flights/visas/
 * extras/payments). Returns the raw row (already normalized with empty
 * arrays for any relations that don't exist on the DB).
 */
export async function fetchReservationForRecalc(id: string) {
  return fetchReservationById(id);
}
