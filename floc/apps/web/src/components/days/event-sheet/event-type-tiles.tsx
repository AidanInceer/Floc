"use client";

import "./event-sheet.css";

import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { DAY_EVENT_TYPES, TRANSPORT_TYPES, type DayEventType, type TransportType } from "@floc/core/vocabulary";
import { EventGlyph } from "@/components/system/icons/days";
import { cx } from "@/components/system/ui";

// The chosen tile's edge, so it reads as chosen on its own wash.
const EDGE: Record<DayEventType, string> = {
  activity: "border-pastel-blue-edge",
  transport: "border-pastel-red-edge",
  food: "border-pastel-yellow-edge",
  other: "border-rule-strong",
};

export const HOW_LABELS: Record<TransportType, string> = {
  flight: "Flight",
  train: "Train",
  car: "Car",
  ferry: "Ferry",
  other: "Other",
};

/**
 * The event's type as four tiles, each in its own colour (Other is grey). Picking
 * Transport opens How inside its tile rather than below it (wireframe/modal-forms B3).
 * The hidden fields carry both answers; switching away from Transport drops How.
 */
export function EventTypeTiles({
  type,
  how,
  onType,
  onHow,
}: {
  type: DayEventType;
  how: TransportType | null;
  onType: (type: DayEventType) => void;
  onHow: (how: TransportType) => void;
}) {
  const transport = type === "transport";
  return (
    <div role="group" aria-label="Type" className="event-types" data-transport={transport ? "" : undefined}>
      <input type="hidden" name="type" value={type} />
      {transport && how ? <input type="hidden" name="transportType" value={how} /> : null}
      {DAY_EVENT_TYPES.map((t) =>
        t === "transport" && transport ? (
          <TransportCell key={t} how={how} onHow={onHow} />
        ) : (
          <TypeTile key={t} type={t} on={type === t} compact={transport} onPick={() => onType(t)} />
        ),
      )}
    </div>
  );
}

function TypeTile({ type, on, compact, onPick }: { type: DayEventType; on: boolean; compact: boolean; onPick: () => void }) {
  const category = EVENT_CATEGORIES[type];
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={cx(
        "lift flex h-full min-w-0 flex-col items-center justify-center rounded-sm border px-1 transition-colors",
        compact ? "gap-[5px] text-xs max-[480px]:px-0.5" : "gap-[7px] text-[13px]",
        on ? cx(category.tile, EDGE[type], "font-medium") : "border-rule-strong bg-sheet text-ink-soft hover:border-pen hover:text-ink",
      )}
    >
      <span className={cx("grid size-8 place-items-center rounded-sm max-[480px]:size-7", on ? "bg-sheet" : "bg-sheet-2 text-ink-faint")}>
        <EventGlyph type={type} transportType={null} size={15} />
      </span>
      <span className="max-w-full">{category.label}</span>
    </button>
  );
}

function TransportCell({ how, onHow }: { how: TransportType | null; onHow: (how: TransportType) => void }) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col items-center justify-center gap-[5px] overflow-hidden rounded-sm border px-[5px] max-[480px]:px-1",
        EDGE.transport,
        EVENT_CATEGORIES.transport.tile,
      )}
    >
      <span className="text-xs font-medium leading-tight">
        Transport
      </span>
      <div role="radiogroup" aria-label="How, by transport" className="flex w-full justify-center gap-[3px]">
        {TRANSPORT_TYPES.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={how === k}
            onClick={() => onHow(k)}
            className={cx(
              "flex min-w-0 max-w-[44px] flex-1 flex-col items-center gap-0.5 rounded-sm border pb-1 pt-[5px] text-[11px] transition-colors",
              how === k ? "border-current bg-sheet font-medium" : "border-transparent bg-sheet/55 hover:border-current",
            )}
          >
            <EventGlyph type="transport" transportType={k} size={13} />
            {HOW_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}
