"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/system/ui";

/** Once a trip has dates, finding them steps aside (#459): the board opens only when someone wants to change them. */
export function DatesFold({ quiet, children }: { quiet: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);
  const label = open ? "Done" : "Change the dates";
  return (
    <>
      {quiet ? (
        <button type="button" onClick={toggle} aria-expanded={open} className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
          {label}
        </button>
      ) : (
        <Button onClick={toggle} aria-expanded={open}>
          {label}
        </Button>
      )}
      {open ? <div className="mt-6">{children}</div> : null}
    </>
  );
}
