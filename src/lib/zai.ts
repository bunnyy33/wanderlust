// AI SDK helper — writes config file at runtime so ZAI.create() can find it
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-c2198886-8e38-4a95-bb11-8ac023d3f3af",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGYwMGRhYzgtNmVmYi00YzVjLWFjNzMtYTBhOGI0ZTQ3Zjk5IiwiY2hhdF9pZCI6ImNoYXQtYzIxOTg4ODYtOGUzOC00YTk1LWJiMTEtOGFjMDIzZDNmM2FmIiwicGxhdGZvcm0iOiJ6YWkifQ.qpy0H6UzCrpwFDIrDw7o5LoKq78G_fD7Wugk8aim8eA",
  userId: "df00dac8-6efb-4c5c-ac73-a0a8b4e47f99",
};

let initialized = false;

export async function getZai() {
  if (!initialized) {
    // Write config file to cwd so ZAI.create() can find it
    const configPath = path.join(process.cwd(), ".z-ai-config");
    if (!existsSync(configPath)) {
      try {
        writeFileSync(configPath, JSON.stringify(CONFIG), "utf-8");
      } catch {
        // If cwd is read-only (some Vercel setups), try /tmp
        const tmpPath = "/tmp/.z-ai-config";
        writeFileSync(tmpPath, JSON.stringify(CONFIG), "utf-8");
      }
    }
    initialized = true;
  }

  // Also write to /tmp as fallback (SDK checks home dir and /etc)
  const homePath = path.join(process.cwd(), ".z-ai-config");
  const tmpPath = "/tmp/.z-ai-config";
  try {
    if (!existsSync(tmpPath)) {
      writeFileSync(tmpPath, JSON.stringify(CONFIG), "utf-8");
    }
  } catch {
    // ignore
  }

  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  return await ZAI.create();
}
