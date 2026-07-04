// Shared domain types for the Wanderlust tourism platform.

export type ExperienceType =
  | "TOUR"
  | "ACTIVITY"
  | "TRANSFER"
  | "CRUISE"
  | "ATTRACTION"
  | "ADVENTURE";

export interface DestinationT {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string | null;
  region: string | null;
  description: string;
  longDescription: string | null;
  image: string;
  heroImage: string | null;
  popular: boolean;
  featured: boolean;
}

export interface ItineraryItem {
  time: string;
  title: string;
  description: string;
}

export interface ExperienceT {
  id: string;
  title: string;
  slug: string;
  type: ExperienceType;
  description: string;
  longDescription: string;
  destinationId: string;
  destination?: DestinationT;
  price: number;
  originalPrice: number | null;
  currency: string;
  duration: string;
  durationHours: number;
  rating: number;
  reviewCount: number;
  images: string[];
  highlights: string[];
  itinerary: ItineraryItem[];
  includes: string[];
  excludes: string[];
  groupSize: number;
  language: string;
  meetingPoint: string | null;
  cancellationPolicy: string;
  availability: number;
  bookedCount: number;
  vendorName: string;
  featured: boolean;
  bestseller: boolean;
  tags: string[];
  status: string;
}

export interface RoomTypeT {
  name: string;
  description: string;
  maxGuests: number;
  priceModifier: number;
}

export interface HotelT {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  destinationId: string;
  destination?: DestinationT;
  starRating: number;
  pricePerNight: number;
  originalPrice: number | null;
  currency: string;
  images: string[];
  amenities: string[];
  roomTypes: RoomTypeT[];
  rating: number;
  reviewCount: number;
  checkInTime: string;
  checkOutTime: string;
  address: string | null;
  featured: boolean;
  status: string;
}

export interface ReviewT {
  id: string;
  experienceId: string | null;
  hotelId: string | null;
  authorName: string;
  authorAvatar: string | null;
  authorCountry: string | null;
  rating: number;
  title: string;
  comment: string;
  travelDate: string | null;
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export interface BookingT {
  id: string;
  reference: string;
  experienceId: string | null;
  hotelId: string | null;
  type: string;
  checkInDate: string;
  checkOutDate: string | null;
  guests: number;
  nights: number;
  unitPrice: number;
  addonsTotal: number;
  taxesAndFees: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  specialRequests: string | null;
  couponCode: string | null;
  createdAt: string;
  experience?: ExperienceT | null;
  hotel?: HotelT | null;
}

export interface CouponT {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minSpend: number;
  maxDiscount: number | null;
  active: boolean;
}

// AI itinerary planner output
export interface ItineraryDay {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  estimatedCost: number;
}

export interface ItineraryPlan {
  destination: string;
  summary: string;
  totalEstimatedCost: number;
  withinBudget: boolean;
  days: ItineraryDay[];
  recommendations: {
    hotels: string[];
    experiences: string[];
    transfers: string[];
    tips: string[];
  };
  insiderTips: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
