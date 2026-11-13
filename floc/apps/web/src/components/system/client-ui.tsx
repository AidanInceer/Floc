"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";

import { Button, Card, ErrorText, busyMark, cx, iconButtonClass, segmentTrack } from "./ui";
import { CheckIcon } from "./icons";

// Server-rendered children can't take a close callback as a prop — a form
// that wants to close only on successful submit reads it from here instead.
const SheetCloseContext = createContext<(() => void) | null>(null);

/** In flight for a form that posts without React's form action (`keepAnswers`), where `useFormStatus` cannot see it. */
const FormPendingContext = createContext(false);

export function useSheetClose() {
  return useContext(SheetCloseContext);
}

// Wraps useActionState so a server action's { error } renders under the form.
export function ActionForm({
  action,
  children,
  className,
  footer,
  errorClassName = "mt-2",
  keepAnswers = false,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  children: ReactNode;
  className?: string;
  /** Drawn below the error, so a refusal sits above the submit bar where it is seen. */
  footer?: ReactNode;
  errorClassName?: string;
  /** Why: React resets a form after its action, so a form that stays open after a refusal would lose its answers. */
  keepAnswers?: boolean;
}) {
  // Why: an old refusal next to a field just changed reads as being about the new answer.
  const [edited, setEdited] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_previous: { error?: string }, formData: FormData) => {
      setEdited(false);
      return (await action(formData)) ?? {};
    },
    {},
  );

  return (
    <form
      action={keepAnswers ? undefined : formAction}
      onSubmit={keepAnswers ? (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      } : undefined}
      className={className}
      onChange={() => setEdited(true)}
    >
      <FormPendingContext.Provider value={pending}>
        {children}
        {state.error && !edited ? (
          <div className={errorClassName}>
            <ErrorText>{state.error}</ErrorText>
          </div>
        ) : null}
        {footer}
      </FormPendingContext.Provider>
    </form>
  );
}

/** In flight for the form around it, whether it posts as a form action or through `keepAnswers`. */
export function useFormPending(): boolean {
  const status = useFormStatus();
  const posting = useContext(FormPendingContext);
  return status.pending || posting;
}

/** Disables itself while its parent server action is in flight. It keeps its own words, so the action stays named (#572). */
export function SubmitButton({
  children,
  variant = "primary",
  className,
  disabled,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  /** Verb stays shown but not always available (ticket 133). */
  disabled?: boolean;
}) {
  const pending = useFormPending();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={className}
    >
      {children}
      {busyMark(pending)}
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
  bareTrigger,
  defaultOpen,
  body = "padded",
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
  /** Skip the pill-button chrome entirely — for a trigger that *is* a surface,
      like the "start a trip" tile in the /trips grid (ticket 193). */
  bareTrigger?: boolean;
  /** Open on arrival — a link that asked for this sheet (the landing's closing ticket). */
  defaultOpen?: boolean;
  /** `flush` and `split` leave padding to the content, so it can run a `SheetFooter` edge to edge; `split` also widens for two columns. */
  body?: "padded" | "flush" | "split";
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

  useEffect(() => {
    if (!defaultOpen || ref.current?.open) return;
    ref.current?.showModal();
    setOpen(true);
  }, [defaultOpen]);

  return (
    <>
      {bareTrigger ? (
        <button
          type="button"
          className={triggerClassName}
          aria-label={triggerLabel}
          title={triggerLabel}
          onClick={() => {
            ref.current?.showModal();
            setOpen(true);
          }}
        >
          {trigger}
        </button>
      ) : (
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
      )}
      <dialog
        ref={ref}
        aria-labelledby={labelId}
        className={cx(
          "m-0 max-h-[90dvh] w-full bg-transparent p-0 backdrop:bg-black/40 sm:m-auto",
          // Flush bodies scroll inside the card, so a footer stays pinned and there is one scrollbar, not two.
          body === "padded" ? "overflow-y-auto" : "overflow-hidden",
          body === "split" ? "max-w-[44rem]" : "max-w-lg",
        )}
        style={{ marginTop: "auto" }}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <Card
          className={cx(
            "rounded-b-none bg-sheet sm:rounded-md",
            body !== "padded" && "flex max-h-[90dvh] flex-col overflow-hidden",
          )}
        >
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
          {/* Why stopped here: a submit in this sheet is its own, and must not close a dialog around it. */}
          <div
            className={body === "padded" ? "p-4" : "scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto"}
            onSubmit={(event) => { event.stopPropagation(); if (!keepOpenOnSubmit) setTimeout(close, 0); }}
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
  confirmVariant,
  className,
  label,
}: {
  children: ReactNode;
  message: string;
  /** Say what happens, never "OK". */
  confirmLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** The panel's own verb, when the trigger is quieter than what it does — an icon-only X still confirms in red. */
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  /** Accessible name/tooltip for an icon-only trigger (ticket 38). */
  label?: string;
}) {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLDialogElement>(null);
  const labelId = useId();
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) ref.current?.close();
    wasPending.current = pending;
  }, [pending]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        aria-busy={pending || undefined}
        className={className}
        aria-label={label}
        title={label}
        onClick={() => ref.current?.showModal()}
      >
        {children}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={labelId}
        className="m-auto w-full max-w-md bg-transparent p-0 backdrop:bg-ink/30"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        {/* The question is the panel's one heading (ticket 209) — a "Are you
            sure?" title over it would print the same fact twice. */}
        <div className="rounded-md border border-rule bg-sheet p-6 shadow-lifted">
          <p
            id={labelId}
            className="font-display text-lg font-semibold leading-snug"
          >
            {message}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => ref.current?.close()}
            >
              Cancel
            </Button>
            {/* Stays open until the action settles, so a slow or failed one is seen. */}
            <Button type="submit" variant={confirmVariant ?? variant} disabled={pending} aria-busy={pending || undefined}>
              {confirmLabel}
              {busyMark(pending)}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Copies the trip's one share link. No per-invitee tracking (ticket 01). */
