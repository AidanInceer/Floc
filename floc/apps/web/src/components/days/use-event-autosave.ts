"use client";

import { useCallback, useEffect, useRef, type ChangeEvent } from "react";

import { useEventDraft } from "@/components/days/event-draft";
import { draftOfField, type EventDraft } from "@/lib/days/event-drafts";

export function useEventAutosave({
  autosave,
  eventId,
  action,
}: {
  autosave: boolean;
  eventId: number | undefined;
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const draft = useEventDraft(autosave ? eventId : undefined);
  const { drop, saving } = draft;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (dirty.current) drop();
  }, [drop]);

  const save = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const form = formRef.current;
    const name = form?.elements.namedItem("title") as HTMLInputElement | null;
    if (!form || !dirty.current || !name?.value.trim()) return;
    dirty.current = false;
    form.requestSubmit();
  }, []);

  const saveSoon = useCallback(() => {
    if (!autosave) return;
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  }, [autosave, save]);

  const changed = useCallback(
    (change: EventDraft) => {
      draft.change(change);
      saveSoon();
    },
    [draft, saveSoon],
  );

  const onFieldChange = useCallback(
    (event: ChangeEvent<HTMLFormElement>) => {
      const field = event.target;
      const change =
        field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? draftOfField(field.name, field.value) : null;
      if (change) draft.change(change);
      saveSoon();
    },
    [draft, saveSoon],
  );

  const submit = useCallback(
    async (formData: FormData) => {
      const landed = saving();
      try {
        await action(formData);
      } finally {
        landed();
      }
    },
    [action, saving],
  );

  return {
    formRef,
    changed,
    formProps: autosave
      ? { action: submit, onChange: onFieldChange, onBlur: save }
      : { action },
  };
}
