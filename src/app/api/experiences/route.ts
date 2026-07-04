import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeExperience } from "@/lib/transform";

// GET /api/experiences?type=&destination=&q=&minPrice=&maxPrice=&sort=&limit=&featured=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const destinationSlug = searchParams.get("destination");
  const q = searchParams.get("q")?.trim();
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "popular";
  const limit = parseInt(searchParams.get("limit") || "0", 10);
  const featured = searchParams.get("featured");
  const bestseller = searchParams.get("bestseller");

   
  const where: any = { status: "ACTIVE" };
  if (type && type !== "ALL") where.type = type;
  if (featured === "true") where.featured = true;
  if (bestseller === "true") where.bestseller = true;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { longDescription: { contains: q } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (destinationSlug && destinationSlug !== "all") {
    const dest = await db.destination.findUnique({ where: { slug: destinationSlug } });
    if (dest) where.destinationId = dest.id;
  }

   
  let orderBy: any = { bookedCount: "desc" };
  if (sort === "price-low") orderBy = { price: "asc" };
  else if (sort === "price-high") orderBy = { price: "desc" };
  else if (sort === "rating") orderBy = { rating: "desc" };
  else if (sort === "duration") orderBy = { durationHours: "asc" };

  const experiences = await db.experience.findMany({
    where,
    orderBy,
    include: { destination: true },
    ...(limit ? { take: limit } : {}),
  });

  return NextResponse.json({
    experiences: experiences.map(serializeExperience),
    count: experiences.length,
  });
}
