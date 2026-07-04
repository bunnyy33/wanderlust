import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeExperience, serializeHotel } from "@/lib/transform";

// GET /api/wishlist?sessionId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ items: [] });

  const items = await db.wishlist.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });
  const experienceIds = items.filter((i) => i.experienceId).map((i) => i.experienceId!);
  const hotelIds = items.filter((i) => i.hotelId).map((i) => i.hotelId!);

  const experiences = experienceIds.length
    ? await db.experience.findMany({ where: { id: { in: experienceIds } }, include: { destination: true } })
    : [];
  const hotels = hotelIds.length
    ? await db.hotel.findMany({ where: { id: { in: hotelIds } }, include: { destination: true } })
    : [];

  return NextResponse.json({
    items: [
      ...experiences.map((e) => ({ kind: "EXPERIENCE" as const, id: e.id, data: serializeExperience(e) })),
      ...hotels.map((h) => ({ kind: "HOTEL" as const, id: h.id, data: serializeHotel(h) })),
    ],
  });
}

// POST /api/wishlist — toggle/add
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, experienceId, hotelId } = body;
  if (!sessionId || (!experienceId && !hotelId)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await db.wishlist.findFirst({
    where: { sessionId, experienceId: experienceId || null, hotelId: hotelId || null },
  });
  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await db.wishlist.create({
    data: { sessionId, experienceId: experienceId || null, hotelId: hotelId || null },
  });
  return NextResponse.json({ action: "added" });
}
