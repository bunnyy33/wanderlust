import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/emails?limit=  — recent email log
export async function GET(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = parseInt(new URL(req.url).searchParams.get("limit") || "20", 10);
  const emails = await db.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({
    emails: emails.map((e) => ({
      id: e.id,
      toEmail: e.toEmail,
      subject: e.subject,
      type: e.type,
      status: e.status,
      relatedRef: e.relatedRef,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
    })),
  });
}
