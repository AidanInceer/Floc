"use client";

import { TEXT_CAPS } from "@floc/core/text/text";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button, ErrorText, Input } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";
import { PencilIcon } from "@/components/system/icons";

type RenameState = { error?: string; saved?: number };

export function TripNameInline({
  tripId,
  name,
  rename,
}: {
  tripId: number;
  name: string;
  rename: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const [editing, setEditing] = useState(false);

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
      <h1 className="min-w-0 font-display text-3xl font-semibold leading-[1.05] tracking-tight [overflow-wrap:anywhere]">
        <button
          type="button"
          title="Rename trip"
          onClick={() => setEditing(true)}
          className="group/name max-w-full rounded-sm text-left transition-colors hover:bg-sheet-2 hover:shadow-[0_0_0_4px_var(--sheet-2)]"
        >
          {name}
          <span className="ml-2 inline-grid align-middle text-ink-faint opacity-50 transition-opacity group-hover/name:opacity-100">
            <PencilIcon />
          </span>
          <span className="sr-only">Rename trip</span>
        </button>
      </h1>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-1.5">
      <h1 className="sr-only">{name}</h1>
      <span className="flex flex-wrap items-center gap-1.5">
        <input type="hidden" name="tripId" value={tripId} />
        <Input
          name="name"
          defaultValue={name}
          maxLength={TEXT_CAPS.tripName}
          required
          autoFocus
          aria-label="Trip name"
          className="w-full min-w-0 !py-1 font-display !text-lg"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <SubmitButton variant="secondary">
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
