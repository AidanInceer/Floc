"use client";

import { useActionState, useEffect, useRef } from "react";

import { TEXT_CAPS } from "@floc/core/text/text";
import { Button, ErrorText, Field, Input, Stack } from "@/components/system/ui";
import { SubmitButton, useSheetClose } from "@/components/system/client-ui";

type RenameState = { error?: string; saved?: boolean };

/** The inside of the Files page's rename sheet (#364). Only the label changes; the file does not. */
export function DocumentRenameForm({
  name,
  rename,
}: {
  name: string;
  /** `renameDocument`, bound to the trip and the file. */
  rename: (next: string) => Promise<{ error?: string }>;
}) {
  const sheetClose = useSheetClose();
  const [state, formAction] = useActionState(
    async (_previous: RenameState, formData: FormData): Promise<RenameState> => {
      const result = await rename(String(formData.get("name") ?? ""));
      return result.error ? { error: result.error } : { saved: true };
    },
    {},
  );
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.saved) sheetClose?.();
  }, [state, sheetClose]);

  return (
    <form action={formAction}>
      <Stack gap={4}>
        <Field label="Name">
          <Input name="name" defaultValue={name} maxLength={TEXT_CAPS.documentName} required autoFocus />
        </Field>
        <ErrorText>{state.error}</ErrorText>
        <div className="flex justify-end gap-2">
          {sheetClose ? (
            <Button type="button" variant="ghost" onClick={sheetClose}>
              Cancel
            </Button>
          ) : null}
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        </div>
      </Stack>
    </form>
  );
}
