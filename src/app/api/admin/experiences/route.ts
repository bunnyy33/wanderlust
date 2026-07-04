import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeExperience } from "@/lib/transform";
import { isAdminAuthed } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// POST /api/admin/experiences — create a new experience
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const type = String(body.type ?? "TOUR").trim() || "TOUR";
    const destinationId = String(body.destinationId ?? "").trim();
    if (!destinationId) {
      return NextResponse.json(
        { error: "destinationId is required" },
        { status: 400 },
      );
    }
    const destination = await db.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) {
      return NextResponse.json(
        { error: "destination not found" },
        { status: 400 },
      );
    }

    const price = Number(body.price ?? 0);
    const description = String(body.description ?? "").trim();
    const longDescription = String(body.longDescription ?? "").trim();
    const duration = String(body.duration ?? "").trim();

    const images = Array.isArray(body.images)
      ? body.images.map(String)
      : Array.isArray(body.images)
        ? body.images
        : [];
    const highlights = Array.isArray(body.highlights)
      ? body.highlights.map(String)
      : [];
    const itinerary = Array.isArray(body.itinerary) ? body.itinerary : [];
    const includes = Array.isArray(body.includes)
      ? body.includes.map(String)
      : [];
    const excludes = Array.isArray(body.excludes)
      ? body.excludes.map(String)
      : [];
    const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

    let slug = String(body.slug ?? "").trim();
    if (!slug) slug = slugify(title);
    // ensure unique slug
    const existing = await db.experience.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-5)}`;

    const created = await db.experience.create({
      data: {
        title,
        slug,
        type,
        description,
        longDescription,
        destinationId,
        price,
        originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
        currency: String(body.currency ?? "USD"),
        duration,
        durationHours: Number(body.durationHours ?? 4),
        rating: Number(body.rating ?? 4.8),
        reviewCount: Number(body.reviewCount ?? 0),
        images: JSON.stringify(images),
        highlights: JSON.stringify(highlights),
        itinerary: JSON.stringify(itinerary),
        includes: JSON.stringify(includes),
        excludes: JSON.stringify(excludes),
        groupSize: Number(body.groupSize ?? 12),
        language: String(body.language ?? "English"),
        meetingPoint: body.meetingPoint ? String(body.meetingPoint) : null,
        cancellationPolicy: String(
          body.cancellationPolicy ??
            "Free cancellation up to 24 hours before the experience.",
        ),
        availability: Number(body.availability ?? 20),
        bookedCount: Number(body.bookedCount ?? 0),
        vendorName: String(body.vendorName ?? "Wanderlust Verified Partner"),
        featured: Boolean(body.featured ?? false),
        bestseller: Boolean(body.bestseller ?? false),
        tags: JSON.stringify(tags),
        latitude: body.latitude ? Number(body.latitude) : null,
        longitude: body.longitude ? Number(body.longitude) : null,
        status: String(body.status ?? "ACTIVE"),
      },
      include: { destination: true },
    });

    return NextResponse.json({ experience: serializeExperience(created) });
  } catch (err) {
    console.error("admin create experience error:", err);
    return NextResponse.json(
      { error: "Failed to create experience" },
      { status: 500 },
    );
  }
}
