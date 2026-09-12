"use client";

/**
 * Link a file already on the trip onto this event (ticket 322). A select, not
 * a search: an event's candidates are the trip's loose files, which is a short
 * list by the time anyone opens this.
 */
import { attachToEvent } from "@/app/trip/[id]/files/actions";
import { ActionForm, Sheet, SubmitButton } from "@/components/system/client-ui";
import { Select } from "@/components/system/ui";

/** Structural, so the client bundle never pulls the server's document type. */
export type FileChoice = { id: number; name: string };

export function AttachExistingFile({
  tripId,
  dayEventId,
  choices,
}: {
  tripId: number;
  dayEventId: number;
  choices: FileChoice[];
}) {
  return (
    <Sheet
      trigger="Link a file"
      title="Link a file already on the trip"
      triggerVariant="ghost"
    >
      <ActionForm action={attachToEvent.bind(null, tripId, dayEventId)}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-0 flex-1">
            <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft">
              Which file
            </span>
            <Select name="documentId" defaultValue={String(choices[0]?.id ?? "")}>
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <SubmitButton pendingLabel="Linking…">Link it</SubmitButton>
        </div>
      </ActionForm>
    </Sheet>
  );
}
