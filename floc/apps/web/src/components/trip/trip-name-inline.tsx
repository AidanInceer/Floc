"use client";

/**
 * The trip's name, editable in place (ticket 37). It used to render in the
 * persistent header above the tabs *and* read-only on the Overview hero, which
 * printed the same name and dates twice a hand's width apart; ticket 89 kept
 * one — this, on the hero, where it is now the headline. Renaming is still one
 * click on the name itself rather than three into a settings disclosure.
 *
 * The name reads as a plain heading until you reach for Rename, so the hero
 * doesn't turn into a form.
 *
 * Still open to any member, not just an admin — see `renameTrip`.
 */
import { useActionState, useEffect, useRef, useState } from "react";

import { Button, ErrorText, Input } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";

type RenameState = { error?: string; saved?: number };

export function TripNameInline({
  tripId,
  name,
  rename,
}: {
  tripId: number;
  name: string;
  /** A real Server Action reference, so it survives the server→client boundary. */
  rename: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const [editing, setEditing] = useState(false);

  // `saved` is a counter, not a boolean: two renames in a row would otherwise
  // leave the flag already true and the second edit would never close itself.
  const [state, formAction] = useActionState(
    async (previous: RenameState, formData: FormData): Promise<RenameState> => {
      const result = await rename(formData);
      return result?.error
        ? { error: result.error }
        : { saved: (previous.saved ?? 0) + 1 };
    },
    {},
  );

  const saved = state.saved ?? 0;
  const seen = useRef(saved);
  useEffect(() => {
    if (saved !== seen.current) {
      seen.current = saved;
      setEditing(false);
    }
  }, [saved]);

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {name}
        </h1>
        {/* Icon-only (ticket 213): the pencil carries a bordered box at rest so
            it still reads as a control on a hero of plain text. */}
        <Button
          type="button"
          variant="secondary"
          title="Rename trip"
          aria-label="Rename trip"
          onClick={() => setEditing(true)}
          className="!px-2 !py-1"
        >
          <PencilIcon />
        </Button>
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      {/* The visible heading is the input while editing, so the page keeps an
          <h1> for anything reading the outline. */}
      <h1 className="sr-only">{name}</h1>
      <span className="flex items-center gap-1.5">
        <input type="hidden" name="tripId" value={tripId} />
        <Input
          name="name"
          defaultValue={name}
          maxLength={120}
          required
          autoFocus
          aria-label="Trip name"
          className="w-48 !py-1 text-sm"
          // Escape backs out without saving — the same key that dismisses the
          // page's sheets and confirm dialogs.
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <SubmitButton variant="secondary" pendingLabel="Saving…">
          Save
        </SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </span>
      {state.error ? <ErrorText>{state.error}</ErrorText> : null}
    </form>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="M14.5 5.5 18.5 9.5" />
    </svg>
  );
}
