import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// Routes that need aggressive rate limiting
const PROTECTED_API_PREFIXES = [
  "/api/agency/reservations", // CRUD operations
  "/api/employee/auth", // login attempts
];

const READ_ENDPOINTS = ["/api/experiences", "/api/hotels", "/api/destinations"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get IP for rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Agency API routes: 100 requests per minute per IP (authenticated users)
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    // Exclude GET on the login check endpoint
    if (pathname === "/api/employee/auth" && req.method === "GET") {
      return NextResponse.next();
    }
    const limit = rateLimit(`agency:${ip}`, 100, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limit.resetIn / 1000)),
            "X-RateLimit-Remaining": String(limit.remaining),
          },
        },
      );
    }
  }

  // Employee login: stricter (10 per 15 min, handled in the route too)
  if (pathname === "/api/employee/auth" && req.method === "POST") {
    const limit = rateLimit(`employee-login:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 },
      );
    }
  }

  // Public read APIs: 60 requests per minute
  if (READ_ENDPOINTS.some((p) => pathname.startsWith(p))) {
    const limit = rateLimit(`public:${ip}`, 60, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        { status: 429 },
      );
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
