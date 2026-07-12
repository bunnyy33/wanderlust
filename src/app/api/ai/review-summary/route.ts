import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { experienceId, hotelId } = body;
  if (!experienceId && !hotelId) {
    return NextResponse.json({ error: "Target required" }, { status: 400 });
  }
  const reviews = await db.review.findMany({
    where: experienceId ? { experienceId } : { hotelId },
    select: { title: true, comment: true, rating: true },
    take: 40, orderBy: { helpful: "desc" },
  });
  if (reviews.length === 0) {
    return NextResponse.json({ summary: null, message: "No reviews yet to summarize." });
  }
  const reviewText = reviews.map((r) => `(${r.rating}★) ${r.title}: ${r.comment}`).join("\n");
  const systemPrompt = `You are a travel review analyst. Given traveler reviews, produce a concise summary. Respond with VALID JSON ONLY: { "loved": ["3 short phrases"], "watchOut": ["1-2 short things or empty array"], "verdict": "one punchy sentence" }. Keep phrases under 6 words.`;
  try {
    const { zaiChat } = await import("@/lib/zai-client");
    const raw = await zaiChat([
      { role: "assistant", content: systemPrompt },
      { role: "user", content: `Reviews:\n${reviewText}` },
    ]);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    try {
      const summary = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
      return NextResponse.json({ summary });
    } catch {
      return NextResponse.json({ summary: null, message: "Could not summarize reviews." });
    }
  } catch (err) {
    console.error("AI review summary error:", err);
    return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
  }
}
