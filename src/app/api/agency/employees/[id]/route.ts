import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { serializeEmployee } from "@/lib/agency-types";

interface ctx {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name);
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (email && email !== existing.email) {
        const dup = await db.employee.findUnique({ where: { email } });
        if (dup) {
          return NextResponse.json({ error: "email already in use" }, { status: 409 });
        }
      }
      data.email = email;
    }
    if (body.role !== undefined) data.role = String(body.role);
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone) : null;
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.password !== undefined) {
      const password = String(body.password);
      if (password && password.length >= 6) {
        data.passwordHash = await bcrypt.hash(password, 10);
      }
    }

    const updated = await db.employee.update({ where: { id }, data });
    return NextResponse.json({ employee: serializeEmployee(updated) });
  } catch (err) {
    console.error("agency employee PUT error:", err);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: ctx) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    await db.employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("agency employee DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
