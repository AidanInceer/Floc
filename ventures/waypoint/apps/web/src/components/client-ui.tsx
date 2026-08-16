"use client";

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { usePathname } from "next/navigation";

import { Button, Card, ErrorText, cx } from "./ui";

// Server-rendered children can't take a close callback as a prop — a form
// that wants to close only on successful submit reads it from here instead.
const SheetCloseContext = createContext<(() => void) | null>(null);

export function useSheetClose() {
  return useContext(SheetCloseContext);
}

// Wraps useActionState so a server action's { error } renders under the form.
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
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  /** Verb stays shown but not always available (ticket 133). */
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending || disabled}
      className={className}
    >
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}

// Native <dialog>: bottom sheet on mobile, centred panel on desktop (ticket 05).
export function Sheet({
  trigger,
  title,
  children,
  triggerVariant = "primary",
  triggerClassName,
  triggerLabel,
  keepOpenOnSubmit,
}: {
  trigger: ReactNode;
  title: string;
  /** Plain nodes only — a function child can't cross the server/client
      boundary, and every caller here is a Server Component. */
  children: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  /** Override the trigger's own styling — a sticky note has no room for a
      full-size uppercase button. */
  triggerClassName?: string;
  /** Accessible name/tooltip for an icon-only trigger (v0.2 ticket 07). */
  triggerLabel?: string;
  /** Stay open after a submit — for repeat actions like reacting/replying
      rather than a one-shot add/edit (v0.2 ticket 06). */
  keepOpenOnSubmit?: boolean;
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
        aria-label={triggerLabel}
        title={triggerLabel}
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
          {/* Submit dismisses the sheet unless keepOpenOnSubmit. */}
          <div
            className="p-4"
            onSubmit={keepOpenOnSubmit ? undefined : () => setTimeout(close, 0)}
          >
            <SheetCloseContext.Provider value={close}>
              {open ? children : null}
            </SheetCloseContext.Provider>
          </div>
        </Card>
      </dialog>
    </>
  );
}

// Asks first via a native <dialog>, not window.confirm — a browser that
// suppresses confirm() returns false silently, reading as a dead button.
export function ConfirmSubmit({
  children,
  message,
  confirmLabel = "Yes, do it",
  variant = "danger",
  pendingLabel,
  className,
  label,
}: {
  children: ReactNode;
  message: string;
  /** Say what happens, never "OK". */
  confirmLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pendingLabel?: string;
  className?: string;
  /** Accessible name/tooltip for an icon-only trigger (ticket 38). */
  label?: string;
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
        aria-label={label}
        title={label}
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
              {/* Real submit inside the form — submits the action directly. */}
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
  variant = "secondary",
  icon,
}: {
  value: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={variant}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied" : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );
}

// Drag is never the only way in — no keyboard/touch equivalent — so every
// row also has move-up/down buttons. Dims mid-reorder so moves can't race.
export function DragList({
  items,
  onReorder,
  label,
}: {
  items: { key: string; label: string; node: ReactNode }[];
  onReorder: (from: number, to: number) => Promise<void>;
  /** Names the thing being moved, e.g. "stop" — used in the button labels. */
  label: string;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  // Armed by the grip, not permanent — else selecting text in the card starts a drag.
  const [armed, setArmed] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (from: number, to: number) => {
    setDragging(null);
    setOver(null);
    setArmed(null);
    if (from === to || to < 0 || to >= items.length) return;
    startTransition(async () => {
      await onReorder(from, to);
    });
  };

  const grip = (i: number) => (
    <span
      onMouseDown={() => setArmed(i)}
      onMouseUp={() => setArmed(null)}
      aria-hidden="true"
      title={`Drag to move this ${label}`}
      className="cursor-grab select-none px-1 font-mono text-sm leading-none text-ink-faint active:cursor-grabbing"
    >
      ⠿
    </span>
  );

  return (
    <div
      className={cx(
        "flex flex-col gap-4",
        pending && "pointer-events-none opacity-60",
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.key}
          draggable={armed === i}
          // stopPropagation throughout: lists nest, else a drop bubbles up and reorders the parent list too.
          onDragStart={(e) => {
            e.stopPropagation();
            setDragging(i);
            e.dataTransfer.effectAllowed = "move";
            // Firefox won't start a drag without some payload set.
            e.dataTransfer.setData("text/plain", item.key);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            setDragging(null);
            setOver(null);
            setArmed(null);
          }}
          onDragOver={(e) => {
            if (dragging === null) return;
            e.stopPropagation();
            e.preventDefault();
            setOver(i);
          }}
          onDrop={(e) => {
            if (dragging === null) return;
            e.stopPropagation();
            e.preventDefault();
            move(dragging, i);
          }}
          className={cx(
            "rounded-md transition-shadow",
            dragging === i && "opacity-50",
            over === i && dragging !== null && dragging !== i && "ring-2 ring-pen",
          )}
        >
          <div className="mb-1 flex items-center gap-1">
            {grip(i)}
            <Button
              variant="ghost"
              disabled={i === 0}
              aria-label={`Move ${item.label} earlier`}
              onClick={() => move(i, i - 1)}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              disabled={i === items.length - 1}
              aria-label={`Move ${item.label} later`}
              onClick={() => move(i, i + 1)}
            >
              ↓
            </Button>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
              {i + 1} of {items.length}
            </span>
          </div>
          {item.node}
        </div>
      ))}
    </div>
  );
}

