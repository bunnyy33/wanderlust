import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/agency/webhooks — list registered webhooks
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "1";

    const where: any = {};
    if (activeOnly) where.active = true;

    const webhooks = await db.webhook.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        active: w.active,
        secret: w.secret ? "***" : null, // never echo the actual secret back
        hasSecret: !!w.secret,
        createdAt: w.createdAt?.toISOString?.() ?? w.createdAt,
      })),
    });
  } catch (err) {
    console.error("agency webhooks GET error:", err);
    return NextResponse.json({ error: "Failed to load webhooks" }, { status: 500 });
  }
}

// POST /api/agency/webhooks — register a new webhook
// Body: { url, events?, secret?, active? }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const url = String(body.url ?? "").trim();
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "url must start with http:// or https://" }, { status: 400 });
    }

    const events = String(body.events ?? "BOOKING_STATUS_CHANGE").trim();
    const secret = body.secret ? String(body.secret) : null;
    const active = Boolean(body.active ?? true);

    const created = await db.webhook.create({
      data: {
        url,
        events,
        active,
        secret: secret ?? randomBytes(16).toString("hex"), // auto-generate a secret if not provided
      },
    });

    return NextResponse.json({
      webhook: {
        id: created.id,
        url: created.url,
        events: created.events,
        active: created.active,
        secret: created.secret, // only returned ONCE at creation time so the user can copy it
        hasSecret: !!created.secret,
        createdAt: created.createdAt?.toISOString?.() ?? created.createdAt,
      },
    });
  } catch (err) {
    console.error("agency webhook POST error:", err);
    return NextResponse.json({ error: "Failed to register webhook" }, { status: 500 });
  }
}
