"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CrossIcon } from "./icons";
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
      <CrossIcon size={14} />
    </Button>
  );
}
