// Z.ai API client — uses the PUBLIC Z.ai API (works on Vercel)
// Model: glm-4-plus (same quality as sandbox)
// Get your API key at: https://open.z.ai

const ZAI_API_KEY = process.env.ZAI_API_KEY || process.env.zai_api_key || "";
const ZAI_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const ZAI_MODEL = "glm-4-plus";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function aiChat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(ZAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: ZAI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ZAI API ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}
