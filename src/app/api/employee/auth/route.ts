import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  setEmployeeCookie,
  clearEmployeeCookie,
  getCurrentEmployee,
} from "@/lib/employee-auth";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/employee/auth — login with email + password
// POST /api/employee/auth { action: "logout" } — logout
// GET  /api/employee/auth — check current session

export async function GET() {
  const emp = await getCurrentEmployee();
  if (!emp) {
    return NextResponse.json({ authed: false });
  }
  return NextResponse.json({
    authed: true,
    employee: {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Logout
  if (body.action === "logout") {
    await clearEmployeeCookie();
    return NextResponse.json({ ok: true });
  }

  // Login — rate limit by IP
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`employee-login:${ip}`, 10, 15 * 60 * 1000); // 10 attempts per 15 min
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const emp = await db.employee.findUnique({ where: { email } });
  if (!emp || !emp.active) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  if (!verifyPassword(password, emp.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  await setEmployeeCookie(emp.id);
  return NextResponse.json({
    ok: true,
    employee: { id: emp.id, name: emp.name, email: emp.email, role: emp.role },
  });
}
