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

// POST /api/admin/hotels — create a new hotel
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
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

    const description = String(body.description ?? "").trim();
    const longDescription = String(body.longDescription ?? "").trim();
    const pricePerNight = Number(body.pricePerNight ?? 0);

    const images = Array.isArray(body.images) ? body.images.map(String) : [];
    const amenities = Array.isArray(body.amenities)
      ? body.amenities.map(String)
      : [];
    const roomTypes = Array.isArray(body.roomTypes)
      ? body.roomTypes.map((r: any) => ({
          name: String(r?.name ?? ""),
          description: String(r?.description ?? ""),
          maxGuests: Number(r?.maxGuests ?? 2),
          priceModifier: Number(r?.priceModifier ?? 0),
        }))
      : [];

    let slug = String(body.slug ?? "").trim();
    if (!slug) slug = slugify(name);
    const existing = await db.hotel.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-5)}`;

    const created = await db.hotel.create({
      data: {
        name,
        slug,
        description,
        longDescription,
        destinationId,
        starRating: Number(body.starRating ?? 5),
        pricePerNight,
        originalPrice: body.originalPrice
          ? Number(body.originalPrice)
          : null,
        currency: String(body.currency ?? "USD"),
        images: JSON.stringify(images),
        amenities: JSON.stringify(amenities),
        roomTypes: JSON.stringify(roomTypes),
        rating: Number(body.rating ?? 4.8),
        reviewCount: Number(body.reviewCount ?? 0),
        checkInTime: String(body.checkInTime ?? "14:00"),
        checkOutTime: String(body.checkOutTime ?? "12:00"),
        address: body.address ? String(body.address) : null,
        featured: Boolean(body.featured ?? false),
        status: String(body.status ?? "ACTIVE"),
      },
      include: { destination: true },
    });

    return NextResponse.json({ hotel: serializeHotel(created) });
  } catch (err) {
    console.error("admin create hotel error:", err);
    return NextResponse.json(
      { error: "Failed to create hotel" },
      { status: 500 },
    );
  }
}
