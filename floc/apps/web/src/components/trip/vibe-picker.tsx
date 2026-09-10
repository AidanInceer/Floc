"use client";

/**
 * The vibe chips, picked the way interests are picked on a dating profile
 * (ticket 46): the whole vocabulary is on screen, you tap the ones that are
 * you, and there is nothing to type.
 *
 * Seed-only, so this is a fixed grid rather than the trip-tag editor's rows —
 * there is no name to edit and no colour to choose. Client-side because the
 * chips toggle; the save is still the page's server action, and the selection
 * posts as one hidden `vibeTag` input per chosen chip.
 *
 * A chip's pastel is decoration, not meaning (ticket 236) — it comes from the
 * position in the vocabulary, so a tag keeps the same colour everywhere and
 * the row doesn't read as one long stripe of blue.
 */
import { useState } from "react";

import { PASTEL_SKINS, cx } from "@/components/system/ui";
import { VIBE_TAGS } from "@floc/core/trip/vibe-tags";

export function VibePicker({ selected }: { selected: string[] }) {
  const [picked, setPicked] = useState<string[]>(selected);

  // No cap to enforce any more: the vocabulary is five tags, so picking all of
  // them is a legitimate answer rather than the wall the limit existed to stop.
  const toggle = (tag: string) =>
    setPicked((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {VIBE_TAGS.map((tag, i) => {
          const on = picked.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(tag)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                on
                  ? cx("border-transparent", PASTEL_SKINS[i % PASTEL_SKINS.length])
                  : "border-rule text-ink-soft hover:bg-sheet-2 hover:text-ink",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {picked.map((tag) => (
        <input key={tag} type="hidden" name="vibeTag" value={tag} />
      ))}

      <p className="text-xs text-ink-faint">
        {picked.length === 0 ? "None picked." : `${picked.length} picked.`}
      </p>
    </div>
  );
}