export function CopyLink({
  value,
  label = "Copy invite link",
  item = "Link",
  variant = "secondary",
  icon,
}: {
  value: string;
  label?: string;
  item?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copiedNow = status === "copied";
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <>
      {/* Why: a copy keeps the button's words, holds a pen wash for a second and shows a tick (ADR-053); the tick is what hover never shows. */}
      <Button
        variant={variant}
        className={cx(copiedNow && "relative", copiedNow && variant !== "primary" && "!border-pen !bg-pen-soft !text-pen-deep")}
        onClick={async () => {
          let copied = true;
          try {
            await navigator.clipboard.writeText(value);
            setStatus("copied");
          } catch {
            copied = false;
            setStatus("failed");
          }
          // The wash lasts 1.2s; a failure keeps its words long enough to read.
          clearTimeout(reset.current);
          reset.current = setTimeout(() => setStatus("idle"), copied ? 1300 : 2500);
        }}
      >
        {status === "failed" ? "Copy failed" : (
          <>
            {/* Why: with no icon to stand in for, the tick sits in the left padding, so the button keeps its width. */}
            {copiedNow && icon ? <CheckIcon /> : icon}
            {copiedNow && !icon ? (
              <span aria-hidden className="absolute left-[3px] top-1/2 -translate-y-1/2">
                <CheckIcon size={11} />
              </span>
            ) : null}
            {label}
          </>
        )}
      </Button>
      <span aria-live="polite" className="sr-only">
        {status === "copied" ? `${item} copied` : status === "failed" ? `Copy failed. The ${item.toLowerCase()} is ${value}` : ""}
      </span>

    </>
  );
}

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
  panelClassName,
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
  /** Replaces the default panel look; position stays the menu's. */
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  // The query too, not just the path: a menu item that only changes a sort or
  // filter param would otherwise navigate and leave the panel sitting open
  // over the list it just re-ordered.
  const query = useSearchParams().toString();

  useEffect(() => setOpen(false), [pathname, query]);

  // Why: a sheet opened from here stops its own submit, so its closing is what closes the menu. Capture, since close does not bubble.
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const onClose = (event: Event) => { if (event.target instanceof HTMLDialogElement) setOpen(false); };
    panel.addEventListener("close", onClose, true);
    return () => panel.removeEventListener("close", onClose, true);
  }, [open]);

  // Why: a menu by a button near the screen edge on a phone would spill off it; slide it back in, and again when it changes width.
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const fit = () => {
      panel.style.translate = "";
      const r = panel.getBoundingClientRect();
      const shift = r.left < 8 ? 8 - r.left : r.right > window.innerWidth - 8 ? window.innerWidth - 8 - r.right : 0;
      if (shift) panel.style.translate = `${Math.round(shift)}px 0`;
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(panel);
    return () => watch.disconnect();
  }, [open]);

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
    <div ref={wrapRef} className={cx("relative", open && "z-[1200]")}>
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
            ? cx(!triggerClassName.includes("lift") && "transition-colors", triggerClassName)
            : iconButtonClass(open)
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
            // w-max: sized to its longest verb, not a fixed width.
            "absolute z-[1200]",
            panelClassName ??
              "w-max min-w-[5rem] max-w-[14rem] rounded-md border border-rule-strong bg-sheet p-1 shadow-raised",
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
      viewBox="0 0 14 14"
      width="13"
      height="13"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="2.5" cy="7" r="1" />
      <circle cx="7" cy="7" r="1" />
      <circle cx="11.5" cy="7" r="1" />
    </svg>
  );
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A segmented control for a form choice (money overhaul): a recessed
 * `--sheet-3` track and one sliding ink indicator, toggling a value.
 */
export function PillToggle<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const navRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null,
  );

  useIsoLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const pill = pillRefs.current[value];
      if (!pill) return;
      const navRect = nav.getBoundingClientRect();
      const pillRect = pill.getBoundingClientRect();
      setIndicator({
        left: pillRect.left - navRect.left + nav.scrollLeft,
        width: pillRect.width,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div
      ref={navRef}
      role="tablist"
      aria-label={label}
      className={cx(
        "relative flex w-full items-center gap-1",
        segmentTrack,
        className,
      )}
    >
      {indicator ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 bottom-1 rounded-sm bg-pen-soft transition-[transform,width] duration-200 ease-[cubic-bezier(0.2,0.85,0.3,1)] motion-reduce:transition-none"
          style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
        />
      ) : null}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            ref={(el) => {
              pillRefs.current[opt.value] = el;
            }}
            onClick={() => onChange(opt.value)}
            className={cx(
              "relative z-10 flex-1 whitespace-nowrap rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "text-pen-deep" : "text-ink-soft hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
