"use client";

// Trip tags, one row each: name, delete (ticket 71). Colour is no longer
// per-tag — the whole trip wears one chosen pastel (ticket 213), so a row is
// just a name. Form posts one `tag` field per row; parseTagNames normalises.
// Client-side because rows come and go; save is still the page's server action.
import { useState } from "react";

import { Button } from "@/components/system/ui";
import { MAX_TAGS, MAX_TAG_LENGTH } from "@floc/core/tags";

type Row = { id: number; name: string };

export function TagEditor({ tags }: { tags: string[] }) {
  // Opens on one empty row, not nothing — avoids a panel whose only control
  // is "Add a tag".
  const [rows, setRows] = useState<Row[]>(() =>
    tags.length > 0
      ? tags.map((name, id) => ({ id, name }))
      : [{ id: 0, name: "" }],
  );
  // Ids must outlive a delete, or React reuses the deleted row's input.
  const [nextId, setNextId] = useState(Math.max(tags.length, 1));

  const update = (id: number, name: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, name } : r)));

  const addRow = () => {
    setRows((rs) => [...rs, { id: nextId, name: "" }]);
    setNextId((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2"
        >
          <input
            name="tag"
            value={row.name}
            maxLength={MAX_TAG_LENGTH}
            placeholder="beach"
            aria-label="Tag"
            onChange={(e) => update(row.id, e.target.value)}
            className="w-full rounded-md border border-rule px-2.5 py-1.5 font-mono text-sm focus-visible:border-pen"
          />
          <button
            type="button"
            aria-label={`Delete ${row.name || "this tag"}`}
            title="Delete"
            onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
            className="rounded-md border border-rule py-1.5 text-sm text-ink-soft hover:border-red hover:text-red"
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
