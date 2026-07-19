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

// VAT defaults to 5% (UAE) when invoice type is TAXABLE.
export const VAT_RATE = 0.05;

export function calcReservationTotals(
  tours: { totalSell: number }[],
  transports: { sellRate: number }[],
  hotels: { totalSell: number }[],
  payments: { amount: number; status: string }[],
  invoiceType: string,
  vatRate: number = VAT_RATE,
) {
  const subTotal =
    tours.reduce((s, t) => s + (t.totalSell || 0), 0) +
    transports.reduce((s, t) => s + (t.sellRate || 0), 0) +
    hotels.reduce((s, t) => s + (t.totalSell || 0), 0);
  const vatAmount = invoiceType === "TAXABLE" ? subTotal * vatRate : 0;
  const totalAmount = subTotal + vatAmount;
  const amountPaid = payments
    .filter((p) => p.status !== "REFUNDED")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);
  return { subTotal, vatAmount, totalAmount, amountPaid, balanceDue };
}
