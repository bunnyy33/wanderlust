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

// PUT /api/admin/experiences/[id] — update an experience
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.experience.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 },
      );
    }
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.type !== undefined) data.type = String(body.type);
    if (body.description !== undefined)
      data.description = String(body.description);
    if (body.longDescription !== undefined)
      data.longDescription = String(body.longDescription);
    if (body.destinationId !== undefined) {
      const dest = await db.destination.findUnique({
        where: { id: String(body.destinationId) },
      });
      if (!dest) {
        return NextResponse.json(
          { error: "destination not found" },
          { status: 400 },
        );
      }
      data.destinationId = String(body.destinationId);
    }
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.originalPrice !== undefined)
      data.originalPrice = body.originalPrice
        ? Number(body.originalPrice)
        : null;
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.duration !== undefined) data.duration = String(body.duration);
    if (body.durationHours !== undefined)
      data.durationHours = Number(body.durationHours);
    if (body.rating !== undefined) data.rating = Number(body.rating);
    if (body.reviewCount !== undefined)
      data.reviewCount = Number(body.reviewCount);
    if (body.images !== undefined)
      data.images = JSON.stringify(
        Array.isArray(body.images) ? body.images.map(String) : [],
      );
    if (body.highlights !== undefined)
      data.highlights = JSON.stringify(
        Array.isArray(body.highlights) ? body.highlights.map(String) : [],
      );
    if (body.itinerary !== undefined)
      data.itinerary = JSON.stringify(
        Array.isArray(body.itinerary) ? body.itinerary : [],
      );
    if (body.includes !== undefined)
      data.includes = JSON.stringify(
        Array.isArray(body.includes) ? body.includes.map(String) : [],
      );
    if (body.excludes !== undefined)
      data.excludes = JSON.stringify(
        Array.isArray(body.excludes) ? body.excludes.map(String) : [],
      );
    if (body.groupSize !== undefined) data.groupSize = Number(body.groupSize);
    if (body.language !== undefined) data.language = String(body.language);
    if (body.meetingPoint !== undefined)
      data.meetingPoint = body.meetingPoint ? String(body.meetingPoint) : null;
    if (body.cancellationPolicy !== undefined)
      data.cancellationPolicy = String(body.cancellationPolicy);
    if (body.availability !== undefined)
      data.availability = Number(body.availability);
    if (body.bookedCount !== undefined)
      data.bookedCount = Number(body.bookedCount);
    if (body.vendorName !== undefined) data.vendorName = String(body.vendorName);
    if (body.featured !== undefined) data.featured = Boolean(body.featured);
    if (body.bestseller !== undefined)
      data.bestseller = Boolean(body.bestseller);
    if (body.tags !== undefined)
      data.tags = JSON.stringify(
        Array.isArray(body.tags) ? body.tags.map(String) : [],
      );
    if (body.latitude !== undefined)
      data.latitude = body.latitude ? Number(body.latitude) : null;
    if (body.longitude !== undefined)
      data.longitude = body.longitude ? Number(body.longitude) : null;
    if (body.status !== undefined) data.status = String(body.status);

    // slug handling — regenerate if title changed and slug not provided
    if (body.slug !== undefined) {
      const newSlug = String(body.slug).trim();
      if (newSlug) {
        const dupe = await db.experience.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        if (dupe) {
          data.slug = `${newSlug}-${Date.now().toString(36).slice(-5)}`;
        } else {
          data.slug = newSlug;
        }
      }
    } else if (body.title !== undefined) {
      const newSlug = slugify(String(body.title));
      if (newSlug && newSlug !== existing.slug) {
        const dupe = await db.experience.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        data.slug = dupe
          ? `${newSlug}-${Date.now().toString(36).slice(-5)}`
          : newSlug;
      }
    }

    const updated = await db.experience.update({
      where: { id },
      data,
      include: { destination: true },
    });
    return NextResponse.json({ experience: serializeExperience(updated) });
  } catch (err) {
    console.error("admin update experience error:", err);
    return NextResponse.json(
      { error: "Failed to update experience" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/experiences/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.experience.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 },
      );
    }
    await db.experience.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin delete experience error:", err);
    return NextResponse.json(
      { error: "Failed to delete experience" },
      { status: 500 },
    );
  }
}
