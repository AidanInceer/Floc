"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/system/ui";

export function DatesFold({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <Button variant={open ? "secondary" : "primary"} onClick={() => setOpen(!open)} aria-expanded={open} className="shrink-0 whitespace-nowrap max-sm:!px-2">
          {open ? "Done" : <span>Change<span className="max-sm:sr-only"> the dates</span></span>}
        </Button>
        {aside}
      </div>
      {open ? <div className="mt-6">{children}</div> : null}
    </>
  );
}
