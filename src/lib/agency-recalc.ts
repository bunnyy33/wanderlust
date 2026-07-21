// Recompute and persist reservation totals (subTotal, VAT, totalAmount,
// amountPaid, balanceDue, totalCost) whenever a service or payment changes.

import { calcReservationTotals } from "./agency-pricing";
import { fetchReservationById } from "./agency-queries";
import { db } from "@/lib/db";

export async function recalcReservation(reservationId: string) {
  const reservation = await fetchReservationForRecalc(reservationId);
  if (!reservation) return null;

  const totals = calcReservationTotals(
    reservation.tours,
    reservation.transports,
    reservation.hotels,
    reservation.payments,
    reservation.invoiceType,
    undefined, // vatRate default
    reservation.flights,
    reservation.visas,
    reservation.extras,
  );

  await db.reservation.update({
    where: { id: reservationId },
    data: totals,
  });

  // Re-fetch through the resilient helper so the returned object includes
  // flights/visas/extras (backfilled to [] if the tables don't exist).
  return fetchReservationById(reservationId);
}

// Re-export so existing import sites keep working.
export { fetchReservationById as fetchReservationForRecalc } from "./agency-queries";
