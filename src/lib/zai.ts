// AI SDK helper — bypasses file-based config loading
// Works on Vercel by directly constructing ZAI with config

const ZAI_CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-c2198886-8e38-4a95-bb11-8ac023d3f3af",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGYwMGRhYzgtNmVmYi00YzVjLWFjNzMtYTBhOGI0ZTQ3Zjk5IiwiY2hhdF9pZCI6ImNoYXQtYzIxOTg4ODYtOGUzOC00YTk1LWJiMTEtOGFjMDIzZDNmM2FmIiwicGxhdGZvcm0iOiJ6YWkifQ.qpy0H6UzCrpwFDIrDw7o5LoKq78G_fD7Wugk8aim8eA",
  userId: "df00dac8-6efb-4c5c-ac73-a0a8b4e47f99",
};

let cached: any = null;

export async function getZai() {
  if (cached) return cached;

  // Dynamic import so the SDK is only loaded when needed
  const ZAIModule = await import("z-ai-web-dev-sdk");
  const ZAI = ZAIModule.default;

  // The ZAI constructor takes config directly — no file needed
  cached = new ZAI(ZAI_CONFIG);
  return cached;
}
