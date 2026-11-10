"use client";

import { useState, type ReactNode } from "react";

import { ToggleRow } from "@/components/auth/account-ui";
import { LineIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import { ringTicks, tickRing, type RingColumn, type Visibility } from "@floc/core/people/visibility";

import { useSaveWhenChanged } from "./auto-save-form";
import { PickChip, pickLineClass } from "./pick-chip";

const PARTS = [
  { name: "visibilityVibeTags", label: "Vibe tags" },
  { name: "visibilityTravelMap", label: "Travel map" },
  { name: "visibilityFriends", label: "Friends list" },
] as const;

type PartName = (typeof PARTS)[number]["name"];

const AUDIENCES: { ring: RingColumn; label: string; glyph: ReactNode }[] = [
  {
    ring: "friends",
    label: "Friends",
    glyph: <path d="M5.2 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8" />,
  },
  {
    ring: "trip_members",
    label: "Travelled with",
    glyph: <path d="M3.2 4.4h7.6a1.4 1.4 0 0 1 1.4 1.4v5a1.4 1.4 0 0 1-1.4 1.4H3.2a1.4 1.4 0 0 1-1.4-1.4v-5a1.4 1.4 0 0 1 1.4-1.4ZM5 4.4V3.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2M1.8 7.6h10.4" />,
  },
];

/** Why: one line per audience, the parts it sees as chips. Rings nest, so a chip on the wider line brings the narrower one with it. */
export function PrivacyLines({
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
  useSaveWhenChanged(value);

  return (
    <>
      <div onChange={(e) => setClosed((e.target as HTMLInputElement).checked)}>
        <ToggleRow name="isPrivate" label="Private profile" hint="Only your name shows." defaultChecked={isPrivate} />
      </div>

      <div inert={closed} className={cx("flex flex-col gap-3 transition-opacity duration-220 ease-(--ease)", closed && "opacity-40")}>
        {PARTS.map((p) => (
          <input key={p.name} type="hidden" name={p.name} value={value[p.name]} />
        ))}
        {AUDIENCES.map((a) => (
          <div key={a.ring} role="group" aria-label={`${a.label} see`} className={pickLineClass}>
            <span className="flex items-center gap-2.5 text-sm">
              <LineIcon className="text-ink-soft">{a.glyph}</LineIcon>
              {a.label}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {PARTS.map((p) => {
                const on = ringTicks(value[p.name])[a.ring];
                return (
                  <PickChip
                    key={p.name}
                    label={p.label}
                    on={on}
                    onPress={() => setValue((v) => ({ ...v, [p.name]: tickRing(v[p.name], a.ring, !on) }))}
                  />
                );
              })}
            </span>
          </div>
        ))}
      </div>

      <ToggleRow name="pastTripsLatest" label="Only my latest past trip" defaultChecked={pastTripsLatest} />
    </>
  );
}
