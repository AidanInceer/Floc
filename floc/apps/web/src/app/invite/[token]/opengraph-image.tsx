import { ImageResponse } from "next/og";

import { findTripByShareLink } from "@/server/trips/invites";
import { formatDateRange } from "@floc/core/dates/dates";
import { OG_COLOURS, OG_SIZE, OgWordmark } from "@/components/system/og-card";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "You're invited to a trip on Floc";

const GROUND = OG_COLOURS.ground;
const INK = OG_COLOURS.ink;
const INK_SOFT = OG_COLOURS.inkSoft;
const BUTTER = OG_COLOURS.butter;

export default async function InviteOgImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await findTripByShareLink(token).catch(() => null);

  const heading = found ? found.name : "Floc";
  const kicker = found
    ? found.hostName
      ? `${found.hostName} invited you to`
      : "You're invited to"
    : "Plan trips with friends";
  const dated = found && (found.startDate || found.endDate);
  const when = dated
    ? formatDateRange(found.startDate, found.endDate)
    : found
      ? "Dates not settled yet"
      : "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: GROUND,
          padding: "72px 80px",
        }}
      >
        <OgWordmark />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 32, color: INK_SOFT }}>{kicker}</div>
          <div
            style={{
              marginTop: 12,
              fontSize: 88,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.02,
              maxWidth: 1040,
            }}
          >
            {heading}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {when ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: INK,
                background: BUTTER,
                padding: "12px 24px",
                borderRadius: 999,
              }}
            >
              {when}
            </div>
          ) : null}
          <div style={{ fontSize: 28, color: INK_SOFT }}>
            Have a look before you decide.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
