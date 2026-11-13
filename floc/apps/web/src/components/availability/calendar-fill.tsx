"use client";

import { useCalendarFill, type CalendarFillResult, type CalendarFillState, type CalendarReturn } from "@/components/availability/use-calendar-fill";
import { CheckIcon, PencilIcon } from "@/components/system/icons";
import { GoogleCalendarIcon } from "@/components/system/icons/google-calendar";
import { Menu } from "@/components/system/client-ui";
import { menuItemClass } from "@/components/system/ui";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const LABEL = "Fill from Google Calendar";

/**
 * Google's own white button, as on sign-in, with Google's Calendar mark on the left. Brand
 * colours are Google's, not ours to repaint — the one place a literal is allowed (ticket 206).
 */
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

/** Where the result goes: what was filled, or why nothing was. Words, since a colour alone says nothing. */
function CalendarNote({ state }: { state: CalendarFillState }) {
  if (state.kind === "error") return <p className="text-[13px] text-red">{state.message}</p>;
  if (state.kind !== "done") return null;
  const total = state.free + state.busy;
  if (total === 0) return <p className="text-[13px] text-ink-soft">Every day is already marked</p>;
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-ink-soft">
      <CheckIcon className="size-[13px] text-green" />
      Filled {plural(total, "day")} from Google Calendar{state.busy ? ` · ${state.busy} busy` : ""}
    </p>
  );
}

/**
 * With no days marked: Google's button, and by hand as words. The grid is already the control for
 * by hand, so only the button acts (#444).
 */
function CalendarChoice({ state, onFill }: { state: CalendarFillState; onFill: () => void }) {
  return (
    <div className="grid gap-2.5 p-4">
      <GoogleCalendarButton reading={state.kind === "reading"} onClick={onFill} />
      {state.kind === "error" ? <CalendarNote state={state} /> : null}
      <div className="flex items-center gap-2.5 border-t border-rule pt-2.5 text-ink">
        <PencilIcon className="size-[14px] shrink-0 text-ink-soft" />
        <p className="text-sm font-medium">Or mark them by hand</p>
      </div>
    </div>
  );
}

/** Once there are marks the import moves into the … menu beside the month. */
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

const NO_FILL = async (): Promise<CalendarFillResult> => ({ status: "error", message: "" });

/**
 * The import's three places on the Dates board: the choice while you have no days, the … menu
 * once you do, and the line under the grid saying what happened. All null with no Google key.
 */
export function useCalendarSlots(opts: {
  tripId: number;
  month: string;
  calendar: { fill: (month: string) => Promise<CalendarFillResult>; returned: CalendarReturn } | null;
  show: boolean;
  empty: boolean;
}) {
  const { calendar, show, empty } = opts;
  const cal = useCalendarFill({ tripId: opts.tripId, month: opts.month, returned: calendar?.returned ?? null, fill: calendar?.fill ?? NO_FILL });
  const choose = calendar !== null && show && empty;
  const reading = cal.state.kind === "reading";
  const settled = cal.state.kind === "done" || cal.state.kind === "error";
  return {
    choose,
    choice: choose ? <CalendarChoice state={cal.state} onFill={cal.run} /> : null,
    menu: calendar && show && !choose ? <Menu label="More for your days"><CalendarMenuItem reading={reading} onFill={cal.run} /></Menu> : null,
    note: settled ? <div className="border-t border-rule py-3"><CalendarNote state={cal.state} /></div> : null,
  };
}
