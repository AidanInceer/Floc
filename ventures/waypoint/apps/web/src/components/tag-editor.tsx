"use client";

// Trip tags, one row each: name, colour, delete (ticket 86). Form posts a
// tag/tone pair per row; parseTagRows normalises. Client-side because rows
// come and go; save is still the page's server action.
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
  // Opens on one empty row, not nothing — avoids a panel whose only control
  // is "Add a tag".
  const [rows, setRows] = useState<Row[]>(() =>
    tags.length > 0
      ? tags.map((name, id) => ({ id, name, tone: tones[name] ?? DEFAULT_TAG_TONE }))
      : [{ id: 0, name: "", tone: DEFAULT_TAG_TONE }],
  );
  // Ids must outlive a delete, or React reuses the deleted row's input.
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
        // Grid not flex: Select carries w-full from fieldBase, fighting flex-basis.
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
          {/* type="button" — a bare <button> in a form defaults to submit. */}
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

const TAG_SWATCH: Record<TagTone, string> = {
  open: "bg-highlight-soft text-highlight-ink",
  agreed: "bg-green-soft text-green",
  marine: "bg-pen-soft text-pen",
  action: "bg-red-soft text-red",
  neutral: "bg-sheet text-ink",
};
