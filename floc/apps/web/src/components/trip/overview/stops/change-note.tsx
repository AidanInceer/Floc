import { commentTime } from "@floc/core/notes/notes";
import Link from "next/link";

import { openNotification } from "@/app/inbox/actions";
import { ChangeWords } from "@/components/notifications/change-words";
import { ChevronIcon } from "@/components/system/icons";
import { ButtonLink, cx, iconFrameClass, pressArea } from "@/components/system/ui";
import type { PlanNote } from "@/server/notifications/plan-note";
import { BringIntoView } from "./bring-into-view";

const VERBS = { event_added: "added", event_moved: "moved", event_removed: "removed" } as const;

function Step({ id, label, direction }: { id: number | null; label: string; direction: "left" | "right" }) {
  const glyph = <ChevronIcon direction={direction} size={14} />;
  if (id === null) {
    return (
      <button type="button" disabled aria-label={label} className={iconFrameClass()}>
        {glyph}
      </button>
    );
  }
  return (
    <form action={openNotification}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" aria-label={label} className={iconFrameClass()}>
        {glyph}
      </button>
    </form>
  );
}

export function ChangeNote({ tripId, note, onRow }: { tripId: number; note: PlanNote; onRow: boolean }) {
  const removed = note.kind === "event_removed";
  const named = removed || !onRow;
  return (
    <div
      id="change-note"
      role="status"
      className="my-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-rule-strong bg-sheet py-1.5 pl-3 pr-1.5 text-sm text-ink-soft shadow-raised"
    >
      <BringIntoView watch={note.id} />
      <div className="min-w-0 flex-[1_1_14rem]">
        <p>
          <b className="font-semibold text-ink">{note.actor}</b> {VERBS[note.kind]}{" "}
          {removed ? <s>{note.change.title}</s> : named ? note.change.title : "this"}{" "}
          <span className="nums">{commentTime(note.at)}</span>
        </p>
        {named ? <ChangeWords words={note.words} /> : null}
      </div>
      <div className="flex items-center gap-1.5 max-sm:w-full">
        <Link href="/inbox" className={cx(pressArea, "inline-flex h-[31px] items-center gap-1 pr-1.5 text-ink-soft transition-colors hover:text-pen max-sm:mr-auto")}>
          <ChevronIcon direction="left" size={14} />
          Inbox
        </Link>
        <span className="nums mr-1 text-xs">
          {note.index + 1} of {note.total}
        </span>
        <Step id={note.prevId} label="Previous change" direction="left" />
        {note.nextId === null ? (
          <ButtonLink href={`/trip/${tripId}/overview`} scroll={false}>
            Done
          </ButtonLink>
        ) : (
          <Step id={note.nextId} label="Next change" direction="right" />
        )}
      </div>
    </div>
  );
}
