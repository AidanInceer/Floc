import { useEffect, useRef } from "react";

import { flightPoint, PLANE_D, TRAIL_D, TRAIL_H, TRAIL_W } from "@/lib/landing/hero/flight-path";

import { FLIGHT_MS } from "./beats";

/** A plane crosses behind the cards on a dashed arc, drawing its trail, for as long as the cards take to play. */
export function Flight({ flying }: { flying: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const trail = useRef<SVGSVGElement>(null);
  const plane = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const [b, tr, p] = [box.current, trail.current, plane.current];
    if (!b || !tr || !p) return;
    const place = (t: number) => {
      // Why: percentages, not px, so the deck's CSS zoom cannot shift the plane off its trail.
      const { width, height } = b.getBoundingClientRect();
      const at = flightPoint(t, width, height);
      const left = (at.x / width) * 100;
      p.style.left = `${left}%`;
      p.style.top = `${(at.y / height) * 100}%`;
      p.style.rotate = `${at.angle}deg`;
      tr.style.clipPath = `inset(0 ${Math.max(0, 100 - left)}% 0 0)`;
    };
    if (!flying) return place(0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return place(1);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FLIGHT_MS);
      place(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [flying]);

  return (
    <div ref={box} className="deck-flight" aria-hidden="true">
      <svg ref={trail} className="deck-trail" viewBox={`0 0 ${TRAIL_W} ${TRAIL_H}`} preserveAspectRatio="none">
        <path d={TRAIL_D} />
      </svg>
      <span ref={plane} className="deck-plane">
        <svg viewBox="0 0 24 24">
          <path d={PLANE_D} />
        </svg>
      </span>
    </div>
  );
}
