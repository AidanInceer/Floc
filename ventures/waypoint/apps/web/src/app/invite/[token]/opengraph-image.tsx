/**
 * The link-preview card a shared invite unfurls to — WhatsApp, iMessage, Slack
 * (ticket: rich invite embed). The page already carries the OG title and
 * description; Next wires this file in as `og:image`/`twitter:image`
 * automatically, so a bare link becomes an inviting card.
 *
 * On brand: the off-white ground, the ink wordmark with the one blue dot, the
 * trip's name large. No custom font is loaded — ImageResponse's default keeps
 * this robust (rule 11): a card that always renders beats a prettier one that
 * can fail on a font fetch. A dead or unknown token falls back to a plain
 * Waypoint card rather than throwing.
 */
import { ImageResponse } from "next/og";

import { findTripByInviteToken } from "@/server/membership";
import { formatDateRange } from "@/lib/dates";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "You're invited to a trip on Waypoint";

const GROUND = "#F7F6F3";
const INK = "#22201C";
const INK_SOFT = "#6B6760";
const PEN = "#4E68D8";
const BUTTER = "#F4E9C8";

export default async function InviteOgImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await findTripByInviteToken(token).catch(() => null);

  const heading = found ? found.name : "Waypoint";
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
        <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: INK }}>
          way<span style={{ color: PEN }}>.</span>point
        </div>

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
          ) : (
            <span />
          )}
          <div style={{ fontSize: 28, color: INK_SOFT }}>
            Have a look before you decide.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
