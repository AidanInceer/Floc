"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/system/ui";

export function DatesFold({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Done" : "Change the dates"}
        </Button>
        {aside}
      </div>
      {open ? <div className="mt-6">{children}</div> : null}
    </>
  );
}