// Row styling for `Menu` (ticket 125). `!` throughout to beat buttonBase —
// Tailwind v4 specificity is stylesheet order, not class-list order.
export const menuItemClass =
  "!block !w-full !rounded-sm !border-none !px-2.5 !py-1.5 !text-left !font-sans !text-sm !normal-case !tracking-normal !text-ink-soft hover:!bg-sheet-2 hover:!text-ink";

/** The same row, for the one verb you can't take back. */
export const menuDangerItemClass =
  "!block !w-full !rounded-sm !border-none !bg-transparent !px-2.5 !py-1.5 !text-left !font-sans !text-sm !normal-case !tracking-normal !text-ink-soft hover:!bg-red-soft hover:!text-red";

// Secondary verbs behind one triple-dot (ticket 125). Does NOT close on an
// inside click — menu items open native <dialog>s (ConfirmSubmit, Sheet) in
// this subtree, and unmounting would tear one out mid-flight. Closes only on
// an outside pointer, Escape, or a submit that went through.
export function Menu({
  label,
  children,
  align = "right",
  drop = "down",
  trigger,
  triggerClassName,
}: {
  /** Accessible name — say whose or what's menu this is. */
  label: string;
  /** Plain nodes only; same server/client rule as `Sheet`. */
  children: ReactNode;
  align?: "left" | "right";
  /** The page sheet clips overflow, so a menu on the list's last row must
      open upwards or it's cut off at the paper's edge. */
  drop?: "down" | "up";
  /** Defaults to the triple-dot. */
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    // Otherwise the keyboard stays on the trigger and the first Tab leaves the panel.
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

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

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        title={label}
        data-open={open}
        // A caller with its own trigger (account pill) replaces these outright and styles off data-open.
        className={
          triggerClassName
            ? cx("transition-colors", triggerClassName)
            : cx(
                "flex h-[26px] w-[26px] items-center justify-center rounded-full border transition-colors",
                open
                  ? "border-rule-strong bg-sheet-2 text-ink"
                  : "border-transparent text-ink-faint hover:border-rule-strong hover:bg-sheet-2 hover:text-ink",
              )
        }
      >
        {trigger ?? <MoreIcon />}
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onSubmit={() => setTimeout(() => setOpen(false), 0)}
          className={cx(
            // z-[1200]: above Leaflet's panes. w-max: sized to its longest verb, not a fixed width.
            "absolute z-[1200] w-max min-w-[8rem] max-w-[14rem] rounded-md border border-rule-strong bg-sheet p-1 shadow-raised",
            align === "right" ? "right-0" : "left-0",
            drop === "up" ? "bottom-full mb-1" : "mt-1",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Three dots in a row — the one glyph that means "the rest of the verbs". */
function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </svg>
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
