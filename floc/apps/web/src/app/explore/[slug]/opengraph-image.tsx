import { ImageResponse } from "next/og";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { OG_SIZE, OgPageCard } from "@/components/system/og-card";
import { countWord } from "@floc/core/text/count-word";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A ready-made group trip on Floc Explore";

export default async function ExploreTripOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = PRESET_TRIPS.find((t) => t.id === slug);
  const stops = trip?.legs.filter((leg) => leg.kind === "base").length ?? 0;
  const line = trip ? `${trip.country} · ${countWord(trip.nights, "night")} · ${countWord(stops, "stop")}` : "Ready-made trips to borrow on Floc.";
  return new ImageResponse(
    <OgPageCard heading={trip?.title ?? "Explore"} line={line} />,
    size,
  );
}
