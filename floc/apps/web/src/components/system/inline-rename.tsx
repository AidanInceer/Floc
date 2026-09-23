"use client";

import { useRef, useState, useTransition } from "react";

import { ErrorText, cx } from "@/components/system/ui";

/**
 * A name that becomes its own input when pressed (#362). Enter or
 * leaving the box saves; Escape backs out. A refused name keeps the box open
 * with the server's reason under it.
 */
export function InlineRename({
  value,
  label,
  maxLength,
  save,
  className,
}: {
  value: string;
  /** Names the control for a screen reader, e.g. "Rename Sun cream". */
  label: string;
  maxLength: number;
  save: (next: string) => Promise<{ error?: string }>;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const close = () => {
    setEditing(false);
    setError(undefined);
  };

  // Enter saves, then the box loses focus and would save again: a ref, because
  // the blur lands before `pending` re-renders.
  const saving = useRef(false);
  const commit = (next: string) => {
    if (saving.current) return;
    if (next.trim() === value) return close();
    saving.current = true;
    start(async () => {
      const result = await save(next);
      saving.current = false;
      if (result.error) setError(result.error);
      else close();
    });
  };

  if (!editing) {
    return (
      <button
        type="button"
        aria-label={label}
        title="Rename"
        onClick={() => setEditing(true)}
        className={cx(
          "min-w-0 cursor-text truncate rounded-sm text-left leading-normal decoration-rule decoration-dotted underline-offset-4 hover:underline",
          className,
        )}
      >
        {value}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <input
        name="name"
        defaultValue={value}
        maxLength={maxLength}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        readOnly={pending}
        ref={(el) => el?.focus()}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          if (e.key === "Enter") {
            e.preventDefault();
            commit(e.currentTarget.value);
          }
        }}
        className="w-full min-w-0 rounded-sm border border-pen bg-sheet px-2 py-0.5 text-sm"
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  );
}
