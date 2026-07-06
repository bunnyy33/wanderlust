import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serializeExperience, serializeReview } from "@/lib/transform";
import { TourPageView } from "@/components/site/tour-page";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exp = await db.experience.findUnique({ where: { slug }, include: { destination: true } });
  if (!exp) return { title: "Tour not found · Wanderlust" };
  return {
    title: `${exp.title} · Wanderlust`,
    description: exp.description,
    openGraph: {
      title: exp.title,
      description: exp.description,
      images: exp.images ? JSON.parse(exp.images).slice(0, 1) : [],
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experience = await db.experience.findUnique({
    where: { slug },
    include: { destination: true },
  });
  if (!experience) notFound();
  const reviews = await db.review.findMany({
    where: { experienceId: experience.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    <TourPageView
      experience={serializeExperience(experience)}
      reviews={reviews.map(serializeReview)}
    />
  );
}
