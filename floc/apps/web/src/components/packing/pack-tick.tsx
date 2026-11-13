"use client";

import { useEffect, useRef } from "react";

import { cx } from "@/components/system/ui";
import { CheckIcon } from "@/components/system/icons";
import { tickBoxBase, tickBoxClass } from "@/components/packing/packing-glyphs";
import { justTurnedOn } from "@/lib/motion/just-turned-on";

/** The packed tick on both packing rows. Its tick draws itself on the press that packs it (ADR-053). */
export function PackTick({ packed, label }: { packed: boolean; label: string }) {
  const was = useRef<boolean | undefined>(undefined);
  const draw = justTurnedOn(was.current, packed);
  useEffect(() => {
    was.current = packed;
  }, [packed]);

  return (
    <button
      type="submit"
      aria-label={packed ? `Unpack ${label}` : `Mark ${label} packed`}
      className={cx(tickBoxBase, tickBoxClass(packed), draw && "tick-draw")}
    >
      <CheckIcon />
    </button>
  );
}
