// AI client — Gemini Flash (primary) + Groq (fallback)
// Both free, no credit card needed

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Gemini Flash config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.gemini_api_key || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Groq fallback config
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function aiChat(messages: ChatMessage[]): Promise<string> {
  // Try Gemini first (better quality)
  if (GEMINI_API_KEY) {
    try {
      return await geminiChat(messages);
    } catch (err) {
      console.error("Gemini failed, falling back to Groq:", err);
    }
  }

  // Fallback to Groq
  if (GROQ_API_KEY) {
    return await groqChat(messages);
  }

  throw new Error("No AI API key configured. Set GEMINI_API_KEY or GROQ_API_KEY in Vercel env vars.");
}

async function geminiChat(messages: ChatMessage[]): Promise<string> {
  // Convert messages to Gemini format
  // Gemini uses "contents" with "parts" and "role" (user/model instead of user/assistant)
  const systemInstruction = messages.find(m => m.role === "system")?.content || "";
  const conversationMessages = messages.filter(m => m.role !== "system");

  const contents = conversationMessages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function groqChat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}
