// AI SDK helper — works on both sandbox and Vercel
// Reads config from file (sandbox) or env vars (Vercel)

import ZAI from "z-ai-web-dev-sdk";
import { readFileSync, existsSync } from "fs";
import path from "path";

interface ZaiConfig {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  token?: string;
  userId?: string;
}

let cachedInstance: ZAI | null = null;

export async function getZai(): Promise<ZAI> {
  if (cachedInstance) return cachedInstance;

  let config: ZaiConfig;

  // Try reading from file first (sandbox/local)
  const configPaths = [
    path.join(process.cwd(), ".z-ai-config"),
    path.join(process.cwd(), "z-ai-config.json"),
    "/etc/.z-ai-config",
  ];

  let found = false;
  for (const filePath of configPaths) {
    try {
      if (existsSync(filePath)) {
        const configStr = readFileSync(filePath, "utf-8");
        config = JSON.parse(configStr);
        if (config.baseUrl && config.apiKey) {
          found = true;
          break;
        }
      }
    } catch {
      // continue
    }
  }

  // Fallback: use env vars or hardcoded config (for Vercel)
  if (!found) {
    config = {
      baseUrl: process.env.ZAI_BASE_URL || "https://internal-api.z.ai/v1",
      apiKey: process.env.ZAI_API_KEY || "Z.ai",
      chatId: process.env.ZAI_CHAT_ID || "chat-c2198886-8e38-4a95-bb11-8ac023d3f3af",
      token: process.env.ZAI_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGYwMGRhYzgtNmVmYi00YzVjLWFjNzMtYTBhOGI0ZTQ3Zjk5IiwiY2hhdF9pZCI6ImNoYXQtYzIxOTg4ODYtOGUzOC00YTk1LWJiMTEtOGFjMDIzZDNmM2FmIiwicGxhdGZvcm0iOiJ6YWkifQ.qpy0H6UzCrpwFDIrDw7o5LoKq78G_fD7Wugk8aim8eA",
      userId: process.env.ZAI_USER_ID || "df00dac8-6efb-4c5c-ac73-a0a8b4e47f99",
    };
  }

  // Use new ZAI(config) instead of ZAI.create() to bypass file loading
   
  cachedInstance = new (ZAI as any)(config) as ZAI;
  return cachedInstance;
}
