// Audit logging helper — every mutation to a reservation-related entity
// should call logAudit() so we have a tamper-evident history of who/what/when.
//
// The helper is intentionally resilient: if the AuditLog table is missing
// (e.g. on a freshly restored sandbox where migrations haven't run yet) it
// just swallows the error so the calling request still succeeds.

import { db } from "@/lib/db";

export interface AuditEntry {
  reservationId?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  action: string; // CREATE | UPDATE | DELETE | STATUS_CHANGE | EMAIL_SENT | VOUCHER | INVOICE
  entityType: string; // RESERVATION | TOUR | HOTEL | TRANSPORT | FLIGHT | VISA | EXTRA | PAYMENT | GUEST
  entityId?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        reservationId: entry.reservationId ?? null,
        employeeId: entry.employeeId ?? null,
        employeeName: entry.employeeName ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        changes: JSON.stringify(entry.changes ?? {}),
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch {
    // Audit logging must never break the actual request — if the table
    // doesn't exist (e.g. fresh sandbox, prod without migration) just drop it.
  }
}

/**
 * Build a changes diff between a "before" record and an "after" patch.
 * Only iterates over keys present in `after` (the patch) — fields that
 * aren't being touched are ignored, so the audit log only captures what
 * actually changed.
 */
export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> {
  const out: Record<string, { old: unknown; new: unknown }> = {};
  for (const k of Object.keys(after)) {
    const a = before[k];
    const b = after[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out[k] = { old: a ?? null, new: b ?? null };
    }
  }
  return out;
}
