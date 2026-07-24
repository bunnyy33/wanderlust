import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/agency/audit — list audit log entries
// Query params:
//   reservationId — filter to a single reservation
//   employeeId    — filter to a single employee
//   action        — filter by action (CREATE | UPDATE | DELETE | STATUS_CHANGE | EMAIL_SENT | VOUCHER | INVOICE)
//   entityType    — filter by entity type
//   limit         — 1..200 (default 100)
//   before        — ISO date; only return entries older than this (cursor pagination)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("reservationId") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 100)));
    const before = searchParams.get("before");

    const where: any = {};
    if (reservationId) where.reservationId = reservationId;
    if (employeeId) where.employeeId = employeeId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (before) {
      try {
        where.createdAt = { lt: new Date(before) };
      } catch { /* invalid date — drop the filter */ }
    }

    const entries = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Parse the JSON changes column back into an object for the client.
    const serialized = entries.map((e) => ({
      id: e.id,
      reservationId: e.reservationId ?? null,
      employeeId: e.employeeId ?? null,
      employeeName: e.employeeName ?? null,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId ?? null,
      changes: safeParseChanges(e.changes),
      ipAddress: e.ipAddress ?? null,
      createdAt: e.createdAt?.toISOString?.() ?? e.createdAt,
    }));

    return NextResponse.json({ entries: serialized, count: serialized.length });
  } catch (err) {
    console.error("agency audit GET error:", err);
    return NextResponse.json({ error: "Failed to load audit log" }, { status: 500 });
  }
}

function safeParseChanges(raw: string | null): Record<string, { old: unknown; new: unknown }> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
