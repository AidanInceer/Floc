"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/system/ui";

/** Once a trip has dates, finding them steps aside (#459): the board opens only when someone wants to change them. */
export function DatesFold({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Done" : "Change the dates"}
      </Button>
      {open ? <div className="mt-6">{children}</div> : null}
    </>
  );
}
