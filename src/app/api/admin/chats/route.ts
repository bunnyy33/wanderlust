import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/chats?limit= — recent AI chat conversations
export async function GET(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = parseInt(new URL(req.url).searchParams.get("limit") || "50", 10);
  const chats = await db.chatLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({
    chats: chats.map((c) => ({
      id: c.id,
      sessionId: c.sessionId,
      userMessage: c.userMessage,
      aiReply: c.aiReply,
      ipAddress: c.ipAddress,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    })),
  });
}
