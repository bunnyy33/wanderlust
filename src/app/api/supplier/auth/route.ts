import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  setSupplierCookie,
  clearSupplierCookie,
  getCurrentSupplier,
} from "@/lib/supplier-auth";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/supplier/auth — login with email + accessCode
// POST /api/supplier/auth { action: "logout" } — logout
// GET  /api/supplier/auth — check current session

export async function GET() {
  const sup = await getCurrentSupplier();
  if (!sup) {
    return NextResponse.json({ authed: false });
  }
  return NextResponse.json({
    authed: true,
    supplier: {
      id: sup.id,
      name: sup.name,
      email: sup.email ?? null,
      type: sup.type,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Logout
  if (body.action === "logout") {
    await clearSupplierCookie();
    return NextResponse.json({ ok: true });
  }

  // Login — rate limit by IP
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`supplier-login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const accessCode = String(body.accessCode ?? "").trim();

  if (!email || !accessCode) {
    return NextResponse.json(
      { error: "Email and access code are required" },
      { status: 400 },
    );
  }

  // Find supplier by email (case-insensitive equality is fine for SQLite)
  const sup = await db.supplier.findFirst({
    where: { email: { contains: email } },
  });
  if (!sup || !sup.active) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (!sup.accessCode || sup.accessCode !== accessCode) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await setSupplierCookie(sup.id);
  return NextResponse.json({
    ok: true,
    supplier: { id: sup.id, name: sup.name, email: sup.email ?? null, type: sup.type },
  });
}
