"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button, Card, ErrorText, cx } from "./ui";

/**
 * A plain `<form action={…}>` requires an action returning void, which would
 * mean throwing away the readable error our actions return. This wraps
 * `useActionState` so a server action can hand back `{ error }` and have it
 * rendered under the form.
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(
    async (_previous: { error?: string }, formData: FormData) =>
      (await action(formData)) ?? {},
    {},
  );

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error ? (
        <div className="mt-2">
          <ErrorText>{state.error}</ErrorText>
        </div>
      ) : null}
    </form>
  );
}

/** Disables itself while its parent server action is in flight. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className={className}
    >
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}

/**
 * A native <dialog> sheet: bottom sheet on mobile, centred panel on desktop,
 * per ticket 05's "same shape both sizes, only the chrome differs".
 */
export function Sheet({
  trigger,
  title,
  children,
  triggerVariant = "primary",
  triggerClassName,
}: {
  trigger: ReactNode;
  title: string;
  /**
   * Plain nodes only — never a render prop. A function child cannot cross the
   * server/client boundary, and every caller here is a Server Component. The
   * sheet closes itself when a form inside it submits instead.
   */
  children: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  /** Override the trigger's own styling — a sticky note has no room for a
      full-size uppercase button. */
  triggerClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const labelId = useId();

  const close = () => {
    ref.current?.close();
    setOpen(false);
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  return (
    <>
      <Button
        variant={triggerVariant}
        className={triggerClassName}
        onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }}
      >
        {trigger}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={labelId}
        className="m-0 max-h-[90dvh] w-full max-w-lg overflow-y-auto bg-transparent p-0 backdrop:bg-black/40 sm:m-auto"
        style={{ marginTop: "auto" }}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <Card className="rounded-b-none bg-sheet sm:rounded-sm">
          <div className="flex items-center justify-between border-b border-dotted border-rule-strong px-4 py-3">
            <h2 id={labelId} className="font-display text-base font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-sm px-2 text-lg leading-none text-ink-faint hover:text-ink"
            >
              ×
            </button>
          </div>
          {/* Submitting anything inside dismisses the sheet — the server action
              revalidates the page underneath it. */}
          <div className="p-4" onSubmit={() => setTimeout(close, 0)}>
            {open ? children : null}
          </div>
        </Card>
      </dialog>
    </>
  );
}

/**
 * A form button that asks first — used for kick, delete, archive.
 *
 * Asks through a native `<dialog>`, not `window.confirm`. The confirm() version
 * silently ate deletes: a browser that suppresses page dialogs (Chrome offers
 * exactly that after a couple of them, and embedded/automated views default to
 * it) returns false, which this treated as "the user said no" — the button then
 * looked dead with nothing in the console to explain it. A dialog we render
 * ourselves can't be suppressed, and it reads in the app's own voice.
 */
export function ConfirmSubmit({
  children,
  message,
  confirmLabel = "Yes, do it",
  variant = "danger",
  pendingLabel,
  className,
}: {
  children: ReactNode;
  message: string;
  /** The affirmative button's words. Say what happens, never "OK". */
  confirmLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pendingLabel?: string;
  /** Override the trigger's styling; the confirm dialog's own is fixed. */
  className?: string;
}) {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLDialogElement>(null);
  const labelId = useId();

  return (
    <>
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        className={className}
        onClick={() => ref.current?.showModal()}
      >
        {pending ? (pendingLabel ?? "Working…") : children}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={labelId}
        className="m-auto w-full max-w-sm bg-transparent p-0 backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <Card className="bg-sheet">
          <div className="p-4">
            <p id={labelId} className="text-sm">
              {message}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => ref.current?.close()}
              >
                Cancel
              </Button>
              {/*
                A real submit button inside the form this dialog sits in, so
                confirming submits the server action directly — no synthetic
                re-dispatch, no requestSubmit() to go wrong.
              */}
              <Button
                type="submit"
                variant={variant}
                onClick={() => ref.current?.close()}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </Card>
      </dialog>
    </>
  );
}

/** Copies the trip's one share link. No per-invitee tracking (ticket 01). */
export function CopyLink({
  value,
  label = "Copy invite link",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

/** Toggle group used for votes and availability. */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onSelect,
}: {
  name: string;
  value: T | null;
  options: { value: T; label: string; tone?: "agreed" | "open" | "action" }[];
  onSelect: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="inline-flex overflow-hidden rounded-sm border border-rule-strong"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onSelect(o.value)}
          className={cx(
            "px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
            value === o.value
              ? "bg-pen text-sheet"
              : "bg-sheet text-ink-soft hover:bg-sheet-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
