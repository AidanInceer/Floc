/**
 * PROTOTYPE ONLY — throwaway (wayfinder ticket 82). Three structurally
 * different renderings of the Route stop list, switched by `?variant=` on the
 * real /trip/[id]/route page (sub-shape A: real data, real header, real
 * density). None of this is production code — no drag-to-reorder, no tests,
 * shared helpers kept deliberately thin so each variant can throw the layout
 * out.
 *
 * The question all three answer: the current list reads as bland, and it is
 * hard to see at a glance WHERE the dates are and WHICH DIRECTION the trip
 * runs. Each variant attacks that with a different primary drawing:
 *
 *   A  Journey spine     — a vertical inked spine; dates own a left rail, the
 *                          leg between two stops is the thing between them.
 *   B  Boarding passes   — a left-to-right row of ticket stubs, FROM → TO on
 *                          each, direction carried by reading order.
 *   C  Date bands        — the trip's calendar window drawn once, each stop a
 *                          span across it; dates and order are the SAME mark.
 */
import type { ReactNode } from "react";

import { Badge, Card, CardHeader, Stack } from "@/components/ui";
import type { TransportType } from "@/db/schema";
import { formatDate, fromIsoDate } from "@/lib/dates";
import type { Stop } from "@/lib/stops";
import { TravelModeIcon } from "@/components/travel-mode-icon";

export const PROTOTYPE_VARIANTS: [key: string, name: string][] = [
  ["A", "Journey spine"],
  ["B", "Boarding passes"],
  ["C", "Date bands"],
  ["current", "Current design"],
];

export type VariantProps = {
  stops: Stop[];
  /** Mode for the leg ARRIVING at stop i (null for the first stop). */
  legMode: (i: number) => TransportType | null;
  /** The page's existing per-stop controls (change dates / place / remove). */
  controls: (stop: Stop, i: number) => ReactNode;
  map: ReactNode;
  tripStart: string | null;
  tripEnd: string | null;
};

const stopName = (s: Stop) =>
  s.placeId ? s.placeName ?? "Unnamed place" : "No place set";

/** "12 – 16 Jun" style: the two ends share a month name when they can. */
function shortRange(start: string, end: string) {
  const a = fromIsoDate(start);
  const b = fromIsoDate(end);
  const day = (d: Date) => d.getUTCDate();
  const mon = (d: Date) =>
    d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return mon(a) === mon(b)
    ? `${day(a)}–${day(b)} ${mon(b)}`
    : `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)}`;
}

