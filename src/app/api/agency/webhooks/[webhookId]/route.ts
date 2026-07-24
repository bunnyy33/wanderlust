import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

interface ctx {
  params: Promise<{ webhookId: string }>;
}

// DELETE /api/agency/webhooks/[webhookId] — remove a webhook
export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { webhookId } = await params;
    const existing = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }
    await db.webhook.delete({ where: { id: webhookId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency webhook DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}

// PUT /api/agency/webhooks/[webhookId] — update webhook (toggle active, change events)
export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { webhookId } = await params;
    const existing = await db.webhook.findUnique({ where: { id: webhookId } });
    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.url !== undefined) {
      const url = String(body.url).trim();
      if (url && !/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: "url must start with http:// or https://" }, { status: 400 });
      }
      if (url) data.url = url;
    }
    if (body.events !== undefined) data.events = String(body.events);
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.secret !== undefined) {
      // Allow rotating the secret — pass null to remove
      data.secret = body.secret ? String(body.secret) : null;
    }

    const updated = await db.webhook.update({ where: { id: webhookId }, data });
    return NextResponse.json({
      webhook: {
        id: updated.id,
        url: updated.url,
        events: updated.events,
        active: updated.active,
        secret: updated.secret ? "***" : null,
        hasSecret: !!updated.secret,
        createdAt: updated.createdAt?.toISOString?.() ?? updated.createdAt,
      },
    });
  } catch (err) {
    console.error("agency webhook PUT error:", err);
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
  }
}
