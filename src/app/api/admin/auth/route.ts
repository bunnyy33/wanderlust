import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_PASSWORD,
  isAdminAuthed,
  setAdminCookie,
  clearAdminCookie,
} from "@/lib/admin-auth";

// POST /api/admin/auth  { password } → login
// POST /api/admin/auth  { action: "logout" } → logout
// GET  /api/admin/auth  → check current session
export async function GET() {
  const authed = await isAdminAuthed();
  return NextResponse.json({ authed });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body.action === "logout") {
    await clearAdminCookie();
    return NextResponse.json({ ok: true });
  }

  const password = body.password;
  if (typeof password !== "string" || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true, authed: true });
}
