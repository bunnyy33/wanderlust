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

// POST /api/admin/destinations — create a new destination
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
    const country = String(body.country ?? "").trim();
    if (!country) {
      return NextResponse.json(
        { error: "country is required" },
        { status: 400 },
      );
    }
    const description = String(body.description ?? "").trim();
    if (!description) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }
    const image = String(body.image ?? "").trim();
    if (!image) {
      return NextResponse.json(
        { error: "image URL is required" },
        { status: 400 },
      );
    }

    let slug = String(body.slug ?? "").trim();
    if (!slug) slug = slugify(name);
    const existing = await db.destination.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-5)}`;

    const created = await db.destination.create({
      data: {
        name,
        slug,
        country,
        city: body.city ? String(body.city) : null,
        region: body.region ? String(body.region) : null,
        description,
        longDescription: body.longDescription
          ? String(body.longDescription)
          : null,
        image,
        heroImage: body.heroImage ? String(body.heroImage) : null,
        popular: Boolean(body.popular ?? false),
        featured: Boolean(body.featured ?? false),
      },
    });

    return NextResponse.json({ destination: serializeDestination(created) });
  } catch (err) {
    console.error("admin create destination error:", err);
    return NextResponse.json(
      { error: "Failed to create destination" },
      { status: 500 },
    );
  }
}
