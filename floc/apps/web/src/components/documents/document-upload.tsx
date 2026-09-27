"use client";

/**
 * The upload control (ticket 239) — a sheet holding a file picker and the two
 * decisions that go with it: who sees it, and what it files under. File first,
 * then both choices side by side in one row, the verb in the footer bar.
 *
 * The native `<input type="file">` is hidden rather than styled: it renders as
 * "Choose file · No file chosen" and keeps that label after a pick, which reads
 * as if nothing happened. The zone below is the control, and it says what you
 * actually chose.
 */
import { useRef, useState, type ReactNode } from "react";

import { uploadDocument } from "@/app/trip/[id]/files/actions";
import { ActionForm, Sheet, SubmitButton } from "@/components/system/client-ui";
import {
  SegmentedField,
  segmentOff,
  segmentOn,
  segmentShape,
} from "@/components/packing/packing-card";
import { Select, SheetFooter, cx } from "@/components/system/ui";
import {
  DOCUMENT_ACCEPT,
  DOC_CATEGORIES,
  DOC_CATEGORY_LABELS,
  formatBytes,
  kindLabel,
  type DocCategory,
} from "@floc/core/documents/documents";

export function DocumentUpload({
  tripId,
  scope,
  className,
  dayEventId,
  dayId,
  category = "other",
  trigger = "Upload",
  title,
  bareTrigger,
}: {
  tripId: number;
  scope: "shared" | "private";
  className?: string;
  /** Lands the file straight on this event (ticket 322). */
  dayEventId?: number;
  /** Lands the file on this day — a stop's stay, from Overview. */
  dayId?: number;
  category?: DocCategory;
  trigger?: ReactNode;
  title?: string;
  bareTrigger?: boolean;
}) {
  return (
    <Sheet
      trigger={trigger}
      title={title ?? (dayEventId ? "Add a file to this event" : "Add a file")}
      triggerClassName={className}
      bareTrigger={bareTrigger}
      body="flush"
    >
      <ActionForm action={uploadDocument.bind(null, tripId)}>
        {dayEventId ? <input type="hidden" name="dayEventId" value={dayEventId} /> : null}
        {dayId ? <input type="hidden" name="dayId" value={dayId} /> : null}
        <div className="p-5">
          <FilePicker />
          <div className="mt-5 grid gap-4 min-[480px]:grid-cols-2 min-[480px]:items-end">
            <ScopeChoice initial={scope} />
            <CategoryChoice initial={category} />
          </div>
        </div>
        <SheetFooter>
          <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
        </SheetFooter>
      </ActionForm>
    </Sheet>
  );
}

const LABEL = "block font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft";

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
      {/* Out of the tab order: `sr-only` hides it but keeps it focusable, so
          the keyboard gained a stop with no name and no visible ring. The
          button below is the control, and `click()` still reaches this. */}
      <input
        ref={input}
        type="file"
        name="file"
        accept={DOCUMENT_ACCEPT}
        tabIndex={-1}
        aria-hidden
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
          "flex min-h-[8.5rem] w-full flex-col items-center justify-center gap-1 rounded-xl border p-4 text-center",
          "transition-[background-color,border-color,transform] duration-[.22s] ease-[cubic-bezier(.2,.85,.3,1)]",
          // Pressing it opens the OS picker, which takes a moment — without a
          // pressed state the click reads as having missed.
          "active:scale-[0.995] active:bg-pen-soft",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen",
          // One ternary, not a dashed base with a solid override: two utilities
          // from the same group are decided by stylesheet order, not class-list
          // order, so the override would not reliably win (see `menuItemClass`).
          // Dashed means empty, and the border is the only part of the zone
          // that says so at a glance.
          over || picked
            ? "border-solid border-pen bg-pen-soft"
            : "border-dashed border-rule-strong hover:border-pen hover:bg-sheet-2",
        )}
      >
        <svg
          viewBox="0 0 14 14"
          width={18}
          height={18}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          aria-hidden
          className="mb-1 text-pen"
        >
          <path d="M7 3v8M3 7h8" />
        </svg>
        <span className="max-w-full break-words text-sm font-medium text-pen">
          {picked ? picked.name : over ? "Drop it here" : "Choose a file"}
        </span>
        <span className="nums text-xs text-ink-soft">
          {picked
            ? `${kindLabel(picked.type)} · ${formatBytes(picked.size)} · Change`
            : "PDF or image · up to 8 MB"}
        </span>
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
    <fieldset className="min-w-0">
      <legend className={cx(LABEL, "mb-1.5")}>Who can see it</legend>
      <SegmentedField>
        {(
          [
            ["shared", "Everyone"],
            ["private", "Just you"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={cx(
              segmentShape,
              "flex-1 cursor-pointer py-1.5 text-center",
              scope === value ? segmentOn : segmentOff,
            )}
          >
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
function CategoryChoice({ initial }: { initial: DocCategory }) {
  return (
    <label className="block">
      <span className={cx(LABEL, "mb-1.5")}>File under</span>
      <Select name="category" defaultValue={initial}>
        {DOC_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {DOC_CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
    </label>
  );
}
