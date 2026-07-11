import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/transform";
import { generateReference } from "@/lib/format";
import { sendEmail, bookingConfirmationEmail } from "@/lib/mailer";
import { getSessionUser } from "@/lib/customer-auth";
import { computeFraudScore, getClientIp, getClientUserAgent } from "@/lib/fraud";

// GET /api/bookings?email=  — list bookings by customer email
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  const sessionUser = await getSessionUser();

  // Security: if logged in, prioritize their session (prevents IDOR)
  const lookupEmail = sessionUser?.email || email;
  if (!lookupEmail) {
    return NextResponse.json({ bookings: [] });
  }

   
  const where: any = {
    OR: [
      { customerEmail: lookupEmail },
      ...(sessionUser ? [{ userId: sessionUser.id }] : []),
    ],
  };
  const bookings = await db.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { experience: { include: { destination: true } }, hotel: { include: { destination: true } } },
  });
  return NextResponse.json({ bookings: bookings.map(serializeBooking) });
}

// POST /api/bookings — create a booking (transactional-ish availability check)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    type, // EXPERIENCE | HOTEL
    experienceId,
    hotelId,
    checkInDate,
    checkOutDate,
    guests,
    nights,
    unitPrice,
    addonsTotal = 0,
    taxesAndFees = 0,
    discount = 0,
    totalAmount,
    customerName,
    customerEmail,
    customerPhone,
    specialRequests,
    couponCode,
    roomTypeName,
  } = body;

  if (!customerName || !customerEmail || !checkInDate) {
    return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
  }
  if (type === "EXPERIENCE" && !experienceId) {
    return NextResponse.json({ error: "Experience is required" }, { status: 400 });
  }
  if (type === "HOTEL" && !hotelId) {
    return NextResponse.json({ error: "Hotel is required" }, { status: 400 });
  }

  // Availability check for experiences (availability = remaining spots for the date)
  if (type === "EXPERIENCE") {
    const exp = await db.experience.findUnique({ where: { id: experienceId } });
    if (!exp) return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    if (exp.availability < guests) {
      return NextResponse.json(
        { error: `Only ${exp.availability} spots remaining for this experience.` },
        { status: 409 }
      );
    }
  }

  const reference = generateReference();

  // Fraud scoring
  const ipAddress = getClientIp(req);
  const userAgent = getClientUserAgent(req);
  const fraud = await computeFraudScore({
    customerName, customerEmail, customerPhone,
    ipAddress, userAgent,
    userId: sessionUser?.id || null,
    totalAmount: parseFloat(totalAmount),
  });

  const booking = await db.booking.create({
    data: {
      reference,
      type,
      experienceId: type === "EXPERIENCE" ? experienceId : null,
      hotelId: type === "HOTEL" ? hotelId : null,
      checkInDate: new Date(checkInDate),
      checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
      guests: parseInt(guests, 10) || 1,
      nights: parseInt(nights, 10) || 1,
      unitPrice: parseFloat(unitPrice),
      addonsTotal: parseFloat(addonsTotal),
      taxesAndFees: parseFloat(taxesAndFees),
      discount: parseFloat(discount),
      totalAmount: parseFloat(totalAmount),
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "CARD",
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone,
      specialRequests,
      couponCode,
      ipAddress,
      userAgent,
      fraudScore: fraud.score,
      fraudSignals: JSON.stringify(fraud.signals),
      isFlagged: fraud.isFlagged,
    },
    include: { experience: { include: { destination: true } }, hotel: { include: { destination: true } } },
  });

  // Update experience availability + popularity (transactional decrement)
  if (type === "EXPERIENCE") {
    await db.experience.update({
      where: { id: experienceId },
      data: {
        availability: { decrement: parseInt(guests, 10) || 1 },
        bookedCount: { increment: parseInt(guests, 10) || 1 },
      },
    });
  }

  // Increment coupon usage
  if (couponCode) {
    await db.coupon.updateMany({
      where: { code: couponCode },
      data: { usedCount: { increment: 1 } },
    });
  }

  // Store room type as special request note if hotel booking
  if (type === "HOTEL" && roomTypeName && !specialRequests) {
    await db.booking.update({
      where: { id: booking.id },
      data: { specialRequests: `Room: ${roomTypeName}` },
    });
  }

  // Fire confirmation email (non-blocking; logs to EmailLog regardless of SMTP)
  const title = booking.experience?.title || booking.hotel?.name || "Your booking";
  const dateStr = new Date(checkInDate).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const { subject, html } = bookingConfirmationEmail({
    customerName: customerName,
    reference,
    title,
    date: dateStr,
    guests: parseInt(guests, 10) || 1,
    nights: parseInt(nights, 10) || 1,
    total: parseFloat(totalAmount),
    type,
  });
  sendEmail({
    to: customerEmail,
    subject,
    html,
    type: "BOOKING_CONFIRMATION",
    relatedRef: reference,
  }).catch((e) => console.error("Booking email error:", e));

  return NextResponse.json({
    booking: serializeBooking({ ...booking, specialRequests: booking.specialRequests || (roomTypeName ? `Room: ${roomTypeName}` : null) }),
    reference,
  });
}
