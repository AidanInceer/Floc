"use client";

import { useRef, type ReactNode } from "react";

import { cx } from "@/components/system/ui";
import { useBarFuse } from "@/components/chrome/use-bar-fuse";
import "./fuse-bar.css";

/**
 * The top bar's row of beads. Scrolling fuses them into one bar; without script
 * they stay three separate beads. Each direct child is one bead.
 */
export function FuseBar({ className, children }: { className?: string; children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const skin = useRef<SVGSVGElement>(null);
  useBarFuse(row, skin);

  return (
    <div ref={row} className={cx("fuse-row relative isolate", className)}>
      <svg ref={skin} aria-hidden="true" className="fuse-skin pointer-events-none absolute left-0 top-0 -z-10 overflow-visible">
        <path />
      </svg>
      {children}
    </div>
  );
}
