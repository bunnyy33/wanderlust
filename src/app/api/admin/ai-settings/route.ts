import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/ai-settings — fetch current AI config
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let settings = await db.aiSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.aiSettings.create({ data: { id: "singleton" } });
  }
  return NextResponse.json({ settings });
}

// PUT /api/admin/ai-settings — update AI config
export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const settings = await db.aiSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      systemPrompt: body.systemPrompt || "",
      businessInfo: body.businessInfo || "",
      persona: body.persona || "Wanderlust Concierge",
      plannerPrompt: body.plannerPrompt || "",
    },
    update: {
      systemPrompt: body.systemPrompt ?? undefined,
      businessInfo: body.businessInfo ?? undefined,
      persona: body.persona ?? undefined,
      plannerPrompt: body.plannerPrompt ?? undefined,
    },
  });
  return NextResponse.json({ settings });
}
