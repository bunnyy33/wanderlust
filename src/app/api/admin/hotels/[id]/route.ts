import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeHotel } from "@/lib/transform";
import { isAdminAuthed } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// PUT /api/admin/hotels/[id] — update a hotel
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.hotel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name);
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
    if (body.starRating !== undefined)
      data.starRating = Number(body.starRating);
    if (body.pricePerNight !== undefined)
      data.pricePerNight = Number(body.pricePerNight);
    if (body.originalPrice !== undefined)
      data.originalPrice = body.originalPrice
        ? Number(body.originalPrice)
        : null;
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.images !== undefined)
      data.images = JSON.stringify(
        Array.isArray(body.images) ? body.images.map(String) : [],
      );
    if (body.amenities !== undefined)
      data.amenities = JSON.stringify(
        Array.isArray(body.amenities) ? body.amenities.map(String) : [],
      );
    if (body.roomTypes !== undefined)
      data.roomTypes = JSON.stringify(
        Array.isArray(body.roomTypes)
          ? body.roomTypes.map((r: any) => ({
              name: String(r?.name ?? ""),
              description: String(r?.description ?? ""),
              maxGuests: Number(r?.maxGuests ?? 2),
              priceModifier: Number(r?.priceModifier ?? 0),
            }))
          : [],
      );
    if (body.rating !== undefined) data.rating = Number(body.rating);
    if (body.reviewCount !== undefined)
      data.reviewCount = Number(body.reviewCount);
    if (body.checkInTime !== undefined)
      data.checkInTime = String(body.checkInTime);
    if (body.checkOutTime !== undefined)
      data.checkOutTime = String(body.checkOutTime);
    if (body.address !== undefined)
      data.address = body.address ? String(body.address) : null;
    if (body.featured !== undefined) data.featured = Boolean(body.featured);
    if (body.status !== undefined) data.status = String(body.status);

    if (body.slug !== undefined) {
      const newSlug = String(body.slug).trim();
      if (newSlug) {
        const dupe = await db.hotel.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        data.slug = dupe
          ? `${newSlug}-${Date.now().toString(36).slice(-5)}`
          : newSlug;
      }
    } else if (body.name !== undefined) {
      const newSlug = slugify(String(body.name));
      if (newSlug && newSlug !== existing.slug) {
        const dupe = await db.hotel.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        data.slug = dupe
          ? `${newSlug}-${Date.now().toString(36).slice(-5)}`
          : newSlug;
      }
    }

    const updated = await db.hotel.update({
      where: { id },
      data,
      include: { destination: true },
    });
    return NextResponse.json({ hotel: serializeHotel(updated) });
  } catch (err) {
    console.error("admin update hotel error:", err);
    return NextResponse.json(
      { error: "Failed to update hotel" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/hotels/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.hotel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }
    await db.hotel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin delete hotel error:", err);
    return NextResponse.json(
      { error: "Failed to delete hotel" },
      { status: 500 },
    );
  }
}
