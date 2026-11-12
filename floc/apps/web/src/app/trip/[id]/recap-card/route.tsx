// Why: a trip leaves Floc as a picture, never a link (ADR-045, #443). The default font needs no fetch (rule 11).
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

import { resolveColours } from "@floc/core/design/tokens";
import { readTripColor, tripPastel, type TripColor } from "@floc/core/trip/trip-color";
import { requireTripAccess } from "@/server/access";
import { recapPictureFor } from "@/server/trips/recap-card";
import { OgWordmark } from "@/components/system/og-card";

export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1350 };
const WASH: Record<TripColor, string> = { peri: "pastel-blue", mint: "pastel-green", butter: "pastel-yellow", blush: "pastel-red" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trip } = await requireTripAccess(id, `/trip/${id}/overview`);
  const picture = await recapPictureFor(trip);
  if (!picture) notFound();
  const { card, land, pins, map: MAP } = picture;
  const theme = new URL(request.url).searchParams.get("theme") === "dark" ? "dark" : "light";
  const c = resolveColours(theme);
  const home = c[WASH[tripPastel(readTripColor(trip.colorKey), trip.id)]];
  const line = pins.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const list = card.stops.slice(0, 8);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: c.paper, padding: "64px 72px 56px", color: c.ink }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, color: c["ink-2"] }}>
          <OgWordmark theme={theme} />
          <div style={{ display: "flex" }}>{card.month}</div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 92, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>{card.name}</div>
        <div style={{ display: "flex", position: "relative", marginTop: 28, width: MAP.width, height: MAP.height }}>
          <svg width={MAP.width} height={MAP.height} viewBox={`0 0 ${MAP.width} ${MAP.height}`}>
            <path d={land.other} fill={c["sheet-3"]} stroke={c["rule-2"]} strokeWidth={1} />
            <path d={land.home} fill={home} stroke={c["rule-2"]} strokeWidth={1} />
            {pins.length > 1 ? <path d={line} fill="none" stroke={c.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /> : null}
          </svg>
          {pins.map((p) => (
            <div key={p.no} style={{ position: "absolute", left: p.x - 22, top: p.y - 22, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: c.ink, border: `4px solid ${c.paper}`, color: c.paper, fontSize: 22 }}>
              {String(p.no)}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8, fontSize: 32 }}>
          {list.map((s) => (
            <div key={s.no} style={{ display: "flex", alignItems: "center", padding: "6px 0" }}>
              <div style={{ display: "flex", width: 56, color: c["ink-3"] }}>{s.no}</div>
              <div style={{ display: "flex", flex: 1 }}>{s.place}</div>
              <div style={{ display: "flex", color: c["ink-2"] }}>{s.nights === 1 ? "1 night" : `${s.nights} nights`}</div>
            </div>
          ))}
          {card.stops.length > list.length ? (
            <div style={{ display: "flex", padding: "6px 0", color: c["ink-2"] }}>{`and ${card.stops.length - list.length} more`}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", marginTop: "auto", paddingTop: 22, borderTop: `2px solid ${c.rule}`, fontSize: 28, color: c["ink-2"] }}>{card.foot}</div>
      </div>
    ),
    { ...SIZE, headers: { "Cache-Control": "private, no-store" } },
  );
}
