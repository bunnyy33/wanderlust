import { NextResponse } from "next/server";
import { getCurrentEmployee } from "@/lib/employee-auth";

// GET /api/employee/me — current logged-in employee info
export async function GET() {
  const emp = await getCurrentEmployee();
  if (!emp) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    employee: {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
    },
  });
}
