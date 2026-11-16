"use client";

import { useState, type ReactNode } from "react";

import { useCalendarFill, type CalendarFillResult, type CalendarFillState, type CalendarSource } from "@/components/availability/use-calendar-fill";
import { CheckIcon, PencilIcon } from "@/components/system/icons";
import { GoogleCalendarIcon } from "@/components/system/icons/google-calendar";
import { Menu } from "@/components/system/client-ui";
import { menuItemClass } from "@/components/system/ui";
import { countWord } from "@floc/core/text/count-word";

import "@/components/auth/account-ui.css";

const LABEL = "Fill from Google Calendar";
const ALL_DAY = "All-day events only";
const ALL_DAY_HINT = "Timed events leave the day free";
const NOT_SAVED = "Couldn't save that. Nothing changed.";

function GoogleCalendarButton({ reading, onClick }: { reading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={reading}
      className="lift flex w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-sm border border-[#747775] bg-white px-3 py-2.5 text-sm font-medium text-[#1f1f1f] disabled:pointer-events-none disabled:opacity-60"
    >
      <GoogleCalendarIcon size={18} />
      {reading ? "Reading your calendar…" : LABEL}
    </button>
  );
}

function CalendarNote({ state }: { state: CalendarFillState }) {
  if (state.kind === "error") return <p className="text-[13px] text-red">{state.message}</p>;
  if (state.kind !== "done") return null;
  const total = state.free + state.busy;
  if (total === 0) return <p className="text-[13px] text-ink-soft">Every day is already marked</p>;
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-ink-soft">
      <CheckIcon className="size-[13px] text-green" />
      Filled {countWord(total, "day")} from Google Calendar{state.busy ? ` · ${state.busy} busy` : ""}
    </p>
  );
}

function CalendarChoice({ state, onFill, allDay }: { state: CalendarFillState; onFill: () => void; allDay: ReactNode }) {
  return (
    <div className="grid gap-2.5 p-4">
      <GoogleCalendarButton reading={state.kind === "reading"} onClick={onFill} />
      {allDay}
      {state.kind === "error" ? <CalendarNote state={state} /> : null}
      <div className="flex items-center gap-2.5 border-t border-rule pt-2.5 text-ink">
        <PencilIcon className="size-[14px] shrink-0 text-ink-soft" />
        <p className="text-sm font-medium">Or mark them by hand</p>
      </div>
    </div>
  );
}

function CalendarMenuItem({ reading, onFill }: { reading: boolean; onFill: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onFill();
      }}
    >
      <button type="submit" disabled={reading} className={`${menuItemClass} !flex items-center gap-2 disabled:opacity-60`}>
        <GoogleCalendarIcon size={14} />
        {reading ? "Reading your calendar…" : LABEL}
      </button>
    </form>
  );
}

type AllDay = { on: boolean; failed: boolean; set: (on: boolean) => void };

function NotSaved({ allDay, className = "" }: { allDay: AllDay; className?: string }) {
  return allDay.failed ? <p className={`text-[13px] text-red ${className}`}>{NOT_SAVED}</p> : null;
}

function AllDaySwitch({ allDay }: { allDay: AllDay }) {
  return (
    <>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={allDay.on} onChange={(e) => allDay.set(e.target.checked)} className="peer sr-only" />
        <span className="switch-track" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm">{ALL_DAY}</span>
          <span className="mt-0.5 block text-xs text-ink-faint">{ALL_DAY_HINT}</span>
        </span>
      </label>
      <NotSaved allDay={allDay} />
    </>
  );
}

function AllDayMenuItem({ allDay }: { allDay: AllDay }) {
  return (
    <>
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={allDay.on}
        onClick={() => allDay.set(!allDay.on)}
        className={`${menuItemClass} !flex items-start gap-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pen`}
      >
        <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border border-rule-strong text-pen-deep">
          {allDay.on ? <CheckIcon size={12} /> : null}
        </span>
        <span className="min-w-0">
          <span className="block">{ALL_DAY}</span>
          <span className="block text-xs text-ink-faint">{ALL_DAY_HINT}</span>
        </span>
      </button>
      <NotSaved allDay={allDay} className="px-2.5 py-1" />
    </>
  );
}

function useAllDay(source: CalendarSource | null): AllDay {
  const [on, setOn] = useState(source?.allDayOnly ?? false);
  const [failed, setFailed] = useState(false);
  return {
    on,
    failed,
    set(next) {
      setOn(next);
      setFailed(false);
      source?.keepAllDayOnly(next).catch(() => {
        setOn(!next);
        setFailed(true);
      });
    },
  };
}

const NO_FILL = async (): Promise<CalendarFillResult> => ({ status: "error", message: "" });

export function useCalendarSlots(opts: {
  tripId: number;
  month: string;
  calendar: CalendarSource | null;
  show: boolean;
  empty: boolean;
}) {
  const { calendar, show, empty } = opts;
  const allDay = useAllDay(calendar);
  const cal = useCalendarFill({ tripId: opts.tripId, month: opts.month, returned: calendar?.returned ?? null, fill: calendar?.fill ?? NO_FILL });
  const choose = calendar !== null && show && empty;
  const reading = cal.state.kind === "reading";
  const settled = cal.state.kind === "done" || cal.state.kind === "error";
  return {
    choose,
    choice: choose ? <CalendarChoice state={cal.state} onFill={cal.run} allDay={<AllDaySwitch allDay={allDay} />} /> : null,
    menu:
      calendar && show && !choose ? (
        <Menu label="More for your days">
          <CalendarMenuItem reading={reading} onFill={cal.run} />
          <AllDayMenuItem allDay={allDay} />
        </Menu>
      ) : null,
    note: settled ? <div className="border-t border-rule py-3"><CalendarNote state={cal.state} /></div> : null,
  };
}
