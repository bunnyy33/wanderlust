import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeHotel, serializeReview } from "@/lib/transform";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hotel = await db.hotel.findUnique({
    where: { id },
    include: { destination: true },
  });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  const reviews = await db.review.findMany({
    where: { hotelId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    hotel: serializeHotel(hotel),
    reviews: reviews.map(serializeReview),
  });
}
