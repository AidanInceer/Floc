"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { markTourSeen } from "@/app/trip/[id]/overview/actions";
import { Button } from "@/components/system/ui";
import { tourStep, type TourStop } from "@floc/core/trip/tour";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 6;
const CARD_GAP = 12;

function rectOf(key: string): Rect | null {
  const el = document.querySelector(`[data-tour="${key}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

/** The spotlight follows its target through scroll and resize. */
function useTargetRect(key: string | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!key) return;
    document
      .querySelector(`[data-tour="${key}"]`)
      ?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    const update = () => setRect(rectOf(key));
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    // Why: smooth scrolling moves the target after this runs.
    const settle = window.setTimeout(update, 400);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.clearTimeout(settle);
    };
  }, [key]);

  return key ? rect : null;
}

function cardStyle(rect: Rect | null): React.CSSProperties {
  if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  const below = rect.top + rect.height + CARD_GAP;
  const left = Math.min(Math.max(16, rect.left), window.innerWidth - 16 - 352);
  return below + 180 < window.innerHeight
    ? { top: below, left: Math.max(16, left) }
    : { bottom: window.innerHeight - rect.top + CARD_GAP, left: Math.max(16, left) };
}

export function TourSpotlight({ stops }: { stops: TourStop[] }) {
  const [state, setState] = useState({ index: 0, done: stops.length === 0 });
  const stop = state.done ? null : stops[state.index];
  const rect = useTargetRect(stop?.key ?? null);

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

  if (!stop) return null;
  const last = state.index === stops.length - 1;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="A quick tour">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-lg ring-2 ring-pen shadow-[0_0_0_9999px_color-mix(in_srgb,var(--ink)_45%,transparent)] transition-all duration-200 motion-reduce:transition-none"
          style={rect}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-ink/45" />
      )}
      <div
        className="fixed w-[min(22rem,calc(100vw-2rem))] rounded-lg bg-sheet p-5 ring-1 ring-rule"
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
            {state.index > 0 ? <Button onClick={() => move("back")}>Back</Button> : null}
            <Button variant="primary" onClick={() => move("next")} autoFocus>
              {last ? "Done" : "Next"}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
