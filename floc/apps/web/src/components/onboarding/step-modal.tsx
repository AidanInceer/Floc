"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { CrossIcon } from "@/components/system/icons";
import { iconButtonClass } from "@/components/system/ui";
import "./onboarding.css";

function useContentHeight() {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { inner, height };
}

export function StepModal({
  open,
  label,
  onClose,
  footer,
  corner,
  action,
  children,
}: {
  open: boolean;
  label: string;
  onClose: () => void;
  footer: ReactNode;
  corner?: ReactNode;
  action?: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { inner, height } = useContentHeight();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      el.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="step-modal m-auto outline-none w-[min(27rem,calc(100vw-24px))] overflow-hidden rounded-md bg-sheet p-0 text-ink shadow-lifted backdrop:bg-black/40 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
    >
      <div
        className="overflow-hidden transition-[height] duration-[280ms] ease-(--ease) motion-reduce:transition-none"
        style={height === null ? undefined : { height }}
      >
        <div ref={inner}>
          {corner ? <span className="absolute left-4 top-3.5 flex text-pen">{corner}</span> : null}
          <span className="absolute right-3 top-3 flex">
            <button type="button" onClick={onClose} aria-label="Close" className={iconButtonClass(false)}>
              <CrossIcon />
            </button>
          </span>
          {action ? (
            <form action={action}>
              <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain px-6 pb-5 pt-8 max-sm:px-4">{children}</div>
              <footer className="flex items-center gap-2 border-t border-rule px-4 py-3">{footer}</footer>
            </form>
          ) : (
            <>
              <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain px-6 pb-5 pt-8 max-sm:px-4">{children}</div>
              <footer className="flex items-center gap-2 border-t border-rule px-4 py-3">{footer}</footer>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
