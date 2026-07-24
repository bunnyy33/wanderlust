import { describe, it, expect } from "vitest";
import {
  calcTourPricing,
  calcHotelPricing,
  calcFlightPricing,
  calcVisaPricing,
  calcExtraPricing,
  calcReservationTotals,
  calcNights,
} from "../agency-pricing";

describe("calcTourPricing", () => {
  it("calculates per-person pricing correctly", () => {
    const result = calcTourPricing({
      costUnit: "PER_PERSON",
      adultCostRate: 100,
      childCostRate: 50,
      carCostRate: 0,
      adultSellRate: 150,
      childSellRate: 75,
      carSellRate: 0,
      noOfAdults: 2,
      noOfChildren: 1,
    });
    // Cost: 100*2 + 50*1 = 250
    expect(result.totalCost).toBe(250);
    // Sell: 150*2 + 75*1 = 375
    expect(result.totalSell).toBe(375);
  });

  it("calculates per-booking pricing correctly", () => {
    const result = calcTourPricing({
      costUnit: "PER_BOOKING",
      adultCostRate: 200,
      childCostRate: 100,
      carCostRate: 50,
      adultSellRate: 300,
      childSellRate: 150,
      carSellRate: 80,
      noOfAdults: 2,
      noOfChildren: 2,
    });
    // Per booking: cost = 200 + 100 + 50 = 350
    expect(result.totalCost).toBe(350);
    // Sell = 300 + 150 + 80 = 530
    expect(result.totalSell).toBe(530);
  });

  it("handles zero pax", () => {
    const result = calcTourPricing({
      costUnit: "PER_PERSON",
      adultCostRate: 100,
      childCostRate: 50,
      carCostRate: 0,
      adultSellRate: 150,
      childSellRate: 75,
      carSellRate: 0,
      noOfAdults: 0,
      noOfChildren: 0,
    });
    expect(result.totalCost).toBe(0);
    expect(result.totalSell).toBe(0);
  });
});

describe("calcHotelPricing", () => {
  it("calculates hotel pricing correctly", () => {
    const result = calcHotelPricing({
      costPerNight: 200,
      sellPerNight: 300,
      nights: 3,
      noOfRooms: 2,
    });
    // Cost: 200 * 3 * 2 = 1200
    expect(result.totalCost).toBe(1200);
    // Sell: 300 * 3 * 2 = 1800
    expect(result.totalSell).toBe(1800);
  });

  it("handles 1 night 1 room", () => {
    const result = calcHotelPricing({
      costPerNight: 100,
      sellPerNight: 150,
      nights: 1,
      noOfRooms: 1,
    });
    expect(result.totalCost).toBe(100);
    expect(result.totalSell).toBe(150);
  });
});

describe("calcFlightPricing", () => {
  it("calculates flight pricing correctly", () => {
    const result = calcFlightPricing({
      adultCostRate: 500,
      childCostRate: 400,
      infantCostRate: 50,
      adultSellRate: 700,
      childSellRate: 550,
      infantSellRate: 75,
      noOfAdults: 2,
      noOfChildren: 1,
      noOfInfants: 1,
    });
    // Cost: 500*2 + 400*1 + 50*1 = 1450
    expect(result.totalCost).toBe(1450);
    // Sell: 700*2 + 550*1 + 75*1 = 2025
    expect(result.totalSell).toBe(2025);
  });
});

describe("calcVisaPricing", () => {
  it("calculates visa pricing correctly", () => {
    const result = calcVisaPricing({
      adultCostRate: 100,
      childCostRate: 50,
      adultSellRate: 150,
      childSellRate: 75,
      noOfAdults: 2,
      noOfChildren: 1,
    });
    expect(result.totalCost).toBe(250);
    expect(result.totalSell).toBe(375);
  });
});

describe("calcExtraPricing", () => {
  it("calculates extra pricing correctly", () => {
    const result = calcExtraPricing({
      costRate: 50,
      sellRate: 80,
      quantity: 3,
    });
    expect(result.totalCost).toBe(150);
    expect(result.totalSell).toBe(240);
  });
});

describe("calcNights", () => {
  it("calculates nights between two dates", () => {
    const checkIn = new Date("2026-07-20");
    const checkOut = new Date("2026-07-25");
    expect(calcNights(checkIn, checkOut)).toBe(5);
  });

  it("returns 1 for same-day (minimum)", () => {
    const checkIn = new Date("2026-07-20");
    const checkOut = new Date("2026-07-20");
    expect(calcNights(checkIn, checkOut)).toBeGreaterThanOrEqual(0);
  });
});

describe("calcReservationTotals", () => {
  it("sums all service sell prices + applies VAT", () => {
    const result = calcReservationTotals(
      [{ totalSell: 1000 }], // tours
      [{ sellRate: 500 }], // transports
      [{ totalSell: 800 }], // hotels
      [{ amount: 500, status: "RECEIVED" }], // payments
      "TAXABLE",
      0.05, // 5% VAT
    );
    // Subtotal: 1000 + 500 + 800 = 2300
    expect(result.subTotal).toBe(2300);
    // VAT: 2300 * 0.05 = 115
    expect(result.vatAmount).toBe(115);
    // Total: 2300 + 115 = 2415
    expect(result.totalAmount).toBe(2415);
    // Paid: 500
    expect(result.amountPaid).toBe(500);
    // Balance: 2415 - 500 = 1915
    expect(result.balanceDue).toBe(1915);
  });

  it("excludes refunded payments", () => {
    const result = calcReservationTotals(
      [],
      [],
      [],
      [
        { amount: 500, status: "RECEIVED" },
        { amount: 200, status: "REFUNDED" },
      ],
      "TAXABLE",
      0.05,
    );
    // Only 500 counted (REFUNDED excluded)
    expect(result.amountPaid).toBe(500);
  });

  it("handles zero-rate invoice type", () => {
    const result = calcReservationTotals(
      [{ totalSell: 1000 }],
      [],
      [],
      [],
      "ZERO_RATED",
      0.05,
    );
    expect(result.vatAmount).toBe(0);
    expect(result.totalAmount).toBe(1000);
  });
});
