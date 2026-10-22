"use client";

import { useState, type ReactNode } from "react";

import { CheckIcon, LineIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import {
  ringTicks,
  tickRing,
  type RingColumn,
  type Visibility,
} from "@floc/core/people/visibility";

import { ToggleRow } from "./account-ui";

const PARTS = [
  { name: "visibilityVibeTags", label: "Vibe tags" },
  { name: "visibilityTravelMap", label: "Travel map" },
  { name: "visibilityFriends", label: "Friends list" },
] as const;

type PartName = (typeof PARTS)[number]["name"];

const COLUMNS: { ring: RingColumn; label: string; glyph: ReactNode }[] = [
  {
    ring: "friends",
    label: "Friends",
    glyph: (
      <>
        <circle cx="5.2" cy="5" r="2" />
        <path d="M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8" />
      </>
    ),
  },
  {
    ring: "trip_members",
    label: "Travelled with",
    glyph: (
      <>
        <rect x="1.8" y="4.4" width="10.4" height="7.8" rx="1.4" />
        <path d="M5 4.4V3.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2M1.8 7.6h10.4" />
      </>
    ),
  },
];

const GRID = "grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] items-center sm:grid-cols-[9.5rem_7.5rem_7.5rem]";

// Why: you always see your own profile, so there is no "me" column. The form
// still posts one ring per part, through the hidden inputs.
export function PrivacyFields({
  isPrivate,
  rings,
  pastTripsLatest,
}: {
  isPrivate: boolean;
  rings: Record<PartName, Visibility>;
  pastTripsLatest: boolean;
}) {
  const [closed, setClosed] = useState(isPrivate);
  const [value, setValue] = useState(rings);

  return (
    <>
      <div onChange={(e) => setClosed((e.target as HTMLInputElement).checked)}>
        <ToggleRow
          name="isPrivate"
          label="Private profile"
          hint="Only your name shows."
          defaultChecked={isPrivate}
        />
      </div>

      <div
        role="table"
        aria-label="Who sees each part"
        className={cx("divide-y divide-rule border-b border-rule transition-opacity", closed && "pointer-events-none opacity-40")}
      >
        <div role="row" className={cx(GRID, "pb-2")}>
          <span role="columnheader" />
          {COLUMNS.map((c) => (
            <span
              key={c.ring}
              role="columnheader"
              className="flex flex-col items-center gap-1 text-center text-xs text-ink-soft"
            >
              <LineIcon>{c.glyph}</LineIcon>
              {c.label}
            </span>
          ))}
        </div>
        {PARTS.map((p) => {
          const ticks = ringTicks(value[p.name]);
          return (
            <div key={p.name} role="row" className={cx(GRID, "min-h-11")}>
              <input type="hidden" name={p.name} value={value[p.name]} />
              <span role="rowheader" className="text-sm">
                {p.label}
                {value[p.name] === "private" ? (
                  <span className="block text-xs text-ink-faint">Only you</span>
                ) : null}
              </span>
              {COLUMNS.map((c) => (
                <span key={c.ring} role="cell" className="flex justify-center">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={ticks[c.ring]}
                    aria-label={`${p.label}: ${c.label}`}
                    onClick={() =>
                      setValue((v) => ({ ...v, [p.name]: tickRing(v[p.name], c.ring, !ticks[c.ring]) }))
                    }
                    className={cx(
                      "grid size-[1.375rem] place-items-center rounded-[7px] border-[1.5px] transition-colors",
                      ticks[c.ring]
                        ? "border-pen bg-pen text-sheet"
                        : "border-rule-2 bg-sheet hover:border-pen",
                    )}
                  >
                    {ticks[c.ring] ? <CheckIcon /> : null}
                  </button>
                </span>
              ))}
            </div>
          );
        })}
      </div>

      <ToggleRow
        name="pastTripsLatest"
        label="Only my latest past trip"
        defaultChecked={pastTripsLatest}
      />
    </>
  );
}
