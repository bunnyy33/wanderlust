import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/transform";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/bookings?status=&type=&q=&limit=
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim();
  const limit = parseInt(searchParams.get("limit") || "50", 10);

   
  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (type && type !== "ALL") where.type = type;
  if (q) {
    where.OR = [
      { reference: { contains: q } },
      { customerName: { contains: q } },
      { customerEmail: { contains: q } },
    ];
  }

  const bookings = await db.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { experience: { include: { destination: true } }, hotel: { include: { destination: true } } },
  });

  return NextResponse.json({ bookings: bookings.map(serializeBooking) });
}
