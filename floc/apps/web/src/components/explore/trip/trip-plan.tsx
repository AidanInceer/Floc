"use client";

import type { PresetPlan } from "@floc/core/trip/explore/detail/preset-plan";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { Fragment, useEffect, useState } from "react";

import { regionTone } from "@/components/explore/trip/region-tone";
import { TripCopyBar, TripCopyCard } from "@/components/explore/trip/trip-copy-card";
import { Arrival, StopPanel } from "@/components/explore/trip/trip-stop";
import { ArrowUpIcon } from "@/components/system/icons";
import { Button, SectionHeading } from "@/components/system/ui";

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TripPlan({ trip, plan, signedIn }: { trip: PresetTrip; plan: PresetPlan; signedIn: boolean }) {
  const tone = regionTone(trip.region);
  const [open, setOpen] = useState<number[]>(plan.detailed ? [1] : []);
  const [jump, setJump] = useState<number | null>(null);

  // A jump may first have to open its day, so scroll once the day is drawn open.
  useEffect(() => {
    if (jump === null) return;
    document.getElementById(`day-${jump}`)?.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
    setJump(null);
  }, [jump]);

  const toggle = (day: number) => setOpen((o) => (o.includes(day) ? o.filter((x) => x !== day) : [...o, day]));
  const jumpTo = (day: number) => {
    setOpen((o) => (o.includes(day) ? o : [...o, day]));
    setJump(day);
  };
  const allOpen = open.length === plan.dayCount;

  return (
    <div className="mt-10 grid items-start gap-9 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14">
      <section>
        <div className="flex items-center justify-between gap-3">
          <SectionHeading>Stop by stop</SectionHeading>
          {plan.detailed ? (
            <Button onClick={() => setOpen(allOpen ? [] : plan.stops.flatMap((s) => s.days.map((d) => d.n)))}>
              {allOpen ? "Close every day" : "Open every day"}
            </Button>
          ) : null}
        </div>
        {plan.detailed ? null : <p className="mt-2 text-sm text-ink-faint">The day plans for this trip are not written yet.</p>}
        <div className="mt-4">
          {plan.stops.map((stop) => (
            <Fragment key={stop.no}>
              {stop.arrive ? <Arrival arrive={stop.arrive} /> : stop.no > 1 ? <div className="h-3" /> : null}
              <StopPanel stop={stop} isOpen={(day) => open.includes(day)} onToggle={toggle} tone={tone} />
            </Fragment>
          ))}
        </div>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: calm() ? "auto" : "smooth" })}
          className="typed mx-auto mt-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:text-ink"
        >
          <ArrowUpIcon size={12} />
          Back to top
        </button>
      </section>
      <TripCopyCard trip={trip} stops={plan.stops} open={open} onJump={jumpTo} signedIn={signedIn} />
      <TripCopyBar trip={trip} signedIn={signedIn} />
    </div>
  );
}
