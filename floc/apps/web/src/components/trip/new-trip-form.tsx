"use client";

import { useState } from "react";
import { TEXT_CAPS } from "@floc/core/text/text";

import { FriendPicker } from "@/components/social/friend-picker";
import { SubmitButton } from "@/components/system/client-ui";
import { Field, Input, SheetFooter } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

function askedNote(n: number) {
  if (n === 0) return "Friends can join later";
  return `${n} friend${n === 1 ? "" : "s"} asked along`;
}

/** The "Start a trip" sheet as a split: the name on the left, friends beside it; stacked on a phone. */
export function NewTripForm({
  action,
  friends,
  name = "",
}: {
  action: (formData: FormData) => Promise<void>;
  friends: Person[];
  name?: string;
}) {
  const [asked, setAsked] = useState(0);

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      action={action}
      onChange={(e) =>
        setAsked(e.currentTarget.querySelectorAll('input[name="friendIds"]:checked').length)
      }
    >
      <div className="scroll-thin grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-[minmax(0,1fr)_15rem] sm:grid-rows-[minmax(0,1fr)] sm:overflow-hidden">
        <div className="p-6">
          <h3 className="mb-5 max-w-[13ch] font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.035em]">
            Name your trip
          </h3>
          <Field label="Name">
            <Input name="name" required maxLength={TEXT_CAPS.tripName} defaultValue={name} />
          </Field>
          {/* No date fields — rule 9: undated is the normal path. */}
          <p className="mt-3 text-xs text-ink-soft">Dates can wait until the group decides.</p>
        </div>
        <div className="scroll-thin border-t border-rule bg-sheet-2 p-6 sm:overflow-y-auto sm:border-l sm:border-t-0">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-[0.95rem] font-semibold">Ask your friends along</h3>
            <span className="text-xs text-ink-soft">Optional</span>
          </div>
          <FriendPicker
            friends={friends}
            emptyNote="No friends yet — share the trip link once it exists."
            unbounded
          />
        </div>
      </div>
      <SheetFooter note={askedNote(asked)}>
        <SubmitButton pendingLabel="Creating…">Create trip</SubmitButton>
      </SheetFooter>
    </form>
  );
}
