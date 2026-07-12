// AI SDK helper — uses the original SDK approach
import ZAI from "z-ai-web-dev-sdk";

let cached: ZAI | null = null;

export async function getZai(): Promise<ZAI> {
  if (cached) return cached;
  cached = await ZAI.create();
  return cached;
}
