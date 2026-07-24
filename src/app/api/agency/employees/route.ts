import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/employee-auth";
import { serializeEmployee } from "@/lib/agency-types";

// GET /api/agency/employees
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "1";

    const where: any = {};
    if (activeOnly) where.active = true;

    const employees = await db.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ employees: employees.map(serializeEmployee) });
  } catch (err) {
    console.error("agency employees GET error:", err);
    return NextResponse.json({ error: "Failed to load employees" }, { status: 500 });
  }
}

// POST /api/agency/employees
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const existing = await db.employee.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "email already in use" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const created = await db.employee.create({
      data: {
        name,
        email,
        passwordHash,
        role: String(body.role ?? "JUNIOR_AGENT"),
        phone: body.phone ? String(body.phone) : null,
        active: Boolean(body.active ?? true),
      },
    });
    return NextResponse.json({ employee: serializeEmployee(created) });
  } catch (err) {
    console.error("agency employee POST error:", err);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
