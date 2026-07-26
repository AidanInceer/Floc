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

/** A form button that asks first — used for kick, delete, archive. */
export function ConfirmSubmit({
  children,
  message,
  variant = "danger",
  pendingLabel,
}: {
  children: ReactNode;
  message: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </Button>
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
