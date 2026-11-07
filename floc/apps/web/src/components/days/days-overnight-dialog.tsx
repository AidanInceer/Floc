"use client";

/**
 * Where the group sleeps, for a span of days (ticket 141; split out under 243) —
 * the whole gesture for anyone who can't drag. Drawn as wireframe/modal-forms B3b:
 * the place in the head, the last night picked from one joined row of the days
 * still ahead, and a line saying what the stay takes from the next one.
 */
import { useEffect, useRef, useState } from "react";

import { PlacePicker, type PlacePickerResult } from "@/components/social/place-picker";
import { Dialog, DialogClose } from "@/components/system/dialog";
import { BedIcon } from "@/components/system/icons/days";
import { Button, buttonClass, cx } from "@/components/system/ui";
import { CALENDAR_DIALOG } from "@/components/days/days-calendar-chrome";
import type { CalendarDay, OvernightPlace } from "@/components/days/days-calendar-shared";
import type { PlaceSearch } from "@/components/days/event-form";
import type { BandSpan } from "@floc/core/itinerary/overnight-band";
import { stayNights } from "@floc/core/itinerary/overnight-pick";
import { stayCheckOut, stayLinks } from "@floc/core/trip/booking/booking-links";
import { formatShortRange } from "@floc/core/dates/dates";
import { OFFSITE_NOTE } from "@/components/booking/site-links";
import { SitePicker } from "@/components/booking/site-picker";

export function OvernightDialog({
  span,
  days,
  searchPlaces,
  groupSize,
  bookingPrefill,
  onClose,
  onSave,
  onClear,
}: {
  span: BandSpan;
  /** The trip's real days — the last of them is as far as a stay can reach. */
  days: CalendarDay[];
  searchPlaces: PlaceSearch;
  groupSize: number;
  bookingPrefill: boolean;
  onClose: () => void;
  onSave: (end: string, place: OvernightPlace) => void;
  onClear: () => void;
}) {
  const [pick, setPick] = useState<PlacePickerResult | null>(null);
  const [end, setEnd] = useState(span.end);
  const endCell = useRef<HTMLButtonElement>(null);
  // A long trip scrolls the row; open with the stay's last night in view.
  // Why: newer Chromium returns a Promise from scrollIntoView, and an effect that returns one crashes the page.
  useEffect(() => void endCell.current?.scrollIntoView({ block: "nearest", inline: "nearest" }), []);
  const ahead = days.filter((d) => !d.outside && d.date >= span.start);
  const startLabel = ahead[0]?.shortLabel ?? span.start;
  const name = pick ? pick.name : (span.placeName ?? "");
  const nights = stayNights(
    ahead.map((d) => ({ date: d.date, placeId: d.overnightPlaceId, placeName: d.overnightPlaceName })),
    { start: span.start, placeId: span.placeId },
    end,
  );

  const save = () => {
    // An untouched picker means the span keeps the place it already had — the
    // id, not the name, so the stay keeps its pin (see `resolveOvernightPlace`).
    const place: OvernightPlace | null = pick?.name.trim()
      ? { name: pick.name, providerId: pick.providerId, lat: pick.lat, lng: pick.lng, countryCode: pick.countryCode }
      : span.placeId !== null
        ? { placeId: span.placeId }
        : null;
    if (!place) return;
    onSave(end < span.start ? span.start : end, place);
  };

  return (
    <Dialog open onClose={onClose} title={`Overnight from ${startLabel}`} className={CALENDAR_DIALOG}>
      <div className="bg-pastel-blue px-5 pb-4 pt-2.5 text-pastel-blue-ink max-sm:px-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[12.5px]">
          <span>Overnight from {startLabel}</span>
          <DialogClose />
        </div>
        <div className="grid grid-cols-[34px_minmax(0,1fr)] items-end gap-3 pr-2">
          <span className="mb-1.5 grid size-[34px] place-items-center rounded-sm bg-sheet">
            <BedIcon size={16} />
          </span>
          <PlacePicker name="overnight" look="display" defaultName={span.placeName ?? ""} search={searchPlaces} onSelect={setPick} />
        </div>
      </div>

      <div className="px-5 py-[18px] max-sm:px-4">
        <span id="overnight-last" className="mb-[7px] block font-mono text-xs text-ink-faint">
          Last night
        </span>
        <div
          role="group"
          aria-labelledby="overnight-last"
          className="grid auto-cols-[minmax(44px,1fr)] grid-flow-col overflow-x-auto rounded-sm border border-rule-strong"
        >
          {ahead.map((d, i) => {
            const inside = d.date <= end;
            return (
              <button
                key={d.date}
                ref={d.date === span.end ? endCell : undefined}
                type="button"
                aria-pressed={inside}
                aria-label={d.longLabel}
                onClick={() => setEnd(d.date)}
                className={cx(
                  "group flex flex-col items-center gap-px py-2 font-mono text-[11px] transition-colors hover:text-pen",
                  i > 0 && "border-l",
                  inside ? "border-pen-edge bg-pen-soft text-pen-deep" : "border-rule text-ink-faint",
                )}
              >
                <span>{d.weekday}</span>
                <b className={cx("text-[17px] font-medium leading-tight transition-colors group-hover:text-pen", inside ? "text-pen-deep" : "text-ink")}>{d.dayOfMonth}</b>
              </button>
            );
          })}
        </div>
        <p className="nums mt-2.5 text-[13px] text-ink-soft" aria-live="polite">
          {nights.label}
        </p>
        {nights.taken.map((line) => (
          <p key={line} className="mt-1 text-[13px] text-ink-soft">
            {line}
          </p>
        ))}
      </div>

      {span.placeName ? (
        <FindStay
          place={name.trim() || span.placeName}
          checkIn={span.start}
          checkOut={stayCheckOut(end, days.filter((d) => !d.outside).at(-1)?.date ?? null)}
          adults={groupSize}
          prefill={bookingPrefill}
        />
      ) : null}

      <footer className="flex items-center justify-end gap-2 border-t border-rule px-5 py-3 max-sm:px-4">
        {/* Only shown where there's something to clear. */}
        {span.placeId !== null ? (
          <button type="button" onClick={onClear} className="mr-auto rounded-sm px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint transition-colors hover:text-pen">
            Clear place
          </button>
        ) : null}
        <DialogClose className={buttonClass("secondary")}>
          Cancel
        </DialogClose>
        <Button type="button" variant="primary" onClick={save} disabled={!name.trim()}>
          Save
        </Button>
      </footer>
    </Dialog>
  );
}

/** Booking links for the stay, centred under the picker (wireframe/modal-forms B3, booking-sites J). */
function FindStay(props: { place: string; checkIn: string; checkOut: string; adults: number; prefill: boolean }) {
  return (
    <section className="border-t border-rule bg-sheet-2 px-5 py-3.5 text-center max-sm:px-4">
      <p className="text-sm font-medium">Find a stay in {props.place}</p>
      <SitePicker kind="stays" links={stayLinks(props)} label={`Find a stay in ${props.place}`} head={`${props.place} · ${formatShortRange(props.checkIn, props.checkOut)}`} drop="up" className="my-2.5 justify-center" />
      <p className="text-[11px] text-ink-faint">{OFFSITE_NOTE}</p>
    </section>
  );
}
