"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { putIdeaOnDays } from "@/app/trip/[id]/overview/actions";
import { Dialog, DialogClose } from "@/components/system/dialog";
import { Button, ErrorText, busyMark, buttonClass, cx, panelBandClass, panelTitleClass } from "@/components/system/ui";
import { dayParts } from "@floc/core/dates/dates";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { ideaEventType } from "@floc/core/trip/idea-categories";
import { IDEA_TIMES, type IdeaRow } from "@floc/core/trip/ideas";

export type IdeaDay = { id: number; date: string; place: string | null };

const chip = (on: boolean) =>
  cx(
    "rounded-sm border transition-colors",
    on ? "border-pen bg-pen-soft text-pen-deep" : "border-rule-strong text-ink-soft hover:border-pen hover:text-ink",
  );

export function IdeaDaysDialog({
  tripId,
  idea,
  days,
  onClose,
  onPlaced,
}: {
  tripId: number;
  idea: IdeaRow;
  days: IdeaDay[];
  onClose: () => void;
  onPlaced: (day: IdeaDay) => void;
}) {
  const [dayId, setDayId] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, start] = useTransition();
  const chosen = days.find((day) => day.id === dayId) ?? null;

  const add = () => {
    if (!chosen) return;
    start(async () => {
      try {
        await putIdeaOnDays(tripId, idea.id, chosen.id, time);
        onPlaced(chosen);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Add ${idea.title} to Days`}
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-[30rem] overflow-y-auto rounded-t-md bg-sheet p-0 text-ink shadow-lifted backdrop:bg-black/40 sm:m-auto sm:rounded-md"
    >
      <header className={cx("flex items-center justify-between gap-3 px-5 py-3.5 max-sm:px-4", EVENT_CATEGORIES[ideaEventType(idea.category)].tile)}>
        <h2 className="min-w-0 font-display text-lg">{idea.title}</h2>
        <DialogClose />
      </header>

      {days.length === 0 ? (
        <div className={panelBandClass}>
          <p className="text-sm text-ink">This trip has no days yet.</p>
          <Link href={`/trip/${tripId}/dates`} className="mt-2 inline-block text-sm text-pen-deep underline underline-offset-2">Set the dates</Link>
        </div>
      ) : (
        <>
          <div className={panelBandClass}>
            <h3 className={panelTitleClass}>Day</h3>
            <div role="group" aria-label="Day" className="mt-2 flex gap-1 overflow-x-auto p-px [scrollbar-width:none] sm:grid sm:grid-cols-7 sm:overflow-visible">
              {days.map((day) => {
                const parts = dayParts(day.date);
                return (
                  <button key={day.id} type="button" aria-pressed={day.id === dayId} onClick={() => setDayId(day.id)} className={cx(chip(day.id === dayId), "grid min-w-[3.25rem] flex-1 justify-items-center px-1 py-1 leading-tight")}>
                    <span className="font-mono text-xs uppercase">{parts.weekday}</span>
                    <span className="nums font-mono text-base">{parts.day}</span>
                    {day.place ? <span className="max-w-[3.5rem] truncate text-xs">{day.place.split(",")[0]}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={panelBandClass}>
            <h3 className={panelTitleClass}>Time</h3>
            <div role="group" aria-label="Time" className="mt-2 flex flex-wrap gap-1">
              {IDEA_TIMES.map((option) => (
                <button key={option.label} type="button" aria-pressed={option.time === time} onClick={() => setTime(option.time)} className={cx(chip(option.time === time), "inline-flex h-[31px] items-center gap-1.5 px-2.5 text-sm")}>
                  {option.label}
                  {option.time ? <span className="nums font-mono text-xs">{option.time}</span> : null}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <footer className="flex items-center justify-end gap-2 border-t border-rule px-5 py-3 max-sm:px-4">
        {failed ? <span className="mr-auto"><ErrorText>That did not save. Try again.</ErrorText></span> : null}
        <DialogClose className={buttonClass()}>Cancel</DialogClose>
        {days.length > 0 ? (
          <Button variant="primary" disabled={!chosen || busy} aria-busy={busy || undefined} onClick={add}>
            Add to Days{busyMark(busy)}
          </Button>
        ) : null}
      </footer>
    </Dialog>
  );
}
