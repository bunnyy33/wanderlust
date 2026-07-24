import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeExperience } from "@/lib/transform";
import { unstable_cache } from "next/cache";

// Cached catalog fetch — revalidates every 5 minutes (tours don't change often)
const getCachedExperiences = unstable_cache(
  async (where: any, sort: any, limit: number) => {
    return db.experience.findMany({
      where,
      orderBy: sort,
      take: limit || undefined,
      include: { destination: true, reviews: { select: { rating: true } } },
    });
  },
  ["experiences-catalog"],
  { revalidate: 300 } // 5 minutes
);

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

  // Skip cache for search queries (q) since results vary widely
  const useCache = !q && !destinationSlug;
  let experiences;
  if (useCache) {
    experiences = await getCachedExperiences(where, orderBy, limit);
  } else {
    experiences = await db.experience.findMany({
      where,
      orderBy,
      include: { destination: true },
      ...(limit ? { take: limit } : {}),
    });
  }

  return NextResponse.json({
    experiences: experiences.map(serializeExperience),
    count: experiences.length,
  });
}
