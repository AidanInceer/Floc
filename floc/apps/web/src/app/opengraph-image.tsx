import { ImageResponse } from "next/og";

import { OG_SIZE, OgPageCard } from "@/components/system/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Floc — Trip planning, sorted.";

export default function SiteOgImage() {
  return new ImageResponse(
    <OgPageCard heading="Trip planning, sorted." line="The notes, the route, the days, and who owes who." />,
    size,
  );
}
