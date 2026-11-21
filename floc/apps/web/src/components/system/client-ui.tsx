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

import { Button, Card, ErrorText, busyMark, cx, iconButtonClass } from "./ui";
import { CheckIcon } from "./icons";

const SheetCloseContext = createContext<(() => void) | null>(null);

const FormPendingContext = createContext(false);

export function useSheetClose() {
  return useContext(SheetCloseContext);
}

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
  footer?: ReactNode;
  errorClassName?: string;
  keepAnswers?: boolean;
}) {
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

export function useFormPending(): boolean {
  const status = useFormStatus();
  const posting = useContext(FormPendingContext);
  return status.pending || posting;
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
  disabled,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
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
  children: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerClassName?: string;
  triggerLabel?: string;
  keepOpenOnSubmit?: boolean;
  bareTrigger?: boolean;
  defaultOpen?: boolean;
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

export function ConfirmSubmit({
  children,
  message,
  confirmLabel = "Yes, do it",
  variant = "danger",
  confirmVariant,
  className,
  label,
  alternative,
}: {
  children: ReactNode;
  message: string;
  confirmLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  label?: string;
  alternative?: { label: string; action: (formData: FormData) => Promise<void> };
}) {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLDialogElement>(null);
  const labelId = useId();
  const wasPending = useRef(false);
  const [choseAlternative, setChoseAlternative] = useState(false);
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
        <div className="rounded-md border border-rule bg-sheet p-6 shadow-lifted">
          <p
            id={labelId}
            className="font-display text-lg font-semibold leading-snug"
          >
            {message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => ref.current?.close()}
            >
              Cancel
            </Button>
            {alternative ? (
              <Button
                type="submit"
                variant="secondary"
                formAction={alternative.action}
                disabled={pending}
                aria-busy={(pending && choseAlternative) || undefined}
                onClick={() => setChoseAlternative(true)}
              >
                {alternative.label}
                {busyMark(pending && choseAlternative)}
              </Button>
            ) : null}
            <Button
              type="submit"
              variant={confirmVariant ?? variant}
              disabled={pending}
              aria-busy={(pending && !choseAlternative) || undefined}
              onClick={() => setChoseAlternative(false)}
            >
              {confirmLabel}
              {busyMark(pending && !choseAlternative)}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

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
          clearTimeout(reset.current);
          reset.current = setTimeout(() => setStatus("idle"), copied ? 1300 : 2500);
        }}
      >
        {status === "failed" ? "Copy failed" : (
          <>
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

export function Menu({
  label,
  children,
  align = "right",
  drop = "down",
  trigger,
  triggerClassName,
  panelClassName,
  anchor = "trigger",
}: {
  label: string;
  children: ReactNode;
  align?: "left" | "right";
  drop?: "down" | "up";
  trigger?: ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  anchor?: "trigger" | "parent";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const query = useSearchParams().toString();

  useEffect(() => setOpen(false), [pathname, query]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const onClose = (event: Event) => { if (event.target instanceof HTMLDialogElement) setOpen(false); };
    panel.addEventListener("close", onClose, true);
    return () => panel.removeEventListener("close", onClose, true);
  }, [open]);

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
    <div ref={wrapRef} className={cx(anchor === "trigger" && "relative", open && "z-[1200]")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        title={label}
        data-open={open}
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
