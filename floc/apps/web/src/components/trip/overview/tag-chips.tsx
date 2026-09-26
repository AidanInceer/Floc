"use client";

// Why: each change posts the whole list — `setTripTags` owns normalising and the cap.
import { useState } from "react";

import { MAX_TAGS, MAX_TAG_LENGTH } from "@floc/core/trip/tags";
import { setTripTags } from "@/app/trip/[id]/overview/actions";
import { cx } from "@/components/system/ui";

export function TagChips({
  tripId,
  tags,
  skin,
}: {
  tripId: number;
  tags: string[];
  /** The trip's pastel — tags wear the trip's one colour (ticket 213). */
  skin: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <form
          key={tag}
          action={setTripTags}
          className={cx("inline-flex items-center gap-1 rounded-full py-0.5 pl-3 pr-1 text-xs font-semibold", skin)}
        >
          <input type="hidden" name="tripId" value={tripId} />
          {tags
            .filter((t) => t !== tag)
            .map((t) => (
              <input key={t} type="hidden" name="tag" value={t} />
            ))}
          {tag}
          <button
            type="submit"
            aria-label={`Remove the tag ${tag}`}
            title="Remove"
            className="grid size-4 place-items-center rounded-full leading-none opacity-50 hover:bg-sheet hover:opacity-100"
          >
            ×
          </button>
        </form>
      ))}

      {adding ? (
        <form
          action={setTripTags}
          onSubmit={() => setTimeout(() => setAdding(false), 0)}
        >
          <input type="hidden" name="tripId" value={tripId} />
          {tags.map((t) => (
            <input key={t} type="hidden" name="tag" value={t} />
          ))}
          <input
            name="tag"
            autoFocus
            maxLength={MAX_TAG_LENGTH}
            placeholder="beach"
            aria-label="New tag"
            onKeyDown={(e) => {
              if (e.key === "Escape") setAdding(false);
            }}
            onBlur={(e) => {
              if (!e.currentTarget.value.trim()) setAdding(false);
            }}
            className="w-32 rounded-full border border-pen bg-sheet px-3 py-0.5 font-mono text-xs text-ink outline-2 outline-pen-soft"
          />
        </form>
      ) : tags.length < MAX_TAGS ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-rule-strong px-2.5 py-0.5 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          <PlusIcon />
          {tags.length > 0 ? "Tag" : "Add a tag"}
        </button>
      ) : null}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" aria-hidden="true">
      <path d="M7 2.8v8.4M2.8 7h8.4" />
    </svg>
  );
}
