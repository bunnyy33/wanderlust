import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeExperience } from "@/lib/transform";

// AI Tour Recommendation
// POST /api/ai/recommendations { budget?, travelers?, vibe?, destination?, weather? }
// Returns a ranked list of recommended experience ids + reasoning.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { budget, travelers, vibe, destination, weather } = body as {
    budget?: number;
    travelers?: number;
    vibe?: string;
    destination?: string;
    weather?: string;
  };

  const experiences = await db.experience.findMany({
    where: { status: "ACTIVE" },
    include: { destination: true },
    take: 40,
    orderBy: { bookedCount: "desc" },
  });

  const catalog = experiences.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    destination: e.destination?.name,
    price: e.price,
    duration: e.duration,
    rating: e.rating,
    tags: e.tags,
    bestseller: e.bestseller,
  }));

  const brief = [
    `Budget: ${budget ? "$" + budget : "flexible"}`,
    `Travelers: ${travelers || "unspecified"}`,
    `Vibe/interest: ${vibe || "general"}`,
    `Destination preference: ${destination || "any"}`,
    `Weather/season: ${weather || "any"}`,
  ].join("\n");

  const systemPrompt = `You are an AI travel recommendation engine for Wanderlust. Given a traveler profile and the catalog below, pick the 6 best-matching experiences and explain briefly why each fits.

CATALOG: ${JSON.stringify(catalog)}

Respond with VALID JSON ONLY matching:
{ "recommendations": [{ "id": "experience id", "reason": "one short sentence why it fits" }] }

Pick exactly 6 ids that exist in the catalog. Respect budget. Prefer matching destination/vibe/weather.`;

  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: brief },
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    let parsed: { recommendations: { id: string; reason: string }[] };
    try {
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      parsed = { recommendations: [] };
    }

    // Hydrate with full experience data
    const recIds = parsed.recommendations.map((r) => r.id);
    const full = experiences.filter((e) => recIds.includes(e.id));
    const reasons = new Map(parsed.recommendations.map((r) => [r.id, r.reason]));
    const ordered = recIds
      .map((id) => full.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => ({ experience: serializeExperience(e), reason: reasons.get(e!.id) || "" }));

    return NextResponse.json({ recommendations: ordered });
  } catch (err) {
    console.error("AI recommendations error:", err);
    return NextResponse.json(
      { error: "Recommendation engine unavailable", recommendations: [] },
      { status: 502 }
    );
  }
}
