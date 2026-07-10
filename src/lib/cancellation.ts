import type { ExperienceType } from "./types";

export type CancellationType = "FLEXIBLE" | "MODERATE" | "STRICT";

export interface CancellationInfo {
  type: CancellationType;
  title: string;
  description: string;
  short: string;
  badgeClass: string;
}

export function getCancellationInfo(type: CancellationType | undefined): CancellationInfo {
  switch (type) {
    case "STRICT":
      return {
        type: "STRICT",
        title: "No refund",
        description:
          "This experience cannot be cancelled, amended or refunded. Please double-check your date and details before booking.",
        short: "No refund",
        badgeClass: "border-rose-500/40 bg-rose-500/10 text-rose-600",
      };
    case "MODERATE":
      return {
        type: "MODERATE",
        title: "Free cancellation up to 48 hours",
        description:
          "Cancel up to 48 hours before the experience for a full refund. Within 48 hours, the booking is non-refundable.",
        short: "Free up to 48h prior",
        badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-600",
      };
    case "FLEXIBLE":
    default:
      return {
        type: "FLEXIBLE",
        title: "Free cancellation up to 24 hours",
        description:
          "Cancel up to 24 hours before the experience for a full refund. Within 24 hours, the booking is non-refundable.",
        short: "Free up to 24h prior",
        badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
      };
  }
}

// Infer a sensible default cancellation type from the experience type.
// Park tickets / attraction entries / transfers are typically non-refundable.
export function defaultCancellationType(expType: ExperienceType): CancellationType {
  switch (expType) {
    case "ATTRACTION": // park tickets, museum entries, Burj Khalifa, Ferrari World, etc.
    case "TRANSFER":   // scheduled transfers
      return "STRICT";
    case "CRUISE":
    case "ACTIVITY":
      return "MODERATE";
    case "TOUR":
    case "ADVENTURE":
    default:
      return "FLEXIBLE";
  }
}
