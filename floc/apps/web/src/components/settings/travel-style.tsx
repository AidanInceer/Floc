"use client";

import { useState } from "react";

import { VIBE_TAG_GROUPS } from "@floc/core/trip/vibe-tags";

import { useSaveWhenChanged } from "./auto-save-form";
import { PickChip, pickLineClass } from "./pick-chip";

/** The vibe tags as a travel style, sorted into pace, places and things to do. Posts one hidden `vibeTag` per pick. */
export function TravelStyle({ selected }: { selected: string[] }) {
  const [picked, setPicked] = useState(selected);
  useSaveWhenChanged(picked);

  const toggle = (tag: string) => setPicked((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {VIBE_TAG_GROUPS.map((g) => (
          <div key={g.name} role="group" aria-label={g.name} className={pickLineClass}>
            <span className="text-[13px] text-ink-faint">{g.name}</span>
            <span className="flex flex-wrap gap-1.5">
              {g.tags.map((tag) => (
                <PickChip key={tag} label={tag} on={picked.includes(tag)} onPress={() => toggle(tag)} />
              ))}
            </span>
          </div>
        ))}
      </div>
      {picked.map((tag) => (
        <input key={tag} type="hidden" name="vibeTag" value={tag} />
      ))}
    </>
  );
}
