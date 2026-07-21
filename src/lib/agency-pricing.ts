// Agency pricing calculations — shared by all agency API routes
// so create/update operations keep the denormalised fields in sync.

export function calcTourPricing(input: {
  costUnit: string;
  adultCostRate: number;
  childCostRate: number;
  carCostRate: number;
  adultSellRate: number;
  childSellRate: number;
  carSellRate: number;
  noOfAdults: number;
  noOfChildren: number;
}) {
  const perPerson = input.costUnit === "PER_PERSON";
  const adults = input.noOfAdults;
  const children = input.noOfChildren;
  const netAdultRate = perPerson ? input.adultCostRate * adults : input.adultCostRate;
  const netChildRate = perPerson ? input.childCostRate * children : input.childCostRate;
  const totalCost = netAdultRate + netChildRate + input.carCostRate;
  const sellNetAdult = perPerson ? input.adultSellRate * adults : input.adultSellRate;
  const sellNetChild = perPerson ? input.childSellRate * children : input.childSellRate;
  const totalSell = sellNetAdult + sellNetChild + input.carSellRate;
  return { netAdultRate, netChildRate, totalCost, sellNetAdult, sellNetChild, totalSell };
}

export function calcHotelPricing(input: {
  costPerNight: number;
  sellPerNight: number;
  nights: number;
  noOfRooms: number;
}) {
  const totalCost = input.costPerNight * input.nights * input.noOfRooms;
  const totalSell = input.sellPerNight * input.nights * input.noOfRooms;
  return { totalCost, totalSell };
}

export function calcNights(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

// ---- New service pricing (flights / visas / extras) ---------------------

export function calcFlightPricing(input: {
  adultCostRate: number;
  childCostRate: number;
  infantCostRate: number;
  adultSellRate: number;
  childSellRate: number;
  infantSellRate: number;
  noOfAdults: number;
  noOfChildren: number;
  noOfInfants: number;
}) {
  const totalCost =
    input.adultCostRate * input.noOfAdults +
    input.childCostRate * input.noOfChildren +
    input.infantCostRate * input.noOfInfants;
  const totalSell =
    input.adultSellRate * input.noOfAdults +
    input.childSellRate * input.noOfChildren +
    input.infantSellRate * input.noOfInfants;
  return { totalCost, totalSell };
}

export function calcVisaPricing(input: {
  adultCostRate: number;
  childCostRate: number;
  adultSellRate: number;
  childSellRate: number;
  noOfAdults: number;
  noOfChildren: number;
}) {
  const totalCost =
    input.adultCostRate * input.noOfAdults +
    input.childCostRate * input.noOfChildren;
  const totalSell =
    input.adultSellRate * input.noOfAdults +
    input.childSellRate * input.noOfChildren;
  return { totalCost, totalSell };
}

export function calcExtraPricing(input: {
  costRate: number;
  sellRate: number;
  quantity: number;
}) {
  const qty = Math.max(0, input.quantity);
  const totalCost = input.costRate * qty;
  const totalSell = input.sellRate * qty;
  return { totalCost, totalSell };
}

// VAT defaults to 5% (UAE) when invoice type is TAXABLE.
export const VAT_RATE = 0.05;

// NOTE: flights/visas/extras are appended AFTER the existing positional
// params so existing callers (which only pass tours/transports/hotels/
// payments/invoiceType/vatRate) continue to work unchanged. The new
// params default to empty arrays.
export function calcReservationTotals(
  tours: { totalSell: number; totalCost?: number }[],
  transports: { sellRate: number; netRate?: number }[],
  hotels: { totalSell: number; totalCost?: number }[],
  payments: { amount: number; status: string }[],
  invoiceType: string,
  vatRate: number = VAT_RATE,
  flights: { totalSell: number; totalCost?: number }[] = [],
  visas: { totalSell: number; totalCost?: number }[] = [],
  extras: { totalSell: number; totalCost?: number }[] = [],
) {
  const subTotal =
    tours.reduce((s, t) => s + (t.totalSell || 0), 0) +
    transports.reduce((s, t) => s + (t.sellRate || 0), 0) +
    hotels.reduce((s, t) => s + (t.totalSell || 0), 0) +
    flights.reduce((s, f) => s + (f.totalSell || 0), 0) +
    visas.reduce((s, v) => s + (v.totalSell || 0), 0) +
    extras.reduce((s, e) => s + (e.totalSell || 0), 0);
  const totalCost =
    tours.reduce((s, t) => s + (t.totalCost || 0), 0) +
    transports.reduce((s, t) => s + (t.netRate || 0), 0) +
    hotels.reduce((s, t) => s + (t.totalCost || 0), 0) +
    flights.reduce((s, f) => s + (f.totalCost || 0), 0) +
    visas.reduce((s, v) => s + (v.totalCost || 0), 0) +
    extras.reduce((s, e) => s + (e.totalCost || 0), 0);
  const vatAmount = invoiceType === "TAXABLE" ? subTotal * vatRate : 0;
  const totalAmount = subTotal + vatAmount;
  const amountPaid = payments
    .filter((p) => p.status !== "REFUNDED")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);
  return { subTotal, vatAmount, totalAmount, amountPaid, balanceDue, totalCost };
}
