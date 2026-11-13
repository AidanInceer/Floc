"use client";

/**
 * Where the group sleeps, for a span of days (ticket 141; split out under 243) —
 * the whole gesture for anyone who can't drag. The place sits in the head; the first
 * and last night are picked on the month calendar (wireframe/days-week F), with a
 * line saying what the stay takes from another one.
 */
import { useState } from "react";

import { PlacePicker, type PlacePickerResult } from "@/components/social/place-picker";
import { Dialog, DialogClose } from "@/components/system/dialog";
import { BedIcon } from "@/components/system/icons/days";
import { Button, buttonClass, cx, panelBandClass, panelTitleClass } from "@/components/system/ui";
import { CALENDAR_DIALOG } from "@/components/days/days-calendar-chrome";
import type { CalendarDay, OvernightPlace } from "@/components/days/days-calendar-shared";
import { OvernightCalendar } from "@/components/days/days-overnight-calendar";
import type { PlaceSearch } from "@/components/days/event-form";
import type { BandSpan } from "@floc/core/itinerary/overnight-band";
import { stayNights, stayOpening, stayWrites, type StayWrite } from "@floc/core/itinerary/stay/overnight-pick";
import { previewNight, tapNight, type NightPick } from "@floc/core/itinerary/stay/stay-calendar";
import { stayCheckOut, stayLinks } from "@floc/core/trip/booking/booking-links";
import { formatShortRange, type IsoDate } from "@floc/core/dates/dates";
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
  /** The writes in order: the stay first, then the old nights it gives back. */
  onSave: (writes: StayWrite[], place: OvernightPlace) => void;
  onClear: () => void;
}) {
  const trip = days.filter((d) => !d.outside);
  const tripLast = trip.at(-1)?.date ?? span.end;
  const nightDays = trip.length > 1 ? trip.slice(0, -1) : trip;
  const [found, setFound] = useState<PlacePickerResult | null>(null);
  const [pick, setPick] = useState<NightPick>(() => ({ ...stayOpening(span, tripLast), picking: false }));
  const startLabel = trip.find((d) => d.date === pick.start)?.shortLabel ?? pick.start;
  const name = found ? found.name : (span.placeName ?? "");
  const nights = stayNights(
    nightDays.map((d) => ({ date: d.date, placeId: d.overnightPlaceId, placeName: d.overnightPlaceName })),
    { start: pick.start, placeId: span.placeId },
    pick.end,
  );
  const placeOf = (date: IsoDate) =>
    previewNight(date, trip.find((d) => d.date === date)?.overnightPlaceName ?? null, pick, span, name);

  const save = () => {
    // An untouched picker means the span keeps the place it already had — the
    // id, not the name, so the stay keeps its pin (see `resolveOvernightPlace`).
    const place: OvernightPlace | null = found?.name.trim()
      ? { name: found.name, providerId: found.providerId, lat: found.lat, lng: found.lng, countryCode: found.countryCode }
      : span.placeId !== null
        ? { placeId: span.placeId }
        : null;
    if (!place) return;
    onSave(stayWrites(span, pick.start, pick.end, tripLast), place);
  };

  return (
    <Dialog open onClose={onClose} title={`Overnight from ${startLabel}`} className={CALENDAR_DIALOG}>
      <div className="bg-pastel-blue px-5 pb-4 pt-2.5 text-pastel-blue-ink max-sm:px-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[13px]">
          <span>Overnight from {startLabel}</span>
          <DialogClose />
        </div>
        <div className="grid grid-cols-[34px_minmax(0,1fr)] items-end gap-3 pr-2">
          <span className="mb-1.5 grid size-[34px] place-items-center rounded-sm bg-sheet">
            <BedIcon size={16} />
          </span>
          <PlacePicker name="overnight" look="display" defaultName={span.placeName ?? ""} search={searchPlaces} onSelect={setFound} />
        </div>
      </div>

      <div className={panelBandClass}>
        <span className={cx(panelTitleClass, "mb-2")}>First and last night</span>
        <OvernightCalendar trip={nightDays} pick={pick} placeOf={placeOf} onTap={(date) => setPick((p) => tapNight(p, date))} />
        <p className="nums mt-2.5 text-[13px] text-ink-soft" aria-live="polite">
          {nights.label}
        </p>
        {/* Why: a line held open, so the centred dialog does not move under the next tap. */}
        <div className="grid min-h-5 content-start gap-1">
          {nights.taken.map((line) => (
            <p key={line} className="text-[13px] text-ink-soft">
              {line}
            </p>
          ))}
        </div>
      </div>

      {span.placeName ? (
        <FindStay
          place={name.trim() || span.placeName}
          checkIn={pick.start}
          checkOut={stayCheckOut(pick.end, tripLast)}
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
