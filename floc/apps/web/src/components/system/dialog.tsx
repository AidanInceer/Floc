"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { CrossIcon } from "./icons";
import { iconInkClass } from "./ui";

export function Dialog({ open, onClose, title, className, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
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

const CLOSE = iconInkClass;

export function DialogClose({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={children ? undefined : "Close"}
      title={children ? undefined : "Close"}
      onClick={(event) => event.currentTarget.closest("dialog")?.close()}
      className={className ?? CLOSE}
    >
      {children ?? <CrossIcon />}
    </button>
  );
}
