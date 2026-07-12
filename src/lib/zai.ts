// AI SDK helper — reads config from non-dotfile (Vercel ignores dotfiles)
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync, existsSync } from "fs";
import path from "path";

const CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-c2198886-8e38-4a95-bb11-8ac023d3f3af",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGYwMGRhYzgtNmVmYi00YzVjLWFjNzMtYTBhOGI0ZTQ3Zjk5IiwiY2hhdF9pZCI6ImNoYXQtYzIxOTg4ODYtOGUzOC00YTk1LWJiMTEtOGFjMDIzZDNmM2FmIiwicGxhdGZvcm0iOiJ6YWkifQ.qpy0H6UzCrpwFDIrDw7o5LoKq78G_fD7Wugk8aim8eA",
  userId: "df00dac8-6efb-4c5c-ac73-a0a8b4e47f99",
};

let cached: ZAI | null = null;

export async function getZai(): Promise<ZAI> {
  if (cached) return cached;

  // Try reading config from non-dotfile first (Vercel deploys these)
  const configPaths = [
    path.join(process.cwd(), "z-ai-config.json"),
    path.join(process.cwd(), ".z-ai-config"),
    "/etc/.z-ai-config",
  ];

  let config = CONFIG; // fallback to hardcoded config

  for (const filePath of configPaths) {
    try {
      if (existsSync(filePath)) {
        const configStr = readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(configStr);
        if (parsed.baseUrl && parsed.apiKey) {
          config = parsed;
          break;
        }
      }
    } catch {
      // continue to next path
    }
  }

  // Construct ZAI directly with config (bypasses SDK's file loading)
  cached = new ZAI(config);
  return cached;
}
