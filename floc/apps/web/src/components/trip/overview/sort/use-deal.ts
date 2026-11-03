"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEAL_MS, type DealStart, dealEase, dealFrame, dealStarts, resumeAt } from "./deal";

const clamp = (x: number) => Math.min(1, Math.max(0, x));

// Why: one clock writes the height, every card and the chevron straight to the DOM, so they never drift apart and React does not render 60 times a second.
export function useDeal() {
  const drawer = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const chevron = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const run = useRef({ open: false, pos: 0, frame: 0, starts: [] as DealStart[] });

  const paint = useCallback((pos: number) => {
    const box = drawer.current, cards = list.current?.children;
    if (!box || !cards) return;
    const frame = dealFrame(pos, run.current.starts);
    box.style.height = `${frame.height}px`;
    box.parentElement?.toggleAttribute("data-dealt", pos > 0);
    frame.cards.forEach((c, i) => {
      const li = cards[i] as HTMLElement | undefined;
      if (!li) return;
      li.style.transform = c.y === 0 && c.sx === 1 ? "" : `translate3d(0, ${c.y}px, 0) scaleX(${c.sx})`;
      li.style.setProperty("--ink-o", c.ink.toFixed(3));
    });
    if (chevron.current) chevron.current.style.transform = `rotate(${180 * pos}deg)`;
  }, []);

  const settle = useCallback((opened: boolean) => {
    const box = drawer.current;
    run.current.frame = 0;
    if (!box) return;
    box.style.height = opened ? "auto" : "0px";
    box.style.overflow = opened ? "visible" : "";
    box.inert = !opened;
    box.style.visibility = opened ? "visible" : "hidden";
  }, []);

  const toggle = useCallback(() => {
    const box = drawer.current, ul = list.current;
    if (!box || !ul) return;
    const opening = !run.current.open;
    run.current.open = opening;
    setOpen(opening);
    cancelAnimationFrame(run.current.frame);
    box.inert = false;
    box.style.visibility = "visible";
    // Why: the cards travel from under the strip, above this box, so it must not clip them.
    box.style.overflow = "visible";
    const cards = [...ul.children] as HTMLElement[];
    cards.forEach((li, i) => { li.style.zIndex = String(cards.length - i); });
    run.current.starts = dealStarts(cards.map((li) => ({ top: li.offsetTop, height: li.offsetHeight, width: li.offsetWidth })));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      run.current.pos = opening ? 1 : 0;
      paint(run.current.pos);
      return settle(opening);
    }
    const ms = opening ? DEAL_MS.open : DEAL_MS.close;
    const t0 = performance.now() - resumeAt(opening, run.current.pos) * ms;
    const tick = (now: number) => {
      const t = clamp((now - t0) / ms);
      const e = dealEase(t);
      run.current.pos = opening ? e : 1 - e;
      paint(run.current.pos);
      if (t < 1) run.current.frame = requestAnimationFrame(tick);
      else settle(opening);
    };
    run.current.frame = requestAnimationFrame(tick);
  }, [paint, settle]);

  useEffect(() => {
    const state = run.current;
    return () => cancelAnimationFrame(state.frame);
  }, []);

  return { open, toggle, drawer, list, chevron };
}
