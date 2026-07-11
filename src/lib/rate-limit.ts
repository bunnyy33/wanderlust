// Simple in-memory rate limiter for API routes.
// In production with multiple server instances, use Redis or Upstash.

const requests = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit check. Returns true if request is allowed, false if blocked.
 * @param key - IP address or session ID
 * @param maxRequests - max requests allowed in the window
 * @param windowMs - time window in milliseconds (default: 60s)
 */
export function rateLimit(
  key: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = requests.get(key);

  if (!record || now > record.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  record.count++;
  const allowed = record.count <= maxRequests;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - record.count),
    resetIn: record.resetTime - now,
  };
}

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requests.entries()) {
    if (now > record.resetTime) {
      requests.delete(key);
    }
  }
}, 5 * 60 * 1000);
