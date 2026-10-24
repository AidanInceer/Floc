"use client";

import { useRef, useState } from "react";

import { SaveBar } from "@/components/availability/dates-board-parts";
import { dayLook } from "@/components/availability/day-look";
import { MonthGrid, type DayView } from "@/components/availability/month-grid";
import { useAvailabilityPaint } from "@/components/availability/use-availability-paint";
import { ChevronIcon } from "@/components/system/icons";
import { Button } from "@/components/system/ui";
import { guestSaveDates } from "@/app/invite/[token]/actions";
import { addMonths, formatMonth, type IsoMonth } from "@floc/core/dates/availability";
import { formatDate, today } from "@floc/core/dates/dates";
import { GuestPanel } from "./guest-panel";
import type { GuestAnswer } from "./use-guest-answer";

const dateUnder = (e: React.PointerEvent) =>
  document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-date]")?.dataset.date ?? null;

type Trip = { start: string | null; end: string | null };

/**
 * The guest's own days and nobody else's (#442): the group's counts are the members' to see.
 * The same calendar and painting as Dates, on the "mine" tab only.
 */
export function GuestDates({ token, mine, firstMonth, trip, answer, signUpHref }: {
  token: string;
  mine: string[];
  firstMonth: IsoMonth;
  trip: Trip;
  answer: GuestAnswer;
  signUpHref: string;
}) {
  const [month, setMonth] = useState(firstMonth);
  const paint = useAvailabilityPaint(mine);
  const surface = useRef<HTMLDivElement>(null);

  const ctx = {
    tab: "mine" as const, tallies: {}, memberCount: 1, tripStart: trip.start, tripEnd: trip.end, now: today(),
    isFree: paint.isFree, picking: false, inPick: () => false, pending: () => false, hiOf: () => undefined, hourDay: null,
  };
  const view = (date: string): DayView => {
    const look = dayLook(ctx, date);
    return {
      ...look,
      label: [formatDate(date), look.mine && "you can do it"].filter(Boolean).join(", "),
      press: (e) => {
        e.preventDefault();
        try {
          surface.current?.setPointerCapture(e.pointerId);
        } catch {
          // The pointer is already gone; the press still stands.
        }
        paint.start(date);
      },
      activate: () => paint.toggle(date),
    };
  };

  const save = () => answer.run("dates", () => guestSaveDates(token, paint.add, paint.remove), paint.saved);
  const move = (e: React.PointerEvent) => {
    const date = dateUnder(e);
    if (paint.dragging && date) paint.extend(date);
  };

  return (
    <GuestPanel
      title="Your dates"
      aside={<Pager month={month} page={(n) => setMonth(addMonths(month, n))} />}
      place="dates"
      answer={answer}
      signUpHref={signUpHref}
    >
      <p className="pb-3 text-[13px] text-ink-soft">
        Tap the days you can make.{trip.start && trip.end ? " The trip is in green." : ""}
      </p>
      <div ref={surface} onPointerMove={move} onPointerUp={paint.release} onPointerCancel={paint.release}>
        <MonthGrid month={month} view={view} />
      </div>
      {paint.changed > 0 ? <SaveBar changed={paint.changed} pending={answer.pending} onSave={save} /> : null}
    </GuestPanel>
  );
}

function Pager({ month, page }: { month: IsoMonth; page: (delta: number) => void }) {
  const round = "!size-8 !rounded-full !p-0";
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="secondary" className={round} aria-label="Earlier month" onClick={() => page(-1)}>
        <ChevronIcon direction="left" />
      </Button>
      <p className="min-w-[7.5rem] text-center font-display text-[15px] font-semibold">{formatMonth(month)}</p>
      <Button variant="secondary" className={round} aria-label="Later month" onClick={() => page(1)}>
        <ChevronIcon direction="right" />
      </Button>
    </div>
  );
}
