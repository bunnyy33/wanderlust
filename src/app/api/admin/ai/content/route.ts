import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

// POST /api/admin/ai/content { title, destination, type }
// Generates luxury longDescription + 5 highlights + SEO title + 3 FAQs as JSON.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const destination = String(body.destination ?? "").trim();
    const type = String(body.type ?? "TOUR").trim();

    if (!title || !destination) {
      return NextResponse.json(
        { error: "title and destination are required" },
        { status: 400 },
      );
    }

    const systemPrompt =
      "You are a luxury travel copywriter. Generate compelling content for this tour. Respond with JSON ONLY: {longDescription, highlights[], seoTitle, faqs:[{q,a}]}";

    const userPrompt = `Tour title: ${title}
Destination: ${destination}
Type: ${type}

Write a rich, evocative longDescription (2-3 paragraphs, around 120-160 words) that paints a sensory, premium picture of this experience for high-end travellers.
Then provide exactly 5 highlight strings (short benefit-driven bullet phrases, no leading dashes).
Then an seoTitle (max 60 chars, enticing, includes the destination).
Then exactly 3 FAQ objects each with a question ("q") and answer ("a", 1-2 sentences).

Return STRICT JSON ONLY — no markdown, no prose, no code fences. Schema:
{"longDescription": string, "highlights": string[5], "seoTitle": string, "faqs": [{"q": string, "a": string}]}`;

    const { zaiChat } = await import("@/lib/zai-client");
    const raw = await zaiChat([
      { role: "assistant", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Extract JSON from response (handles fenced or bare)
    let jsonText = raw.trim();
    const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) jsonText = fence[1].trim();
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      jsonText = jsonText.slice(first, last + 1);
    }

    let parsed: {
      longDescription?: string;
      highlights?: string[];
      seoTitle?: string;
      faqs?: { q: string; a: string }[];
    };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        {
          error: "AI returned malformed content",
          raw,
          longDescription: raw,
          highlights: [],
          seoTitle: title,
          faqs: [],
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      longDescription: String(parsed.longDescription ?? "").trim(),
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.map(String).slice(0, 5)
        : [],
      seoTitle: String(parsed.seoTitle ?? title).trim(),
      faqs: Array.isArray(parsed.faqs)
        ? parsed.faqs
            .filter((f) => f && typeof f === "object")
            .slice(0, 3)
            .map((f) => ({
              q: String(f.q ?? "").trim(),
              a: String(f.a ?? "").trim(),
            }))
        : [],
    });
  } catch (err) {
    console.error("admin AI content error:", err);
    return NextResponse.json(
      { error: "AI content generation failed. Please try again." },
      { status: 502 },
    );
  }
}
