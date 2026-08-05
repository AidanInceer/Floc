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

/**
 * How a client component *inside* a sheet dismisses it.
 *
 * The sheet's children are rendered on the server, so a parent can't hand a
 * close callback down as a prop — a function doesn't cross that boundary. A
 * form that wants to close itself only on a *successful* submit (rather than
 * on submit, which is what `keepOpenOnSubmit` turns off) reads it from here.
 */
const SheetCloseContext = createContext<(() => void) | null>(null);

export function useSheetClose() {
  return useContext(SheetCloseContext);
}

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
  triggerLabel,
  keepOpenOnSubmit,
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
  /** Accessible name and tooltip for a trigger whose content is an icon
      (the roster's nudge bell, v0.2 ticket 07). */
  triggerLabel?: string;
  /**
   * Stay open after a form inside submits. For a sheet you submit *once* —
   * add an event, edit one — closing is the right end to the interaction. A
   * comment thread is the opposite: reacting, replying and posting are all
   * things you do several of in a row, and closing the modal under someone
   * who just tapped a heart loses their place in the conversation
   * (v0.2 ticket 06).
   */
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
          {/* Submitting anything inside dismisses the sheet — the server action
              revalidates the page underneath it — unless the sheet is one you
              stay in and keep working (see `keepOpenOnSubmit`). */}
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
  label,
}: {
  children: ReactNode;
  message: string;
  /** The affirmative button's words. Say what happens, never "OK". */
  confirmLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pendingLabel?: string;
  /** Override the trigger's styling; the confirm dialog's own is fixed. */
  className?: string;
  /** Accessible name and tooltip for a trigger whose content is an icon — the
      roster's kick boot (ticket 38), same reason `Sheet` takes one. */
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
  variant = "secondary",
  icon,
}: {
  value: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Leading glyph — the roster's "Share trip" reads as a share, not a copy
      (v0.2 ticket 07), even though copying is what it does. */
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

/**
 * A reorderable list of cards — the stops on Route, the days on Days.
 *
 * Drag is the *fast* way, never the only way: pointer drag has no keyboard
 * equivalent and no story on a touchscreen worth relying on, so every row also
 * carries plain move-up/move-down buttons. Both call the same server action.
 *
 * `onReorder` is a bound server action, so the reorder is a real write, not
 * local state — the list re-renders from the database on the next paint. While
 * it's in flight the whole list dims, because a half-applied itinerary that
 * still accepted drags would let two moves race each other.
 *
 * The rows themselves are server-rendered and handed in as `items` — this
 * component owns the dragging, not the content.
 */
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
  // `draggable` is armed by the grip, not set permanently: a permanently
  // draggable card makes selecting the text inside it start a drag instead.
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
          /*
           * Every handler stops propagation, because these lists nest: a day's
           * events are a DragList inside the days' DragList. Without it, one
           * drop on an event bubbles to the day wrapper underneath it and
           * reorders the *days* as well — the innermost list owns the gesture.
           */
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

/* -------------------------------------------------------------------------- */
/* Overflow menu                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The class a control wears to look like a row in `Menu` (ticket 125).
 *
 * `!` throughout because most menu items are a `Button` — a `Sheet` trigger, a
 * `ConfirmSubmit`, a `SubmitButton` — and `buttonBase`'s own utilities have to
 * be beaten. In Tailwind v4 the stylesheet's order decides that, not the order
 * of the class list.
 */
export const menuItemClass =
  "!block !w-full !rounded-sm !border-none !px-2.5 !py-1.5 !text-left !font-sans !text-sm !normal-case !tracking-normal !text-ink-soft hover:!bg-sheet-2 hover:!text-ink";

/** The same row, for the one verb you can't take back. */
export const menuDangerItemClass =
  "!block !w-full !rounded-sm !border-none !bg-transparent !px-2.5 !py-1.5 !text-left !font-sans !text-sm !normal-case !tracking-normal !text-ink-soft hover:!bg-red-soft hover:!text-red";

/**
 * A row's secondary verbs, behind one triple-dot (ticket 125).
 *
 * A card carrying Edit *and* Delete *and* a nudge bell spends its whole right
 * edge on things you rarely do, and every one of them competes with what the
 * row is actually for. One affordance shows; the verbs are revealed on demand.
 *
 * The panel does **not** close when something inside it is clicked, and that's
 * deliberate: every destructive item here is a `ConfirmSubmit` and every edit
 * is a `Sheet`, both of which open a native `<dialog>` rendered *inside* this
 * subtree. Unmounting the panel on click would tear the dialog out mid-flight.
 * So it closes on the three things that mean "I'm done": a pointer outside, an
 * Escape, or a submit that has actually gone through. A dialog in the top layer
 * is still a DOM descendant of the panel, so clicking one is never "outside".
 *
 * Not built on `Sheet` for the same reason `AccountMenu` wasn't: a sheet is a
 * modal, which is the wrong weight for three words hanging off their trigger.
 */
export function Menu({
  label,
  children,
  align = "right",
  trigger,
  triggerClassName,
}: {
  /** Accessible name — say whose or what's menu this is. */
  label: string;
  /** Plain nodes only; the same server/client rule `Sheet` documents. */
  children: ReactNode;
  align?: "left" | "right";
  /** Defaults to the triple-dot. */
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  // Navigating away must not leave the panel hanging over the new page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    // Opening a menu puts you *in* it — otherwise the keyboard is still on the
    // trigger and the first Tab leaves the panel it just opened.
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
        /* A caller with its own trigger shape (the account pill) replaces
           these outright rather than fighting them with `!` — and styles the
           open state off `data-open`, which is why it's on the element. */
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
            "absolute z-30 mt-1 w-48 rounded-md border border-rule-strong bg-sheet p-1 shadow-raised",
            align === "right" ? "right-0" : "left-0",
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
