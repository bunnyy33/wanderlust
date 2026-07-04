import { db } from "@/lib/db";
import { serializeDestination } from "@/lib/transform";
import { SiteApp } from "@/components/site/app";

export default async function Page() {
  const destinations = await db.destination.findMany({
    orderBy: [{ featured: "desc" }, { popular: "desc" }, { name: "asc" }],
  });
  return <SiteApp destinations={destinations.map(serializeDestination)} />;
}