function LegMark({ mode }: { mode: TransportType | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">
      {mode ? (
        <>
          <TravelModeIcon mode={mode} />
          <span>{mode}</span>
        </>
      ) : (
        <span className="text-ink-faint">travel not planned</span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* A — Journey spine                                                          */
/* -------------------------------------------------------------------------- */
/**
 * Direction is the spine itself: one inked line running top to bottom, a
 * numbered node per stop, and the leg drawn ON the line between two nodes
 * (arrowhead + mode) rather than as a badge inside a card. Dates get their own
 * left rail in the display face, so scanning down answers "when" without
 * reading a card header.
 */
export function VariantA({ stops, legMode, controls, map }: VariantProps) {
  return (
    <Stack gap={4}>
      {map}
      <ol className="px-1">
        {stops.map((stop, i) => (
          <li
            key={stop.dayIds.join("-")}
            className="grid grid-cols-[7.5rem_2.25rem_1fr] items-stretch"
          >
            {/* left rail: the dates, in the display face, as the anchor */}
            <div className="pt-0.5 text-right">
              <p className="font-display text-[15px] font-semibold leading-tight">
                {shortRange(stop.startDate, stop.endDate)}
              </p>
              <p className="text-xs text-ink-soft">
                {stop.dayIds.length} day{stop.dayIds.length === 1 ? "" : "s"}
              </p>
            </div>

            {/* the spine: node on top, inked line running down to the next */}
            <div className="relative flex flex-col items-center">
              <span
                aria-hidden
                className="z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-pen bg-sheet font-mono text-[11px] text-pen"
              >
                {i + 1}
              </span>
              {i < stops.length - 1 ? (
                <span aria-hidden className="w-px flex-1 bg-rule-strong" />
              ) : null}
            </div>

            <div className="pb-7 pl-1">
              <p className="font-display text-lg font-semibold leading-none">
                {stopName(stop)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {formatDate(stop.startDate)} – {formatDate(stop.endDate)} ·{" "}
                {stop.nights} night{stop.nights === 1 ? "" : "s"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {controls(stop, i)}
              </div>
              {i < stops.length - 1 ? (
                <div className="mt-4 flex items-center gap-2">
                  <span aria-hidden className="text-pen">
                    ↓
                  </span>
                  <LegMark mode={legMode(i + 1)} />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Stack>
  );
}

/* -------------------------------------------------------------------------- */
/* B — Boarding passes                                                        */
/* -------------------------------------------------------------------------- */
/**
 * Direction is reading order: stubs run left to right in a horizontally
 * scrolling strip, each one a torn ticket with FROM → TO across its head, the
 * dates as the big number, and the mode printed on the perforation between
 * stubs. Denser than the list — a five-stop route is one screen wide.
 */
export function VariantB({ stops, legMode, controls, map }: VariantProps) {
  return (
    <Stack gap={4}>
      {map}
      <div className="-mx-1 flex gap-0 overflow-x-auto px-1 pb-3">
        {stops.map((stop, i) => (
          <div key={stop.dayIds.join("-")} className="flex items-stretch">
            {i > 0 ? (
              <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-y border-dashed border-rule-strong">
                <span aria-hidden className="text-pen">
                  →
                </span>
                <LegMark mode={legMode(i)} />
              </div>
            ) : null}
            <article className="w-[17rem] shrink-0 rounded-md border border-rule-strong bg-sheet">
              <header className="flex items-baseline justify-between border-b border-dashed border-rule px-3 py-2">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">
                  Stop {i + 1} of {stops.length}
                </span>
                <Badge tone="marine">
                  {stop.nights} night{stop.nights === 1 ? "" : "s"}
                </Badge>
              </header>
              <div className="px-3 py-3">
                <p className="font-display text-lg font-semibold leading-tight">
                  {stopName(stop)}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-pen">
                  {shortRange(stop.startDate, stop.endDate)}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {i > 0 ? `from ${stopName(stops[i - 1])}` : "trip starts here"}
                  {i < stops.length - 1
                    ? ` · on to ${stopName(stops[i + 1])}`
                    : " · trip ends here"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {controls(stop, i)}
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </Stack>
  );
}

/* -------------------------------------------------------------------------- */
/* C — Date bands                                                             */
/* -------------------------------------------------------------------------- */
/**
 * Dates and order stop being two drawings: the trip's window is one axis
 * across the top, and every stop is a band positioned under it. Length of the
 * band IS the length of the stay, left-to-right IS the direction, and a gap is
 * visible as a gap. Falls back to the plain list when the trip is undated
 * (rule 9) — there is no axis to draw against.
 */
export function VariantC(props: VariantProps) {
  const { stops, legMode, controls, map, tripStart, tripEnd } = props;
  const first = tripStart ?? stops[0]?.startDate;
  const last = tripEnd ?? stops[stops.length - 1]?.endDate;
  if (!first || !last) return <VariantA {...props} />;

  const dayMs = 86_400_000;
  const span =
    Math.round(
      (fromIsoDate(last).getTime() - fromIsoDate(first).getTime()) / dayMs,
    ) + 1;
  const offset = (d: string) =>
    Math.round((fromIsoDate(d).getTime() - fromIsoDate(first).getTime()) / dayMs);
  const pct = (n: number) => `${(n / span) * 100}%`;

  return (
    <Stack gap={4}>
      {map}
      <div className="rounded-md border border-rule-strong bg-sheet px-4 py-4">
        <div className="mb-2 flex items-baseline justify-between font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">
          <span>{formatDate(first, { weekday: false })}</span>
          <span>
            {span} day{span === 1 ? "" : "s"}
          </span>
          <span>{formatDate(last, { weekday: false })}</span>
        </div>
        <div className="relative">
          {stops.map((stop, i) => (
            <div key={stop.dayIds.join("-")} className="relative mb-1.5 h-9">
              <div
                className="absolute top-0 flex h-9 items-center gap-2 overflow-hidden rounded-sm border border-pen-edge bg-pen-soft px-2"
                style={{
                  left: pct(offset(stop.startDate)),
                  width: pct(offset(stop.endDate) - offset(stop.startDate) + 1),
                  minWidth: "5rem",
                }}
              >
                <span className="font-mono text-[10.5px] text-pen">{i + 1}</span>
                <span className="truncate font-display text-sm font-semibold">
                  {stopName(stop)}
                </span>
                <span className="shrink-0 text-xs text-ink-soft">
                  {shortRange(stop.startDate, stop.endDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The bands answer when/where/how long; the rows below stay for doing. */}
      <Stack gap={2}>
        {stops.map((stop, i) => (
          <Card key={stop.dayIds.join("-")}>
            <CardHeader
              strong
              title={`${i + 1}. ${stopName(stop)}`}
              hint={shortRange(stop.startDate, stop.endDate)}
              actions={i > 0 ? <LegMark mode={legMode(i)} /> : null}
            />
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {controls(stop, i)}
            </div>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
