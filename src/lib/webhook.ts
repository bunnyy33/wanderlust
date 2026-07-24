// Outbound webhook dispatcher.
//
// Each active Webhook row in the DB declares a list of events it cares about
// (comma-separated, e.g. "BOOKING_STATUS_CHANGE,RESERVATION_CREATED"). When
// something interesting happens in the agency CRM we call fireWebhook() with
// the event name and a payload; this helper figures out which URLs to hit,
// signs the payload if the webhook has a secret, and POSTs in parallel.
//
// Delivery is best-effort — failures are logged but never thrown, because
// breaking the user-facing request over a downstream webhook failure is
// never acceptable.

import { createHmac } from "crypto";
import { db } from "@/lib/db";

interface WebhookDeliveryResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

function hmacSignature(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Fire a webhook event. Queries the DB for every active webhook that
 * subscribes to the given event, then POSTs the payload to each URL in
 * parallel. Returns the per-URL delivery results so callers can log them
 * if they want to.
 */
export async function fireWebhook(
  event: string,
  payload: unknown,
): Promise<WebhookDeliveryResult[]> {
  let webhooks: Array<{
    id: string;
    url: string;
    events: string;
    secret: string | null;
  }>;

  try {
    webhooks = await db.webhook.findMany({ where: { active: true } });
  } catch {
    // Webhook table doesn't exist on this DB (fresh sandbox, unmigrated
    // prod, etc.) — nothing to do.
    return [];
  }

  const matching = webhooks.filter((w) => {
    const events = (w.events || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    return events.length === 0 || events.includes(event.toUpperCase());
  });

  if (matching.length === 0) return [];

  const body = JSON.stringify({
    event,
    payload,
    timestamp: new Date().toISOString(),
  });

  const results = await Promise.all(
    matching.map(async (w): Promise<WebhookDeliveryResult> => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "Wanderlust-Webhook/1.0",
        };
        if (w.secret) {
          headers["X-Webhook-Signature"] = hmacSignature(w.secret, body);
        }
        const res = await fetch(w.url, {
          method: "POST",
          headers,
          body,
          // Don't let a slow endpoint hold up the request — 10s is plenty.
          signal: AbortSignal.timeout(10_000),
        });
        return {
          url: w.url,
          ok: res.ok,
          status: res.status,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { url: w.url, ok: false, error: msg };
      }
    }),
  );

  return results;
}
