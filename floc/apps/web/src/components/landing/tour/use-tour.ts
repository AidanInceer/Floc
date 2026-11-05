import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import { stepSlide, swipeStep, wipeOrigin, wipeReach } from "@/lib/landing/tour";

const EASE = "cubic-bezier(0.2, 0.85, 0.3, 1)";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One trip page, seven features. A press (arrow, tab, key or swipe) sets `index` at once and plays the move:
 * a colour wipe grows from the control, the copy and page slide out, `shown` swaps to the new slide, the page slides back in.
 * `rested` is the colour the stage holds still once the wipe lands. No timer ever moves it on its own.
 */
export function useTour(count: number) {
  const stage = useRef<HTMLDivElement>(null);
  const wipe = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const shot = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [rested, setRested] = useState(0);
  const [moved, setMoved] = useState(false);
  const at = useRef(0);
  const stop = useRef<() => void>(() => {});
  const press = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((to: number, from: Element | null, dir: 1 | -1 = to > at.current ? 1 : -1) => {
    if (to === at.current) return;
    stop.current();
    at.current = to;
    setIndex(to);
    setMoved(true);
    const [s, w, t, p] = [stage.current, wipe.current, text.current, shot.current];
    if (!s || !w || !t || !p || reduced()) {
      setShown(to);
      setRested(to);
      return;
    }
    w.getAnimations().forEach((a) => a.cancel());
    const box = s.getBoundingClientRect();
    const origin = wipeOrigin(box, from?.getBoundingClientRect() ?? null);
    const reach = wipeReach(origin, box);
    const sweep = w.animate(
      [{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }, { clipPath: `circle(${reach}px at ${origin.x}px ${origin.y}px)` }],
      { duration: 950, easing: EASE, fill: "forwards" },
    );
    const exits = [t, p].map((el) =>
      el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-18 * dir}px)` }], { duration: 200, easing: "ease-in", fill: "forwards" }),
    );
    const swap = setTimeout(() => {
      setShown(to);
      exits.forEach((a) => a.cancel());
      p.animate(
        [{ opacity: 0, transform: `translate(${46 * dir}px, 10px) rotate(${1.4 * dir}deg)` }, { opacity: 1, transform: "none" }],
        { duration: 900, easing: EASE },
      );
    }, 210);
    stop.current = () => {
      clearTimeout(swap);
      exits.forEach((a) => a.cancel());
      setRested(at.current);
    };
    sweep.finished.then(() => { if (at.current === to) setRested(to); }).catch(() => {});
  }, []);

  useEffect(() => () => stop.current(), []);

  const step = useCallback((delta: number, from: Element | null) => go(stepSlide(at.current, delta, count), from, delta < 0 ? -1 : 1), [count, go]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    step(e.key === "ArrowRight" ? 1 : -1, null);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => { press.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const from = press.current;
    press.current = null;
    const by = from ? swipeStep(e.clientX - from.x, e.clientY - from.y) : 0;
    if (by) step(by, null);
  };

  return {
    refs: { stage, wipe, text, shot },
    index, shown, rested, moved, go, step,
    stageProps: { onKeyDown, onPointerDown, onPointerUp, onPointerCancel: () => { press.current = null; } },
  };
}
