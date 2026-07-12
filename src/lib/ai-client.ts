// Groq AI client — free, fast, works on Vercel
// Uses Llama 3.3 70B (very capable, OpenAI-compatible API)
// Get a free API key at: https://console.groq.com/keys

const GROQ_API_KEY = process.env.GROQ_API_KEY || "gsk_D8aT7S5G4bF2mN8pK3qW6vY1xZ0aH5jC7rT4sU9i";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function aiChat(messages: ChatMessage[]): Promise<string> {
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
