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
 */
import { useState } from "react";

import { cx } from "@/components/ui";
import { VIBE_TAGS } from "@/lib/vibe-tags";

export function VibePicker({ selected }: { selected: string[] }) {
  const [picked, setPicked] = useState<string[]>(selected);

  // No cap to enforce any more: the vocabulary is five tags, so picking all of
  // them is a legitimate answer rather than the wall the limit existed to stop.
  const toggle = (tag: string) =>
    setPicked((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {VIBE_TAGS.map((tag) => {
          const on = picked.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(tag)}
              className={cx(
                "rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] transition-colors",
                on
                  ? "border-transparent bg-pen text-sheet"
                  : "border-rule text-ink-soft hover:bg-sheet-2",
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
