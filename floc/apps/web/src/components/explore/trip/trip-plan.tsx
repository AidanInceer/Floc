"use client";

import type { PresetPlan } from "@floc/core/trip/explore/detail/preset-plan";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { regionTone } from "@/components/explore/trip/region-tone";
import { TripCopyBar, TripCopyCard } from "@/components/explore/trip/trip-copy-card";
import { Arrival, StopPanel } from "@/components/explore/trip/trip-stop";
import { ArrowUpIcon } from "@/components/system/icons";
import { Button, SectionHeading } from "@/components/system/ui";

// The day whose card crosses the middle of the screen is the day being read.
function useDayOnScreen(onDay: (day: number) => void, watchKey: string) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const watch = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) onDay(Number((e.target as HTMLElement).dataset.day));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    el.querySelectorAll("[data-day]").forEach((d) => watch.observe(d));
    return () => watch.disconnect();
  }, [onDay, watchKey]);
  return host;
}

export function TripPlan({ trip, plan, signedIn }: { trip: PresetTrip; plan: PresetPlan; signedIn: boolean }) {
  const tone = regionTone(trip.region);
  const [now, setNow] = useState(plan.detailed ? 1 : 0);
  const [shut, setShut] = useState<number[]>([]);
  const [jump, setJump] = useState<number | null>(null);
  // Why: a smooth jump scrolls past every day between, and each would take the mark in turn.
  const jumping = useRef(false);
  const host = useDayOnScreen(useCallback((day: number) => { if (!jumping.current) setNow(day); }, []), shut.join());

  // A jump may first have to unfold its stop, so scroll once the day is on the page.
  useEffect(() => {
    if (jump === null) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`day-${jump}`)?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    setJump(null);
    const land = () => {
      jumping.current = false;
      window.removeEventListener("scrollend", land);
      window.clearTimeout(giveUp);
    };
    // No scroll happens when the day is already in place, so "scrollend" alone could hold the mark for ever.
    const giveUp = window.setTimeout(land, 1500);
    window.addEventListener("scrollend", land);
  }, [jump]);

  const toggle = (no: number) => setShut((s) => (s.includes(no) ? s.filter((x) => x !== no) : [...s, no]));
  const jumpTo = (day: number) => {
    const stop = plan.stops.find((s) => s.days.some((d) => d.n === day));
    if (stop) setShut((s) => s.filter((x) => x !== stop.no));
    jumping.current = true;
    setNow(day);
    setJump(day);
  };
  const allShut = shut.length === plan.stops.length;

  return (
    <div className="mt-10 grid items-start gap-9 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14">
      <section ref={host}>
        <div className="flex items-center justify-between gap-3">
          <SectionHeading>Stop by stop</SectionHeading>
          {plan.detailed ? (
            <Button onClick={() => setShut(allShut ? [] : plan.stops.map((s) => s.no))}>{allShut ? "Open all" : "Fold all"}</Button>
          ) : null}
        </div>
        {plan.detailed ? null : <p className="mt-2 text-sm text-ink-faint">The day plans for this trip are not written yet.</p>}
        <div className="mt-4">
          {plan.stops.map((stop) => (
            <Fragment key={stop.no}>
              {stop.arrive ? <Arrival arrive={stop.arrive} /> : stop.no > 1 ? <div className="h-3" /> : null}
              <StopPanel stop={stop} open={!shut.includes(stop.no)} onToggle={() => toggle(stop.no)} now={now} onPick={setNow} tone={tone} />
            </Fragment>
          ))}
        </div>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
          className="typed mx-auto mt-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:text-ink"
        >
          <ArrowUpIcon size={12} />
          Back to top
        </button>
      </section>
      <TripCopyCard trip={trip} stops={plan.stops} now={now} onJump={jumpTo} signedIn={signedIn} tone={tone} />
      <TripCopyBar trip={trip} signedIn={signedIn} />
    </div>
  );
}
