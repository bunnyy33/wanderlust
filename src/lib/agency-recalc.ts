// Recompute and persist reservation totals (subTotal, VAT, totalAmount,
// amountPaid, balanceDue) whenever a service or payment changes.

import { db } from "@/lib/db";
import { calcReservationTotals } from "./agency-pricing";

export async function recalcReservation(reservationId: string) {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: {
      tours: true,
      transports: true,
      hotels: true,
      payments: true,
    },
  });
  if (!reservation) return null;

  const totals = calcReservationTotals(
    reservation.tours,
    reservation.transports,
    reservation.hotels,
    reservation.payments,
    reservation.invoiceType,
  );

  const updated = await db.reservation.update({
    where: { id: reservationId },
    data: totals,
    include: {
      tours: true,
      transports: true,
      hotels: true,
      guests: true,
      payments: true,
      employee: true,
    },
  });
  return updated;
}
