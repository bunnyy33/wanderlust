import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeReview } from "@/lib/transform";

// GET /api/reviews?experienceId= | hotelId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const experienceId = searchParams.get("experienceId");
  const hotelId = searchParams.get("hotelId");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

   
  const where: any = {};
  if (experienceId) where.experienceId = experienceId;
  if (hotelId) where.hotelId = hotelId;
  if (!experienceId && !hotelId) {
    return NextResponse.json({ reviews: [] });
  }

  const reviews = await db.review.findMany({
    where,
    orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return NextResponse.json({ reviews: reviews.map(serializeReview) });
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { experienceId, hotelId, authorName, rating, title, comment, travelDate } = body;

  if (!authorName || !rating || !title || !comment) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!experienceId && !hotelId) {
    return NextResponse.json({ error: "Target required" }, { status: 400 });
  }

  const review = await db.review.create({
    data: {
      experienceId: experienceId || null,
      hotelId: hotelId || null,
      authorName,
      rating: parseFloat(rating),
      title,
      comment,
      travelDate: travelDate || null,
      verified: true,
    },
  });

  // Update aggregate rating & count
  if (experienceId) {
    const exp = await db.experience.findUnique({ where: { id: experienceId } });
    if (exp) {
      const all = await db.review.findMany({ where: { experienceId }, select: { rating: true } });
      const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
      await db.experience.update({
        where: { id: experienceId },
        data: { reviewCount: exp.reviewCount + 1, rating: Math.round(avg * 10) / 10 },
      });
    }
  }
  if (hotelId) {
    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (hotel) {
      const all = await db.review.findMany({ where: { hotelId }, select: { rating: true } });
      const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
      await db.hotel.update({
        where: { id: hotelId },
        data: { reviewCount: hotel.reviewCount + 1, rating: Math.round(avg * 10) / 10 },
      });
    }
  }

  return NextResponse.json({ review: serializeReview(review) });
}
