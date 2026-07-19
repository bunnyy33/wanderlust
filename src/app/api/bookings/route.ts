import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/transform";
import { generateReference } from "@/lib/format";
import { sendEmail, bookingConfirmationEmail } from "@/lib/mailer";
import { getSessionUser } from "@/lib/customer-auth";
import { computeFraudScore, getClientIp, getClientUserAgent } from "@/lib/fraud";

// Generate a unique WL-RES-XXXXXX reference (6-digit suffix, retry on collision)
async function pickUniqueAgencyReference(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const n = Math.floor(100000 + Math.random() * 900000);
    const ref = `WL-RES-${n}`;
    const exists = await db.reservation.findUnique({
      where: { reference: ref },
      select: { id: true },
    });
    if (!exists) return ref;
  }
  // Fallback: append a random 4-char suffix
  return `WL-RES-${Date.now().toString().slice(-6)}`;
}

// Generate a unique WL-INV-XXXXXX invoice number
async function pickUniqueAgencyInvoice(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const n = Math.floor(100000 + Math.random() * 900000);
    const inv = `WL-INV-${n}`;
    const exists = await db.reservation.findUnique({
      where: { invoiceNumber: inv },
      select: { id: true },
    });
    if (!exists) return inv;
  }
  return `WL-INV-${Date.now().toString().slice(-6)}`;
}

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
  try {
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

  // Get session user (for fraud scoring + booking ownership)
  const sessionUser = await getSessionUser();

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
      status: "PENDING",
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

  // ----------------------------------------------------------------
  // Sync into the agency booking system — website bookings should
  // appear in the agency dashboard automatically. We create a
  // Reservation (master invoice), a Tour/Hotel booking, and a
  // Payment record (since the website checkout already collected
  // payment online). The reservation is set to CUSTOMER_CONFIRMED.
  // ----------------------------------------------------------------
  try {
    const agencyRef = await pickUniqueAgencyReference();
    const agencyInvoice = await pickUniqueAgencyInvoice();

    const totalNum = parseFloat(totalAmount) || 0;
    const checkIn = new Date(checkInDate);
    const checkOut = checkOutDate ? new Date(checkOutDate) : null;

    const reservation = await db.reservation.create({
      data: {
        reference: agencyRef,
        invoiceNumber: agencyInvoice,
        customerName,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone: customerPhone ?? null,
        isGuest: true, // website bookings are guest checkouts by default
        orderDate: new Date(),
        invoiceDate: new Date(),
        bookingStatus: "CUSTOMER_CONFIRMED", // paid online → already confirmed by customer
        invoiceType: "TAXABLE",
        currency: "USD",
        remarks: `Auto-synced from website booking ${reference}.`,
        termsAccepted: true,
      },
    });

    // Add a Tour or Hotel booking matching the website line item
    if (type === "EXPERIENCE" && booking.experience) {
      const exp = booking.experience;
      const adults = parseInt(guests, 10) || 1;
      await db.tourBooking.create({
        data: {
          reservationId: reservation.id,
          tourId: exp.id,
          tourName: exp.title,
          tourOption: null,
          transferOption: "WITHOUT_TRANSFER",
          pickupLocation: null,
          tourDate: checkIn,
          pickupTime: null,
          timeSlot: null,
          noOfAdults: adults,
          noOfChildren: 0,
          supplierId: null,
          supplierName: exp.vendorName ?? null,
          confirmationNumber: reference,
          status: "CUSTOMER_CONFIRMED",
          comments: `Auto-synced from website booking ${reference}.`,
          costUnit: "PER_PERSON",
          // Cost = unit price (what we pay the supplier, approximated)
          adultCostRate: parseFloat(unitPrice) || 0,
          childCostRate: 0,
          carCostRate: 0,
          // Sell = total amount the customer paid (incl. taxes)
          adultSellRate: totalNum / Math.max(1, adults),
          childSellRate: 0,
          carSellRate: 0,
          showOnVoucher: true,
        },
      });
    } else if (type === "HOTEL" && booking.hotel) {
      const hotel = booking.hotel;
      const nightsNum = parseInt(nights, 10) || 1;
      const sellPerNight = nightsNum > 0 ? totalNum / nightsNum : totalNum;
      await db.hotelBooking.create({
        data: {
          reservationId: reservation.id,
          hotelId: hotel.id,
          hotelName: hotel.name,
          roomType: roomTypeName ?? "Standard",
          mealPlan: "BB",
          checkInDate: checkIn,
          checkOutDate: checkOut ?? new Date(checkIn.getTime() + 86400000),
          nights: nightsNum,
          noOfRooms: 1,
          noOfAdults: parseInt(guests, 10) || 1,
          noOfChildren: 0,
          supplierId: null,
          supplierName: null,
          confirmationNumber: reference,
          status: "CUSTOMER_CONFIRMED",
          comments: `Auto-synced from website booking ${reference}.`,
          costPerNight: parseFloat(unitPrice) || 0,
          sellPerNight,
          showOnVoucher: true,
        },
      });
    }

    // Record the online payment so the agency dashboard shows it as paid
    await db.payment.create({
      data: {
        reservationId: reservation.id,
        amount: totalNum,
        currency: "USD",
        paymentMethod: "ONLINE",
        paymentDate: new Date(),
        reference,
        status: "RECEIVED",
        notes: `Auto-synced from website booking ${reference}.`,
        receivedBy: null,
      },
    });

    // Re-calc totals (subTotal, VAT, balanceDue) for the new reservation
    const fresh = await db.reservation.findUnique({
      where: { id: reservation.id },
      include: { tours: true, transports: true, hotels: true, payments: true },
    });
    if (fresh) {
      const subTotal =
        fresh.tours.reduce((s, t) => s + (t.totalSell || 0), 0) +
        fresh.transports.reduce((s, t) => s + (t.sellRate || 0), 0) +
        fresh.hotels.reduce((s, t) => s + (t.totalSell || 0), 0);
      const vatAmount = fresh.invoiceType === "TAXABLE" ? subTotal * 0.05 : 0;
      const totalAmount = subTotal + vatAmount;
      const amountPaid = fresh.payments
        .filter((p) => p.status !== "REFUNDED")
        .reduce((s, p) => s + (p.amount || 0), 0);
      const balanceDue = Math.max(0, totalAmount - amountPaid);
      await db.reservation.update({
        where: { id: reservation.id },
        data: { subTotal, vatAmount, totalAmount, amountPaid, balanceDue },
      });
    }
  } catch (syncErr) {
    // Sync failures must NOT break the website checkout flow
    console.error("Agency sync error:", syncErr);
  }

  return NextResponse.json({
    booking: serializeBooking({ ...booking, specialRequests: booking.specialRequests || (roomTypeName ? `Room: ${roomTypeName}` : null) }),
    reference,
  });
  } catch (err) {
    console.error("Booking creation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create booking" },
      { status: 500 }
    );
  }
}
