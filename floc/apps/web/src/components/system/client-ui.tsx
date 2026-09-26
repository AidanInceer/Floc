"use client";

import {
  createContext,
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
  bareTrigger,
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
  confirmVariant,
  pendingLabel,
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
  pendingLabel?: string;
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
        className="m-auto w-full max-w-md bg-transparent p-0 backdrop:bg-ink/30"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        {/* The question is the panel's one heading (ticket 209) — a "Are you
            sure?" title over it would print the same fact twice. */}
        <div className="rounded-xl border border-rule bg-sheet p-6 shadow-lifted">
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
            <Button type="submit" variant={confirmVariant ?? variant} disabled={pending}>
              {pending ? (pendingLabel ?? "Working…") : confirmLabel}
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
  variant = "secondary",
  icon,
}: {
  value: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <>
      <Button
        variant={variant}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus("copied");
          } catch {
            setStatus("failed");
          }
          setTimeout(() => setStatus("idle"), 2500);
        }}
      >
        {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : (
          <>
            {icon}
            {label}
          </>
        )}
      </Button>
      <span aria-live="polite" className="sr-only">
        {status === "copied" ? "Link copied" : status === "failed" ? `Copy failed. The link is ${value}` : ""}
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

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A controlled sibling of `PillNav` for a form choice rather than navigation
 * (money overhaul): same recessed `--sheet-3` track and single sliding ink
 * indicator, but it toggles a value instead of following the route. One shared
 * pill language across the app — nav and in-form segmented controls alike.
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
        "relative flex w-full items-center gap-1 rounded-full bg-sheet-3 p-1",
        className,
      )}
    >
      {indicator ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 bottom-1 rounded-full bg-ink transition-[transform,width] duration-200 ease-[cubic-bezier(0.2,0.85,0.3,1)] motion-reduce:transition-none"
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
              "relative z-10 flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "text-sheet" : "text-ink-soft hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
