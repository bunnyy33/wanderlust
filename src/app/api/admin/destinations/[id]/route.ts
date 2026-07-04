import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeDestination } from "@/lib/transform";
import { isAdminAuthed } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// PUT /api/admin/destinations/[id] — update a destination
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.destination.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 },
      );
    }
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name);
    if (body.country !== undefined) data.country = String(body.country);
    if (body.city !== undefined)
      data.city = body.city ? String(body.city) : null;
    if (body.region !== undefined)
      data.region = body.region ? String(body.region) : null;
    if (body.description !== undefined)
      data.description = String(body.description);
    if (body.longDescription !== undefined)
      data.longDescription = body.longDescription
        ? String(body.longDescription)
        : null;
    if (body.image !== undefined) data.image = String(body.image);
    if (body.heroImage !== undefined)
      data.heroImage = body.heroImage ? String(body.heroImage) : null;
    if (body.popular !== undefined) data.popular = Boolean(body.popular);
    if (body.featured !== undefined) data.featured = Boolean(body.featured);

    if (body.slug !== undefined) {
      const newSlug = String(body.slug).trim();
      if (newSlug) {
        const dupe = await db.destination.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        data.slug = dupe
          ? `${newSlug}-${Date.now().toString(36).slice(-5)}`
          : newSlug;
      }
    } else if (body.name !== undefined) {
      const newSlug = slugify(String(body.name));
      if (newSlug && newSlug !== existing.slug) {
        const dupe = await db.destination.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        data.slug = dupe
          ? `${newSlug}-${Date.now().toString(36).slice(-5)}`
          : newSlug;
      }
    }

    const updated = await db.destination.update({ where: { id }, data });
    return NextResponse.json({ destination: serializeDestination(updated) });
  } catch (err) {
    console.error("admin update destination error:", err);
    return NextResponse.json(
      { error: "Failed to update destination" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/destinations/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.destination.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 },
      );
    }
    // Block delete if experiences or hotels reference it
    const [expCount, hotelCount] = await Promise.all([
      db.experience.count({ where: { destinationId: id } }),
      db.hotel.count({ where: { destinationId: id } }),
    ]);
    if (expCount > 0 || hotelCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete destination with ${expCount} experience(s) and ${hotelCount} hotel(s) attached. Reassign or remove them first.`,
        },
        { status: 409 },
      );
    }
    await db.destination.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin delete destination error:", err);
    return NextResponse.json(
      { error: "Failed to delete destination" },
      { status: 500 },
    );
  }
}
