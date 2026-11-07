"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { CrossIcon } from "./icons";

export function Dialog({ open, onClose, title, className, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Why: Strict Mode runs the effect's cleanup once on mount; its close() must not read as the user closing it.
  const closingQuietly = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      if (dialog.open) {
        closingQuietly.current = true;
        dialog.close();
      }
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={className}
      // Why the target check: React bubbles a nested sheet's close and cancel up to here, which shut this one too.
      onCancel={(event) => { if (event.target !== event.currentTarget) return; event.preventDefault(); onClose(); }}
      onClose={(event) => {
        if (event.target !== event.currentTarget) return;
        if (closingQuietly.current) closingQuietly.current = false;
        else onClose();
      }}
      onClick={(event) => {
        if (event.target !== ref.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

/**
 * Closes the dialog it sits in, from anywhere in its body — a form's own head can
 * carry the ✕ (wireframe/modal-forms B3). The dialog's close event calls `onClose`.
 */
const CLOSE = "inline-flex size-8 items-center justify-center rounded-sm transition-colors hover:text-pen";

export function DialogClose({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={children ? undefined : "Close"}
      title={children ? undefined : "Close"}
      onClick={(event) => event.currentTarget.closest("dialog")?.close()}
      className={className ?? CLOSE}
    >
      {children ?? <CrossIcon size={14} />}
    </button>
  );
}
