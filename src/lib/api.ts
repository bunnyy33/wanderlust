import type {
  DestinationT,
  ExperienceT,
  HotelT,
  ReviewT,
  BookingT,
  ItineraryPlan,
  ChatMessage,
} from "./types";

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  destinations: () => jfetch<{ destinations: DestinationT[] }>("/api/destinations"),

  experiences: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    return jfetch<{ experiences: ExperienceT[]; count: number }>(`/api/experiences?${q}`);
  },

  experience: (id: string) =>
    jfetch<{ experience: ExperienceT; reviews: ReviewT[] }>(`/api/experiences/${id}`),

  hotels: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    return jfetch<{ hotels: HotelT[]; count: number }>(`/api/hotels?${q}`);
  },

  hotel: (id: string) =>
    jfetch<{ hotel: HotelT; reviews: ReviewT[] }>(`/api/hotels/${id}`),

  reviews: (params: { experienceId?: string; hotelId?: string; limit?: number }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, String(v)));
    return jfetch<{ reviews: ReviewT[] }>(`/api/reviews?${q}`);
  },

  createReview: (data: {
    experienceId?: string;
    hotelId?: string;
    authorName: string;
    rating: number;
    title: string;
    comment: string;
    travelDate?: string;
  }) =>
    jfetch<{ review: ReviewT }>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  bookings: (email: string) =>
    jfetch<{ bookings: BookingT[] }>(`/api/bookings?email=${encodeURIComponent(email)}`),

  createBooking: (data: Record<string, unknown>) =>
    jfetch<{ booking: BookingT; reference: string }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  wishlist: (sessionId: string) =>
    jfetch<{ items: { kind: "EXPERIENCE" | "HOTEL"; id: string; data: ExperienceT | HotelT }[] }>(
      `/api/wishlist?sessionId=${encodeURIComponent(sessionId)}`
    ),

  toggleWishlist: (data: { sessionId: string; experienceId?: string; hotelId?: string }) =>
    jfetch<{ action: "added" | "removed" }>("/api/wishlist", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  validateCoupon: (code: string, amount: number) =>
    jfetch<{ coupon: any; discount: number }>("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, amount }),
    }),

  aiItinerary: (data: {
    prompt: string;
    budget?: number;
    days?: number;
    travelers?: number;
    destination?: string;
  }) => jfetch<{ plan: ItineraryPlan }>("/api/ai/itinerary", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  aiChat: (messages: ChatMessage[], sessionId?: string) =>
    jfetch<{ reply: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, sessionId }),
    }),

  aiRecommendations: (data: {
    budget?: number;
    travelers?: number;
    vibe?: string;
    destination?: string;
    weather?: string;
  }) =>
    jfetch<{ recommendations: { experience: ExperienceT; reason: string }[] }>(
      "/api/ai/recommendations",
      { method: "POST", body: JSON.stringify(data) }
    ),
};
