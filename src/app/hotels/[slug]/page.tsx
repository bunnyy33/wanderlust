import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serializeHotel, serializeReview } from "@/lib/transform";
import { HotelPageView } from "@/components/site/hotel-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hotel = await db.hotel.findUnique({ where: { slug }, include: { destination: true } });
  if (!hotel) return { title: "Hotel not found · Wanderlust" };
  return {
    title: `${hotel.name} · Wanderlust`,
    description: hotel.description,
    openGraph: {
      title: hotel.name,
      description: hotel.description,
      images: hotel.images ? JSON.parse(hotel.images).slice(0, 1) : [],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hotel = await db.hotel.findUnique({ where: { slug }, include: { destination: true } });
  if (!hotel) notFound();
  const reviews = await db.review.findMany({
    where: { hotelId: hotel.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return <HotelPageView hotel={serializeHotel(hotel)} reviews={reviews.map(serializeReview)} />;
}
