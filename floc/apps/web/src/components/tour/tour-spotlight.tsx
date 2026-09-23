"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { markTourSeen } from "@/app/trip/[id]/overview/actions";
import { Button, cx } from "@/components/system/ui";
import { tourStep, type TourStop } from "@floc/core/trip/tour";

/** In viewport coordinates, minus the header — see `TourSpotlight`. */
type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
};

const PAD = 3;
const CARD_GAP = 12;
const CARD_WIDTH = 352;
const CARD_ROOM = 180;
const EDGE = 16;

/** The sticky header owns the top of the screen; the tour starts under it. */
function headerBottom(): number {
  return document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
}

function rectOf(key: string): Rect | null {
  const el = document.querySelector(`[data-tour="${key}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // Why: the ring follows the target's own corners, so a pill gets a pill, not a box clipping its neighbour.
  const radius = Math.min(
    Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
    r.height / 2,
  );
  return {
    top: r.top - headerBottom() - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
    borderRadius: radius + PAD,
  };
}

function inView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return (
    r.top - PAD >= headerBottom() &&
    r.left >= 0 &&
    r.bottom <= window.innerHeight &&
    r.right <= window.innerWidth
  );
}

/** Where the lit target is, and whether the scroll to it has ended. */
function useTargetRect(key: string | null): {
  rect: Rect | null;
  settled: boolean;
} {
  const [rect, setRect] = useState<Rect | null>(null);
  const [settled, setSettled] = useState(false);

  useLayoutEffect(() => {
    if (!key) return;
    const el = document.querySelector(`[data-tour="${key}"]`);
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      setRect(rectOf(key));
      setSettled(true);
    };
    const follow = () => {
      if (done) setRect(rectOf(key));
    };

    setSettled(false);
    let fallback: number | undefined;
    if (el && !inView(el)) {
      window.addEventListener("scrollend", settle, {
        capture: true,
        once: true,
      });
      el.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });
      fallback = window.setTimeout(settle, 700);
    } else {
      settle();
    }
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, { passive: true });
    return () => {
      window.removeEventListener("scrollend", settle, { capture: true });
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow);
      window.clearTimeout(fallback);
    };
  }, [key]);

  return { rect: key ? rect : null, settled };
}

function cardStyle(rect: Rect | null): React.CSSProperties {
  if (!rect) {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }
  const width = Math.min(CARD_WIDTH, window.innerWidth - EDGE * 2);
  const centred = rect.left + rect.width / 2 - width / 2;
  const left = Math.min(
    Math.max(EDGE, centred),
    window.innerWidth - EDGE - width,
  );
  const below = rect.top + rect.height + CARD_GAP;
  return below + CARD_ROOM < window.innerHeight - headerBottom()
    ? { top: rect.top + rect.height + CARD_GAP, left }
    : { top: rect.top - CARD_GAP, left, transform: "translateY(-100%)" };
}

/**
 * The ring and card follow the target as the page scrolls, inside a layer that
 * starts below the sticky header so the tour never paints over it (#315).
 */
export function TourSpotlight({ stops }: { stops: TourStop[] }) {
  const [state, setState] = useState({ index: 0, done: stops.length === 0 });
  const [mounted, setMounted] = useState(false);
  const stop = state.done ? null : stops[state.index];
  const { rect, settled } = useTargetRect(stop?.key ?? null);

  useEffect(() => setMounted(true), []);

  const move = useCallback(
    (to: "next" | "back" | "skip") => {
      const next = tourStep(state, to, stops.length);
      setState(next);
      if (next.done) void markTourSeen();
    },
    [state, stops.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") move("skip");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  if (!stop || !mounted) return null;
  const last = state.index === stops.length - 1;
  const lit = settled && rect !== null;

  return createPortal(
    <>
      {/* Blocks the page, and dims it plainly while moving between stops. */}
      <div
        aria-hidden
        className={cx(
          "fixed inset-0 z-50 bg-ink/45 transition-[background-color] duration-150 motion-reduce:transition-none",
          lit && "bg-transparent",
        )}
      />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 overflow-hidden"
        style={{ top: headerBottom() }}
      >
        {rect ? (
          <div
            aria-hidden
            className={cx(
              "pointer-events-none absolute ring-2 ring-pen shadow-[0_0_0_9999px_color-mix(in_srgb,var(--ink)_45%,transparent)] transition-opacity duration-150 motion-reduce:transition-none",
              lit ? "opacity-100" : "opacity-0",
            )}
            style={rect}
          />
        ) : null}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="A quick tour"
          className={cx(
            "pointer-events-auto absolute w-[min(22rem,calc(100vw-2rem))] rounded-lg bg-sheet p-5 ring-1 ring-rule transition-opacity duration-150 motion-reduce:transition-none",
            settled ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          style={cardStyle(rect)}
        >
          <p className="typed">
            {state.index + 1} of {stops.length}
          </p>
          <h2 className="mt-1 font-display text-lg">{stop.title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{stop.line}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="ghost" onClick={() => move("skip")}>
              Skip
            </Button>
            <span className="ml-auto flex gap-2">
              {state.index > 0 ? (
                <Button onClick={() => move("back")}>Back</Button>
              ) : null}
              <Button variant="primary" onClick={() => move("next")} autoFocus>
                {last ? "Done" : "Next"}
              </Button>
            </span>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
