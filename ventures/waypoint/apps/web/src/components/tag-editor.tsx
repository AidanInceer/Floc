"use client";

/**
 * The trip's tags, one row each: the name you type, the colour beside it, and
 * a delete on the end (ticket 86). It replaced a comma-separated line plus a
 * separate list of colour pickers — that made you count commas to work out
 * which pill you were recolouring, and there was nowhere to delete a single
 * tag.
 *
 * Rows are the whole model: the form posts a `tag`/`tone` pair per row
 * and `parseTagRows` normalises the lot, so renaming a tag keeps its colour and
 * removing a row removes the tag. Client-side because rows come and go; the
 * save is still the page's server action.
 */
import { useState } from "react";

import { Button, Select, cx } from "@/components/ui";
import {
  DEFAULT_TAG_TONE,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  TAG_TONES,
  type TagTone,
} from "@/lib/tags";

type Row = { id: number; name: string; tone: TagTone };

export function TagEditor({
  tags,
  tones,
}: {
  tags: string[];
  tones: Record<string, TagTone>;
}) {
  // A trip with no tags opens on one empty row, not on nothing: "Add tags"
  // that hands you a panel whose only control is *Add a tag* is the same click
  // twice.
  const [rows, setRows] = useState<Row[]>(() =>
    tags.length > 0
      ? tags.map((name, id) => ({ id, name, tone: tones[name] ?? DEFAULT_TAG_TONE }))
      : [{ id: 0, name: "", tone: DEFAULT_TAG_TONE }],
  );
  // Row keys have to outlive a delete — reusing the index would make React
  // reuse the deleted row's input for the one below it.
  const [nextId, setNextId] = useState(Math.max(tags.length, 1));

  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => {
    setRows((rs) => [...rs, { id: nextId, name: "", tone: DEFAULT_TAG_TONE }]);
    setNextId((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        // A grid, not a flex row: `Select` carries `w-full` from `fieldBase`,
        // which fights any flex-basis the row tries to give it.
        <div
          key={row.id}
          className="grid grid-cols-[minmax(0,1fr)_7rem_2rem] items-center gap-2"
        >
          <input
            name="tag"
            value={row.name}
            maxLength={MAX_TAG_LENGTH}
            placeholder="beach"
            aria-label="Tag"
            onChange={(e) => update(row.id, { name: e.target.value })}
            className={cx(
              "w-full rounded-md border border-rule-strong px-2.5 py-1.5 font-mono text-sm",
              "focus:border-pen focus:outline-none",
              // The field wears the colour it's picked, so the choice is
              // legible without a preview pill duplicating the row.
              TAG_SWATCH[row.tone],
            )}
          />
          <Select
            name="tone"
            value={row.tone}
            aria-label={`Colour for ${row.name || "this tag"}`}
            onChange={(e) => update(row.id, { tone: e.target.value as TagTone })}
          >
            {Object.entries(TAG_TONES).map(([tone, label]) => (
              <option key={tone} value={tone}>
                {label}
              </option>
            ))}
          </Select>
          <button
            type="button"
            aria-label={`Delete ${row.name || "this tag"}`}
            title="Delete"
            onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
            className="rounded-md border border-rule-strong py-1.5 text-sm text-ink-soft hover:border-red hover:text-red"
          >
            ×
          </button>
        </div>
      ))}

      {rows.length < MAX_TAGS ? (
        <div>
          {/* type="button" or it submits the form it sits in — a bare
              <button> inside a form defaults to submit. */}
          <Button type="button" variant="secondary" onClick={addRow}>
            Add a tag
          </Button>
        </div>
      ) : (
        <p className="text-xs text-ink-faint">
          {MAX_TAGS} tags is the limit — delete one to add another.
        </p>
      )}
    </div>
  );
}

/** The `Badge` tone washes, on a form field rather than a pill. */
const TAG_SWATCH: Record<TagTone, string> = {
  open: "bg-highlight-soft text-highlight-ink",
  agreed: "bg-green-soft text-green",
  marine: "bg-pen-soft text-pen",
  action: "bg-red-soft text-red",
  neutral: "bg-sheet text-ink",
};
