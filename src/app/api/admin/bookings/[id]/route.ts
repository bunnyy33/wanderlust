import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeBooking } from "@/lib/transform";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const action = String(body?.action ?? "").toLowerCase();

    if (action !== "cancel" && action !== "refund" && action !== "review") {
      return NextResponse.json({ error: 'action must be "cancel", "refund" or "review"' }, { status: 400 });
    }

    if (action === "review") {
      const mr = String(body?.manualReview ?? "").toUpperCase();
      if (mr !== "REAL" && mr !== "SPAM" && mr !== "PENDING") {
        return NextResponse.json({ error: "manualReview must be REAL, SPAM or PENDING" }, { status: 400 });
      }
      const updated = await db.booking.update({
        where: { id }, data: { manualReview: mr },
        include: { experience: { include: { destination: true } }, hotel: { include: { destination: true } } },
      });
      return NextResponse.json({ booking: serializeBooking(updated) });
    }

    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const wasActive = ["CONFIRMED", "COMPLETED", "PENDING"].includes(booking.status);

    if (action === "cancel") {
      if (booking.experienceId && wasActive && booking.status !== "CANCELLED") {
        const guests = Math.max(0, booking.guests || 0);
        const exp = await db.experience.findUnique({ where: { id: booking.experienceId }, select: { availability: true, bookedCount: true } });
        if (exp) {
          await db.experience.update({
            where: { id: booking.experienceId },
            data: { availability: exp.availability + guests, bookedCount: Math.max(0, exp.bookedCount - guests) },
          });
        }
      }
      const updated = await db.booking.update({
        where: { id }, data: { status: "CANCELLED" },
        include: { experience: { include: { destination: true } }, hotel: { include: { destination: true } } },
      });
      return NextResponse.json({ booking: serializeBooking(updated) });
    }

    // refund
    // TODO: call Stripe refund API when STRIPE_SECRET_KEY configured
    if (booking.experienceId && wasActive && booking.status !== "REFUNDED" && booking.status !== "CANCELLED") {
      const guests = Math.max(0, booking.guests || 0);
      const exp = await db.experience.findUnique({ where: { id: booking.experienceId }, select: { availability: true, bookedCount: true } });
      if (exp) {
        await db.experience.update({
          where: { id: booking.experienceId },
          data: { availability: exp.availability + guests, bookedCount: Math.max(0, exp.bookedCount - guests) },
        });
      }
    }
    const updated = await db.booking.update({
      where: { id }, data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      include: { experience: { include: { destination: true } }, hotel: { include: { destination: true } } },
    });
    return NextResponse.json({ booking: serializeBooking(updated) });
  } catch (err) {
    console.error("admin patch booking error:", err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
