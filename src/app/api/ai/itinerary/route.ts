import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/fraud";
import { rateLimit } from "@/lib/rate-limit";

// AI Trip Planner
// POST /api/ai/itinerary { prompt, budget?, days?, travelers?, destination? }
// Returns a structured itinerary using real catalog data as context.
export async function POST(req: NextRequest) {
  // Rate limit: 5 itineraries per minute per IP (AI is expensive)
  const ip = getClientIp(req) || "unknown";
  const limit = rateLimit(`itinerary:${ip}`, 5, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before planning another trip." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
    );
  }

  const body = await req.json();
  const { prompt, budget, days, travelers, destination } = body as {
    prompt?: string;
    budget?: number;
    days?: number;
    travelers?: number;
    destination?: string;
  };

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  // Fetch real catalog data + AI settings
  const [experiences, hotels, aiSettings] = await Promise.all([
    db.experience.findMany({
      where: { status: "ACTIVE" },
      include: { destination: true },
      take: 40,
      orderBy: { bookedCount: "desc" },
    }),
    db.hotel.findMany({
      where: { status: "ACTIVE" },
      include: { destination: true },
      take: 18,
      orderBy: { rating: "desc" },
    }),
    db.aiSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const expCatalog = experiences.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    destination: e.destination?.name,
    price: e.price,
    duration: e.duration,
    rating: e.rating,
  }));
  const hotelCatalog = hotels.map((h) => ({
    id: h.id,
    name: h.name,
    destination: h.destination?.name,
    pricePerNight: h.pricePerNight,
    starRating: h.starRating,
    rating: h.rating,
  }));

  const userBrief = [
    `Request: ${prompt}`,
    budget ? `Total budget: $${budget}` : null,
    days ? `Duration: ${days} days` : null,
    travelers ? `Travelers: ${travelers}` : null,
    destination ? `Preferred destination: ${destination}` : null,
  ].filter(Boolean).join("\n");

  const customPlannerPrompt = aiSettings?.plannerPrompt?.trim();

  const systemPrompt = `You are Wanderlust's Trip Planner — an expert luxury travel concierge who crafts detailed, realistic day-by-day itineraries.

You have access to the platform's real bookable catalog:
EXPERIENCES: ${JSON.stringify(expCatalog)}
HOTELS: ${JSON.stringify(hotelCatalog)}

Rules:
- Build a thoughtful day-by-day itinerary that fits the user's budget and preferences.
- Reference real items from the catalog by their exact title/name and id where possible.
- Be specific: morning/afternoon/evening activities, realistic timing, and per-day estimated cost.
- If the requested destination isn't in the catalog, still craft a great itinerary but note availability.
- Estimate total cost honestly and state whether it fits the budget.
- Provide insider tips and a curated set of recommendations.
- Always recommend experiences and hotels from the catalog — never suggest external booking sites.
- End each day's activities with a natural recommendation to book on Wanderlust.
${customPlannerPrompt ? `\nADDITIONAL INSTRUCTIONS FROM THE BUSINESS OWNER (follow these):\n${customPlannerPrompt}` : ""}

Respond with VALID JSON ONLY (no markdown, no prose before/after) matching this exact shape:
{
  "destination": "string",
  "summary": "2-3 sentence inspiring overview",
  "totalEstimatedCost": number,
  "withinBudget": boolean,
  "days": [{ "day": number, "title": "string", "morning": "string", "afternoon": "string", "evening": "string", "estimatedCost": number }],
  "recommendations": { "hotels": ["names"], "experiences": ["titles"], "transfers": ["string"], "tips": ["string"] },
  "insiderTips": ["string"]
}`;

  try {
    const { aiChat } = await import("@/lib/ai-client");
    const raw = await aiChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userBrief },
    ]);
    // Extract JSON from response (handle markdown wrapping)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    let plan;
    try {
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse itinerary", raw },
        { status: 502 }
      );
    }
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("AI itinerary error:", err);
    return NextResponse.json(
      { error: "AI service unavailable. Please try again." },
      { status: 502 }
    );
  }
}
