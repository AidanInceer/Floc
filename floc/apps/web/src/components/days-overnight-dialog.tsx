"use client";

/**
 * Where the group sleeps, for a span of days (ticket 141; split out under 243) —
 * the whole gesture for anyone who can't drag; the last-day field does a
 * fortnight in one keystroke.
 */
import { useEffect, useRef, useState } from "react";

import { PlacePicker, type PlacePickerResult } from "@/components/place-picker";
import { Button, Field, Input } from "@/components/ui";
import {
  describeSpan,
  type CalendarDay,
  type OvernightPlace,
} from "@/components/days-calendar-shared";
import type { PlaceSearch } from "@/components/event-form";
import type { BandSpan } from "@floc/core/overnight-band";

export function OvernightDialog({
  span,
  days,
  searchPlaces,
  onClose,
  onSave,
  onClear,
}: {
  span: BandSpan;
  /** The trip's real days — the last of them is as far as a stay can reach. */
  days: CalendarDay[];
  searchPlaces: PlaceSearch;
  onClose: () => void;
  onSave: (end: string, place: OvernightPlace) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pick, setPick] = useState<PlacePickerResult | null>(null);
  const [end, setEnd] = useState(span.end);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  const save = () => {
    // An untouched picker means the span keeps the place it already had — the
    // id, not the name, so the stay keeps its pin (see `resolveOvernightPlace`).
    const place: OvernightPlace | null = pick?.name.trim()
      ? {
          name: pick.name,
          providerId: pick.providerId,
          lat: pick.lat,
          lng: pick.lng,
          countryCode: pick.countryCode,
        }
      : span.placeId !== null
        ? { placeId: span.placeId }
        : null;
    if (!place) return;
    onSave(end < span.start ? span.start : end, place);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(ev) => {
        if (ev.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-lg bg-sheet p-0 text-ink shadow-card backdrop:bg-black/30"
    >
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="font-display text-base font-semibold">
          Overnight — {describeSpan(days, span)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-sm px-2 text-lg leading-none text-ink-faint hover:text-ink"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 p-4">
        {/* Only shown where there's something to clear. */}
        {span.placeId !== null ? (
          <div>
            <Button type="button" onClick={onClear}>
              No overnight place
            </Button>
          </div>
        ) : null}

        <PlacePicker
          name="overnight"
          label="Place"
          defaultName={span.placeName ?? ""}
          search={searchPlaces}
          onSelect={setPick}
        />

        <Field label="Last day">
          <Input
            type="date"
            value={end}
            min={span.start}
            max={days[days.length - 1]?.date}
            onChange={(ev) => setEnd(ev.target.value)}
          />
        </Field>

        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </dialog>
  );
}
