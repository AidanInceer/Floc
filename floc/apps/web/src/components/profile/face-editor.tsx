"use client";

/**
 * Why: edited in the card so it previews the draft name (C3b). The face is always initials.
 * No colour choice: `whoTone` is how you follow one member across Money, Packing and the itinerary.
 */
import { useEffect, useRef, useState } from "react";

import { updateFace } from "@/app/profile/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { PencilIcon } from "@/components/system/icons";
import { Avatar, Button, ErrorText, Field, Input, cx } from "@/components/system/ui";

export function FaceEditor({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraftName(name);
    setError(null);
    setOpen(true);
  };
  const cancel = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    fieldRef.current?.select();
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const save = async (formData: FormData) => {
    const result = await updateFace(formData);
    if (result.error) setError(result.error);
    else setOpen(false);
  };

  const shownName = open ? draftName.trim() || name : name;

  return (
    <div ref={wrapRef} className={cx("relative min-w-0", open && "z-[1200]")}>
      <button
        type="button"
        onClick={() => (open ? cancel() : start())}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Change your name, ${name}`}
        className="-m-1.5 flex min-w-0 items-center gap-4 rounded-sm p-1.5 text-left transition-colors hover:bg-pen-soft"
      >
        <span className="relative shrink-0">
          <Avatar name={shownName} size={64} />
          <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-[22px] items-center justify-center rounded-sm border border-rule-strong bg-sheet text-ink-soft">
            <PencilIcon size={11} />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block font-display text-2xl font-semibold break-words text-ink">{shownName}</span>
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Your name"
          className="fixed inset-x-0 bottom-0 rounded-t-md border border-rule bg-sheet p-4 shadow-lift sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-3 sm:w-[356px] sm:rounded-md"
        >
          <form action={save} className="flex flex-col gap-3.5">
            <Field label="Name">
              <Input
                ref={fieldRef}
                name="displayName"
                value={draftName}
                onChange={(e) => {
                  setDraftName(e.target.value);
                  setError(null);
                }}
                autoComplete="name"
                maxLength={80}
                className="text-base"
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cancel}>
                Cancel
              </Button>
              <SubmitButton variant="primary" pendingLabel="Saving…">
                Save
              </SubmitButton>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
