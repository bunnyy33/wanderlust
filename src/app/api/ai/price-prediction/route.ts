import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { experienceId } = body;
  if (!experienceId) return NextResponse.json({ error: "experienceId required" }, { status: 400 });
  const exp = await db.experience.findUnique({
    where: { id: experienceId },
    select: { title: true, price: true, originalPrice: true, bookedCount: true, availability: true, rating: true, destination: { select: { name: true } } },
  });
  if (!exp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const scarcity = exp.bookedCount > 1000 && exp.availability < 15;
  const hasDiscount = exp.originalPrice && exp.originalPrice > exp.price;
  const popular = exp.bookedCount > 1500;
  let recommendation: "BOOK_NOW" | "WAIT" | "STABLE", reason: string, confidence: number;
  if (scarcity && popular) { recommendation = "BOOK_NOW"; reason = `High demand (${exp.bookedCount.toLocaleString()}+ bookings) with limited spots. Prices likely to rise.`; confidence = 88; }
  else if (hasDiscount && popular) { recommendation = "BOOK_NOW"; reason = `Currently ${Math.round((1 - exp.price / (exp.originalPrice || exp.price)) * 100)}% off and selling fast.`; confidence = 82; }
  else if (!popular && exp.availability > 15) { recommendation = "WAIT"; reason = `Good availability and steady pricing. You can wait a few days.`; confidence = 64; }
  else { recommendation = "STABLE"; reason = `Prices have been stable. Book whenever fits your plans.`; confidence = 70; }
  return NextResponse.json({ recommendation, reason, confidence, title: exp.title, destination: exp.destination?.name });
}
