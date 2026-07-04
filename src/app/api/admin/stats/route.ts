import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/stats — dashboard KPIs
export async function GET() {
  const [
    totalBookings,
    totalExperiences,
    totalHotels,
    totalDestinations,
    totalReviews,
    totalUsers,
    bookings,
    recentBookings,
  ] = await Promise.all([
    db.booking.count(),
    db.experience.count(),
    db.hotel.count(),
    db.destination.count(),
    db.review.count(),
    db.booking.groupBy({ by: ["customerEmail"], _count: true }),
    db.booking.findMany({ select: { totalAmount: true, status: true, createdAt: true, type: true } }),
    db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { experience: true, hotel: true },
    }),
  ]);

  const revenue = bookings.reduce((s, b) => s + (b.status !== "CANCELLED" ? b.totalAmount : 0), 0);
  const refunded = bookings
    .filter((b) => b.status === "REFUNDED")
    .reduce((s, b) => s + b.totalAmount, 0);

  // Revenue by type
  const revenueByType = {
    EXPERIENCE: bookings.filter((b) => b.type === "EXPERIENCE" && b.status !== "CANCELLED").reduce((s, b) => s + b.totalAmount, 0),
    HOTEL: bookings.filter((b) => b.type === "HOTEL" && b.status !== "CANCELLED").reduce((s, b) => s + b.totalAmount, 0),
  };

  // Status breakdown
  const statusBreakdown = {
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
    REFUNDED: bookings.filter((b) => b.status === "REFUNDED").length,
    PENDING: bookings.filter((b) => b.status === "PENDING").length,
  };

  // Last 7 days revenue trend
  const now = new Date();
  const days: { date: string; revenue: number; bookings: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const dayBookings = bookings.filter((b) => {
      const c = new Date(b.createdAt);
      return c >= day && c < next && b.status !== "CANCELLED";
    });
    days.push({
      date: day.toISOString().slice(0, 10),
      revenue: Math.round(dayBookings.reduce((s, b) => s + b.totalAmount, 0)),
      bookings: dayBookings.length,
    });
  }

  return NextResponse.json({
    kpis: {
      revenue: Math.round(revenue),
      refunded: Math.round(refunded),
      totalBookings,
      totalExperiences,
      totalHotels,
      totalDestinations,
      totalReviews,
      totalUsers: totalUsers.length,
      avgOrderValue: totalBookings ? Math.round(revenue / totalBookings) : 0,
    },
    revenueByType,
    statusBreakdown,
    revenueTrend: days,
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      type: b.type,
      customerName: b.customerName,
      totalAmount: b.totalAmount,
      status: b.status,
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
      title: b.experience?.title || b.hotel?.name || "—",
    })),
  });
}
