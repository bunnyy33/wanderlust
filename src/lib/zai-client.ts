// Direct ZAI API client — bypasses the SDK entirely
// Works on Vercel because it uses standard fetch() instead of the SDK

const ZAI_CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-c2198886-8e38-4a95-bb11-8ac023d3f3af",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGYwMGRhYzgtNmVmYi00YzVjLWFjNzMtYTBhOGI0ZTQ3Zjk5IiwiY2hhdF9pZCI6ImNoYXQtYzIxOTg4ODYtOGUzOC00YTk1LWJiMTEtOGFjMDIzZDNmM2FmIiwicGxhdGZvcm0iOiJ6YWkifQ.qpy0H6UzCrpwFDIrDw7o5LoKq78G_fD7Wugk8aim8eA",
  userId: "df00dac8-6efb-4c5c-ac73-a0a8b4e47f99",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    finish_reason: string;
    index: number;
    message: { content: string; role: string };
  }>;
  created: number;
  id: string;
  model: string;
  object: string;
}

async function zaiChat(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${ZAI_CONFIG.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZAI_CONFIG.apiKey}`,
      "X-Z-AI-From": "Z",
      "X-Chat-Id": ZAI_CONFIG.chatId,
      "X-User-Id": ZAI_CONFIG.userId,
      "X-Token": ZAI_CONFIG.token,
    },
    body: JSON.stringify({
      messages,
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ZAI API ${response.status}: ${errorBody}`);
  }

  const data: ChatCompletionResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Vision chat (for VLM/image analysis)
async function zaiVision(messages: any[]): Promise<string> {
  const response = await fetch(`${ZAI_CONFIG.baseUrl}/chat/completions/vision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZAI_CONFIG.apiKey}`,
      "X-Z-AI-From": "Z",
      "X-Chat-Id": ZAI_CONFIG.chatId,
      "X-User-Id": ZAI_CONFIG.userId,
      "X-Token": ZAI_CONFIG.token,
    },
    body: JSON.stringify({
      messages,
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ZAI Vision API ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export { zaiChat, zaiVision };
