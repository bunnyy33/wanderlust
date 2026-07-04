import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeExperience, serializeReview } from "@/lib/transform";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const experience = await db.experience.findUnique({
    where: { id },
    include: { destination: true },
  });
  if (!experience) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }
  const reviews = await db.review.findMany({
    where: { experienceId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    experience: serializeExperience(experience),
    reviews: reviews.map(serializeReview),
  });
}
