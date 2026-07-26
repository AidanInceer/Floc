/**
 * A discussion thread — one component for every surface that has one (ideas
 * today, day events too). Server component; the composer is an `ActionForm` so
 * an empty submission comes back as readable text rather than a thrown error.
 *
 * Oldest-first, deliberately: a thread is an argument you follow from the
 * start, not a feed. Kept inside a `<details>` by default, because a board of
 * twenty ideas with every thread expanded is unreadable — the summary carries
 * the count so you can see where the conversation actually is.
 */
import type { NoteScope } from "@/db/schema";
import { Avatar, Textarea } from "@/components/ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { addNote, deleteNote } from "@/app/trip/[id]/notes-actions";

export type NoteRow = {
  id: number;
  body: string;
  createdAt: Date;
  createdBy: string;
  authorName: string;
  authorAvatar: string | null;
  /** The author's trip avatar colour — see `TripMember.tone`. */
  authorTone?: string;
};

export function NoteThread({
  tripId,
  scope,
  scopeId,
  notes,
  viewerId,
  isAdmin,
  open,
  placeholder = "Add a note…",
}: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  notes: NoteRow[];
  viewerId: string;
  isAdmin: boolean;
  /** Render expanded, with no disclosure — for a surface you already clicked into. */
  open?: boolean;
  placeholder?: string;
}) {
  const body = (
    <div className="mt-2 flex flex-col gap-2.5">
      {notes.map((n) => (
        <div key={n.id} className="flex items-start gap-2">
          <Avatar
            name={n.authorName}
            src={n.authorAvatar}
            size={22}
            tone={n.authorTone}
          />
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-sm">{n.body}</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {n.authorName} ·{" "}
              {n.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
          {isAdmin || n.createdBy === viewerId ? (
            <form action={deleteNote.bind(null, tripId, n.id)}>
              <ConfirmSubmit message="Delete this note?" variant="ghost">
                ×
              </ConfirmSubmit>
            </form>
          ) : null}
        </div>
      ))}

      <ActionForm action={addNote.bind(null, tripId, scope, scopeId)}>
        <Textarea
          name="body"
          rows={2}
          maxLength={2000}
          placeholder={placeholder}
          className="min-h-0 text-sm"
        />
        <div className="mt-2">
          <SubmitButton variant="secondary" pendingLabel="Posting…">
            Add note
          </SubmitButton>
        </div>
      </ActionForm>
    </div>
  );

  if (open) return body;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-ink-faint hover:text-ink-soft">
        {notes.length === 0
          ? "Add a note"
          : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
      </summary>
      {body}
    </details>
  );
}
