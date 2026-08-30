"use client";

/**
 * A word that throws a small burst of confetti when you point at it. Only the
 * hero's "sorted" uses it — the one place a flourish is the point.
 *
 * Hand-rolled rather than a library: it is ~20 spans and one keyframe, and a
 * confetti package would be several kB of shared First Load JS for a hover.
 */
import { useCallback, useRef, useState } from "react";

const PIECES = 18;

// The four domain pastels and the pen, drawn from tokens — no new colour.
const HUES = [
  "var(--peri-edge)",
  "var(--mint-edge)",
  "var(--butter-edge)",
  "var(--blush-edge)",
  "var(--pen)",
];

type Piece = {
  id: number;
  left: number;
  dx: number;
  dy: number;
  rot: number;
  size: number;
  hue: string;
  round: boolean;
  delay: number;
};

const LIFETIME_MS = 1100;

function makeBurst(seed: number): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => {
    // Fan the pieces across the word and upward, widest at the edges.
    const across = (i + 0.5) / PIECES;
    const spread = (across - 0.5) * 2;
    return {
      id: seed + i,
      left: across * 100,
      dx: spread * 54 + (i % 3) * 6 - 6,
      dy: -(38 + ((i * 7) % 34)),
      rot: (i % 2 ? 1 : -1) * (90 + ((i * 31) % 180)),
      size: 4 + (i % 3),
      hue: HUES[i % HUES.length],
      round: i % 3 === 0,
      delay: (i % 6) * 22,
    };
  });
}

export function ConfettiWord({ children }: { children: React.ReactNode }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  // One burst at a time: re-entering mid-flight would stack spans forever.
  const busy = useRef(false);

  const burst = useCallback(() => {
    if (busy.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    busy.current = true;
    setPieces(makeBurst(Date.now()));
    window.setTimeout(() => {
      setPieces([]);
      busy.current = false;
    }, LIFETIME_MS);
  }, []);

  return (
    <span className="relative inline-block" onPointerEnter={burst}>
      {children}
      <span aria-hidden="true" className="confetti">
        {pieces.map((p) => (
          <i
            key={p.id}
            style={
              {
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size + (p.round ? 0 : 3)}px`,
                background: p.hue,
                borderRadius: p.round ? "999px" : "1px",
                animationDelay: `${p.delay}ms`,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                "--rot": `${p.rot}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </span>
  );
}
