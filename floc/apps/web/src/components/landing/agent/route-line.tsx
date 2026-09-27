"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cx } from "@/components/system/ui";

const easeOut = (x: number) => 1 - (1 - x) ** 3;

/**
 * The house's dashed route line, drawing itself along `d` once `go` turns on,
 * with a pen dot riding its head. A mask uncovers the dashes, so they never
 * slide. Once drawn, a new `d` (a resize) just shows the whole line.
 */
export function RouteLine({ d, go, ms, className }: { d: string; go: boolean; ms: number; className?: string }) {
  const id = `agent-line${useId().replace(/\W/g, "")}`;
  const mask = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const path = mask.current;
    const head = dot.current;
    if (!go || drawn || !path || !head) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setDrawn(true);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const e = easeOut(p);
      path.style.strokeDashoffset = String(1 - e);
      const at = path.getPointAtLength(path.getTotalLength() * e);
      head.setAttribute("cx", String(at.x));
      head.setAttribute("cy", String(at.y));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setDrawn(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [go, drawn, ms]);

  if (!go) return null;
  const end = d.match(/(-?[\d.]+) (-?[\d.]+)$/);
  return (
    <g className={cx("agent-line", drawn && "is-drawn", className)}>
      <mask id={id} maskUnits="userSpaceOnUse" x="-50" y="-50" width="4000" height="4000">
        {/* pathLength 1: the dash offset runs 1 → 0 whatever the line's length. */}
        <path ref={mask} d={d} pathLength={1} strokeDasharray="1 1" style={drawn ? { strokeDashoffset: 0 } : { strokeDashoffset: 1 }} className="agent-line-mask" />
      </mask>
      <path d={d} mask={`url(#${id})`} className="agent-line-path" />
      {end && <circle className="agent-line-end" cx={end[1]} cy={end[2]} r="3.2" />}
      <circle ref={dot} className="agent-line-dot" r="4.5" cx="-99" cy="-99" />
    </g>
  );
}
