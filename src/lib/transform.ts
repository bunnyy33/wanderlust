import type {
  DestinationT,
  ExperienceT,
  HotelT,
  ReviewT,
  BookingT,
  CouponT,
} from "./types";

// Safely parse JSON stored as string in SQLite.
function j<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function serializeDestination(d: any): DestinationT {
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    country: d.country,
    city: d.city,
    region: d.region,
    description: d.description,
    longDescription: d.longDescription,
    image: d.image,
    heroImage: d.heroImage,
    popular: d.popular,
    featured: d.featured,
  };
}

export function serializeExperience(e: any): ExperienceT {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    type: e.type,
    description: e.description,
    longDescription: e.longDescription,
    destinationId: e.destinationId,
    destination: e.destination ? serializeDestination(e.destination) : undefined,
    price: e.price,
    originalPrice: e.originalPrice ?? null,
    currency: e.currency,
    duration: e.duration,
    durationHours: e.durationHours,
    rating: e.rating,
    reviewCount: e.reviewCount,
    images: j<string[]>(e.images, []),
    highlights: j<string[]>(e.highlights, []),
    itinerary: j(e.itinerary, []),
    includes: j<string[]>(e.includes, []),
    excludes: j<string[]>(e.excludes, []),
    groupSize: e.groupSize,
    language: e.language,
    meetingPoint: e.meetingPoint,
    cancellationPolicy: e.cancellationPolicy,
    cancellationType: e.cancellationType || "FLEXIBLE",
    availability: e.availability,
    bookedCount: e.bookedCount,
    vendorName: e.vendorName,
    featured: e.featured,
    bestseller: e.bestseller,
    tags: j<string[]>(e.tags, []),
    status: e.status,
  };
}

export function serializeHotel(h: any): HotelT {
  return {
    id: h.id,
    name: h.name,
    slug: h.slug,
    description: h.description,
    longDescription: h.longDescription,
    destinationId: h.destinationId,
    destination: h.destination ? serializeDestination(h.destination) : undefined,
    starRating: h.starRating,
    pricePerNight: h.pricePerNight,
    originalPrice: h.originalPrice ?? null,
    currency: h.currency,
    images: j<string[]>(h.images, []),
    amenities: j<string[]>(h.amenities, []),
    roomTypes: j(h.roomTypes, []),
    rating: h.rating,
    reviewCount: h.reviewCount,
    checkInTime: h.checkInTime,
    checkOutTime: h.checkOutTime,
    address: h.address,
    featured: h.featured,
    status: h.status,
  };
}

export function serializeReview(r: any): ReviewT {
  return {
    id: r.id,
    experienceId: r.experienceId,
    hotelId: r.hotelId,
    authorName: r.authorName,
    authorAvatar: r.authorAvatar,
    authorCountry: r.authorCountry,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    travelDate: r.travelDate,
    helpful: r.helpful,
    verified: r.verified,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

export function serializeBooking(b: any): BookingT {
  return {
    id: b.id,
    reference: b.reference,
    experienceId: b.experienceId,
    hotelId: b.hotelId,
    type: b.type,
    checkInDate: b.checkInDate instanceof Date ? b.checkInDate.toISOString() : b.checkInDate,
    checkOutDate: b.checkOutDate instanceof Date ? b.checkOutDate?.toISOString() ?? null : b.checkOutDate,
    guests: b.guests,
    nights: b.nights,
    unitPrice: b.unitPrice,
    addonsTotal: b.addonsTotal,
    taxesAndFees: b.taxesAndFees,
    discount: b.discount,
    totalAmount: b.totalAmount,
    currency: b.currency,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    specialRequests: b.specialRequests,
    couponCode: b.couponCode,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    experience: b.experience ? serializeExperience(b.experience) : null,
    hotel: b.hotel ? serializeHotel(b.hotel) : null,
    ipAddress: b.ipAddress ?? null,
    userAgent: b.userAgent ?? null,
    fraudScore: b.fraudScore ?? 0,
    fraudSignals: b.fraudSignals ? (typeof b.fraudSignals === "string" ? JSON.parse(b.fraudSignals) : b.fraudSignals) : [],
    isFlagged: b.isFlagged ?? false,
    manualReview: b.manualReview ?? "PENDING",
  };
}

export function serializeCoupon(c: any): CouponT {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: c.discountValue,
    minSpend: c.minSpend,
    maxDiscount: c.maxDiscount,
    active: c.active,
  };
}
