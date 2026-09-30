"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./ui";

export function Dialog({ open, onClose, title, className, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={className}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClose={onClose}
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

export function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="secondary" className="size-10 shrink-0" style={{ padding: 0 }} onClick={onClick} aria-label="Close">
      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" aria-hidden="true">
        <path d="m3 3 8 8M11 3l-8 8" />
      </svg>
    </Button>
  );
}
