import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSessionUser,
} from "@/lib/customer-auth";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body.action === "logout") {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "signup") {
    const { email, password, name } = body;
    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: { email: String(email).toLowerCase(), name, passwordHash, phone: body.phone || null },
      select: { id: true, email: true, name: true, phone: true },
    });
    await setSessionCookie(user.id, user.email);
    return NextResponse.json({ user });
  }

  if (body.action === "login") {
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await setSessionCookie(user.id, user.email);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
