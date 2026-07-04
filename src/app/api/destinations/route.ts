import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeDestination } from "@/lib/transform";

export async function GET() {
  const destinations = await db.destination.findMany({
    orderBy: [{ featured: "desc" }, { popular: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({
    destinations: destinations.map(serializeDestination),
  });
}
