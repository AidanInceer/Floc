"use client";

/**
 * The upload control (ticket 239) — a sheet holding a file picker and the one
 * decision that matters: shared with the trip, or yours alone. It defaults to
 * whichever list you were looking at when you pressed it.
 *
 * The native `<input type="file">` is hidden rather than styled: it renders as
 * "Choose file · No file chosen" and then keeps that label after a pick, which
 * reads as if nothing happened. The zone below is the control, and it says what
 * you actually chose.
 */
import { useRef, useState } from "react";

import { uploadDocument } from "@/app/trip/[id]/files/actions";
import { ActionForm, Sheet, SubmitButton } from "@/components/client-ui";
import {
  SegmentedField,
  segmentOff,
  segmentOn,
  segmentShape,
} from "@/components/packing-card";
import { Select, Stack, cx } from "@/components/ui";
import {
  DOCUMENT_ACCEPT,
  DOC_CATEGORIES,
  DOC_CATEGORY_LABELS,
  formatBytes,
  kindLabel,
} from "@/lib/documents";

export function DocumentUpload({
  tripId,
  scope,
  className,
}: {
  tripId: number;
  scope: "shared" | "private";
  className?: string;
}) {
  return (
    <Sheet trigger="Upload" title="Add a file" triggerClassName={className}>
      <ActionForm action={uploadDocument.bind(null, tripId)}>
        <Stack gap={4}>
          <FilePicker />
          <ScopeChoice initial={scope} />
          <CategoryChoice />
          <div>
            <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
          </div>
        </Stack>
      </ActionForm>
    </Sheet>
  );
}

function FilePicker() {
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [over, setOver] = useState(false);

  // Dropping has to hand the file back to the input: the form posts the input's
  // own FileList, not our state. A drag carrying no file — text, a link — is a
  // length-0 FileList, which is truthy, so testing the object would clear a
  // file you had already chosen. One file only: the input is not `multiple`,
  // and the extras would ride in the body and count against Next's limit
  // without ever being uploaded.
  const accept = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !input.current) return;
    const one = new DataTransfer();
    one.items.add(file);
    input.current.files = one.files;
    setPicked(file);
  };

  return (
    <div>
      {/* No `required`: the control is hidden, so the browser would block the
          submit and anchor its validation bubble to a 1px box — the button
          just reads as dead. `uploadDocument` answers "Pick a file first". */}
      <input
        ref={input}
        type="file"
        name="file"
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files);
        }}
        className={cx(
          "flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors",
          over ? "border-pen bg-pen-soft" : "border-rule-strong hover:bg-sheet-2",
        )}
      >
        {picked ? (
          <>
            <span className="shrink-0 rounded-full bg-sheet-3 px-2 py-0.5 text-xs font-semibold">
              {kindLabel(picked.type)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {picked.name}
              </span>
              <span className="nums block text-xs text-ink-soft">
                {formatBytes(picked.size)}
              </span>
            </span>
            <span className="shrink-0 text-sm text-pen">Change</span>
          </>
        ) : (
          <span className="flex-1">
            <span className="block text-sm font-semibold text-pen">
              Choose a file
            </span>
            <span className="block text-xs text-ink-soft">
              PDF or image, up to 10 MB
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Two mutually exclusive answers, so radios — but wearing the segmented shape
 * the rest of the app uses for a two-way choice, rather than bare dots.
 */
function ScopeChoice({ initial }: { initial: "shared" | "private" }) {
  const [scope, setScope] = useState(initial);

  return (
    <fieldset>
      <legend className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">
        Who can see it
      </legend>
      <SegmentedField>
        {(
          [
            ["shared", "Everyone"],
            ["private", "Just you"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className={cx(segmentShape, "cursor-pointer", scope === value ? segmentOn : segmentOff)}>
            <input
              type="radio"
              name="scope"
              value={value}
              checked={scope === value}
              onChange={() => setScope(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </SegmentedField>
    </fieldset>
  );
}

/** Five buckets, so a select — segments would wrap on a phone. Re-filed later from the row. */
function CategoryChoice() {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">
        File under
      </span>
      <Select name="category" defaultValue="other">
        {DOC_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {DOC_CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
    </label>
  );
}
