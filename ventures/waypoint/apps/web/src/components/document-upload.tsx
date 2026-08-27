"use client";

/**
 * The upload control (ticket 239) — a sheet holding a file picker and the one
 * decision that matters: shared with the trip, or yours alone. It defaults to
 * whichever list you were looking at when you pressed it.
 */
import { uploadDocument } from "@/app/trip/[id]/files/actions";
import { ActionForm, Sheet, SubmitButton } from "@/components/client-ui";
import { Field, Input, Stack } from "@/components/ui";
import { DOCUMENT_ACCEPT } from "@/lib/documents";

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
        <Stack gap={3}>
          <Field label="File">
            <Input
              type="file"
              name="file"
              accept={DOCUMENT_ACCEPT}
              required
              className="!py-2"
            />
          </Field>
          <Field label="Who can see it">
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="shared"
                  defaultChecked={scope === "shared"}
                />
                Everyone on the trip
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="private"
                  defaultChecked={scope === "private"}
                />
                Just you
              </label>
            </div>
          </Field>
          <p className="text-xs text-ink-faint">PDFs and images, up to 10 MB.</p>
          <div>
            <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
          </div>
        </Stack>
      </ActionForm>
    </Sheet>
  );
}
