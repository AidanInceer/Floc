/**
 * The day track (ticket 195) — the trip's week across the top of Overview, one
 * card per day, coloured by where the group sleeps that night. It replaces the
 * old planning trail: a trail said how far along the *planning* was, this says
 * what the *trip* looks like, which is what a member came to see.
 *
 * Three silences, all normal rather than broken (rules 9, 11): no days at all
 * (undated trip) draws nothing; a day with no overnight place draws as a gap,
 * not an error; a day the forecast doesn't reach simply has no weather.
 */
import Link from "next/link";

import type { TransportType } from "@/db/schema";
import type { RouteDay } from "@/server/itinerary";
import type { TripForecast } from "@/server/weather";
import { formatDate } from "@/lib/dates";
import { TravelModeIcon } from "@/components/travel-mode-icon";
import { WeatherGlyph } from "@/components/weather-glyph";
import { cx } from "@/components/ui";

// Colour here means "the same bed", not a domain — so the rotation is by the
// order places first appear, and the track's own caption says what it encodes.
const PASTELS = [
  "bg-peri text-peri-ink",
  "bg-blush text-blush-ink",
  "bg-mint text-mint-ink",
  "bg-butter text-butter-ink",
] as const;

export function TripDayTrack({
  tripId,
  days,
  transportModes,
  forecast,
}: {
  tripId: number;
  days: RouteDay[];
  transportModes: Map<number, TransportType>;
  forecast: TripForecast | null;
}) {
  if (days.length === 0) return null;

  const skins = new Map<number, string>();
  for (const d of days) {
    if (d.overnightPlaceId === null || skins.has(d.overnightPlaceId)) continue;
    skins.set(d.overnightPlaceId, PASTELS[skins.size % PASTELS.length]);
  }

  const weather = new Map(forecast?.days.map((d) => [d.date, d]) ?? []);
  const placed = days.some((d) => d.overnightPlaceId !== null);

  return (
    <section className="mt-8 rounded-lg bg-sheet p-4" aria-label="The trip, day by day">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-2 pb-3">
        <span className="typed">The trip, day by day</span>
        <Link href={`/trip/${tripId}/days`} className="typed hover:text-ink">
          {placed ? "Colour is where you sleep" : "Nowhere booked yet"} · open Days
        </Link>
      </div>

      <ol className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const skin = d.overnightPlaceId === null ? null : skins.get(d.overnightPlaceId);
          const wx = weather.get(d.date);
          const mode = transportModes.get(d.dayId);
          return (
            <li key={d.dayId} className="min-w-[7.5rem] flex-1">
              <Link
                href={`/trip/${tripId}/days`}
                className={cx(
                  "lift flex h-full min-h-[9rem] flex-col gap-2 rounded-md p-3",
                  // A gap in the plan is drawn as a gap: white, outlined, no name.
                  skin ?? "bg-sheet-2 text-ink-soft shadow-[inset_0_0_0_1.5px_var(--rule)]",
                )}
              >
                <span className="nums text-[11px] uppercase tracking-[0.08em] opacity-70">
                  {formatDate(d.date)}
                </span>
                <span className="font-display text-lg leading-tight font-semibold tracking-tight">
                  {d.placeName ?? "Not decided"}
                </span>
                {mode ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sheet/70 px-2 py-0.5 text-[11px] font-semibold">
                    <TravelModeIcon mode={mode} />
                    {mode}
                  </span>
                ) : null}
                {wx ? (
                  <span className="nums mt-auto flex items-center gap-1.5 text-[11px] opacity-75">
                    <WeatherGlyph condition={wx.condition} />
                    {wx.label} · {wx.hi}° / {wx.lo}°
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
