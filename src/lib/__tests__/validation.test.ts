import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  isValidEmail,
  sanitizeNumber,
  sanitizeInt,
  sanitizeEnum,
  sanitizePhone,
  sanitizeReference,
} from "../validation";

describe("sanitizeString", () => {
  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });
  it("removes null bytes", () => {
    expect(sanitizeString("hello\0world")).toBe("helloworld");
  });
  it("limits length", () => {
    expect(sanitizeString("a".repeat(600), 100).length).toBe(100);
  });
  it("handles null/undefined", () => {
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
  });
});

describe("isValidEmail", () => {
  it("validates correct emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@domain.co.uk")).toBe(true);
  });
  it("rejects invalid emails", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("sanitizeNumber", () => {
  it("returns valid numbers within range", () => {
    expect(sanitizeNumber(100, 0, 1000)).toBe(100);
  });
  it("clamps to min", () => {
    expect(sanitizeNumber(-50, 0, 1000)).toBe(0);
  });
  it("clamps to max", () => {
    expect(sanitizeNumber(99999, 0, 1000)).toBe(1000);
  });
  it("handles NaN", () => {
    expect(sanitizeNumber("abc", 0, 1000)).toBe(0);
  });
});

describe("sanitizeInt", () => {
  it("floors decimals", () => {
    expect(sanitizeInt(3.7, 0, 10)).toBe(3);
  });
  it("clamps to range", () => {
    expect(sanitizeInt(-5, 0, 10)).toBe(0);
    expect(sanitizeInt(99, 0, 10)).toBe(10);
  });
});

describe("sanitizeEnum", () => {
  it("returns valid value", () => {
    expect(sanitizeEnum("PENDING", ["PENDING", "CONFIRMED"], "PENDING")).toBe("PENDING");
  });
  it("returns fallback for invalid value", () => {
    expect(sanitizeEnum("INVALID", ["PENDING", "CONFIRMED"], "PENDING")).toBe("PENDING");
  });
});

describe("sanitizePhone", () => {
  it("accepts valid phone numbers", () => {
    expect(sanitizePhone("+971 50 123 4567")).toBe("+971 50 123 4567");
    expect(sanitizePhone("+1-555-0199")).toBe("+1-555-0199");
  });
  it("rejects invalid characters", () => {
    expect(sanitizePhone("call me!")).toBeNull();
    expect(sanitizePhone("abc")).toBeNull();
  });
  it("rejects too long", () => {
    expect(sanitizePhone("+".repeat(35))).toBeNull();
  });
});

describe("sanitizeReference", () => {
  it("accepts alphanumeric + dashes", () => {
    expect(sanitizeReference("WL-RES-200201")).toBe("WL-RES-200201");
  });
  it("rejects special characters", () => {
    expect(sanitizeReference("WL@RES")).toBeNull();
    expect(sanitizeReference("WL RES")).toBeNull();
  });
});
