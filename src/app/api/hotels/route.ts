import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeHotel } from "@/lib/transform";

// GET /api/hotels?destination=&q=&minPrice=&maxPrice=&stars=&sort=&limit=&featured=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destinationSlug = searchParams.get("destination");
  const q = searchParams.get("q")?.trim();
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const stars = searchParams.get("stars");
  const sort = searchParams.get("sort") || "popular";
  const limit = parseInt(searchParams.get("limit") || "0", 10);
  const featured = searchParams.get("featured");

   
  const where: any = { status: "ACTIVE" };
  if (featured === "true") where.featured = true;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (minPrice || maxPrice) {
    where.pricePerNight = {};
    if (minPrice) where.pricePerNight.gte = parseFloat(minPrice);
    if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice);
  }
  if (stars) where.starRating = parseInt(stars, 10);

  if (destinationSlug && destinationSlug !== "all") {
    const dest = await db.destination.findUnique({ where: { slug: destinationSlug } });
    if (dest) where.destinationId = dest.id;
  }

   
  let orderBy: any = { rating: "desc" };
  if (sort === "price-low") orderBy = { pricePerNight: "asc" };
  else if (sort === "price-high") orderBy = { pricePerNight: "desc" };
  else if (sort === "rating") orderBy = { rating: "desc" };

  const hotels = await db.hotel.findMany({
    where,
    orderBy,
    include: { destination: true },
    ...(limit ? { take: limit } : {}),
  });

  return NextResponse.json({
    hotels: hotels.map(serializeHotel),
    count: hotels.length,
  });
}
