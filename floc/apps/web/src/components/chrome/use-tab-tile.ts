"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from "react";

import { isPlainClick, tileHref } from "@/lib/motion/tab-tile";

/**
 * The trip tab bar's one tile (ADR-052): it sits behind the open tab's glyph and
 * slides to the tab you press, taking its colour on the way. Until it has a
 * place (before hydration) the open tab paints its own wash, as it always did.
 */
export function useTabTile(nav: RefObject<HTMLElement | null>, current: string | null) {
  const tile = useRef<HTMLSpanElement>(null);
  const slideEnd = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pressed, setPressed] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const target = tileHref(current, pressed);

  // A press is held until its page is the open one.
  useEffect(() => setPressed(null), [current]);

  const place = useCallback((jump: boolean) => {
    const el = tile.current;
    const icon = target ? nav.current?.querySelector<HTMLElement>(`a[href="${target}"] .trip-tab-icon`) : null;
    if (!el) return;
    el.hidden = !icon;
    if (!icon) return;
    if (jump) el.style.transition = "none";
    el.style.transform = `translate(${icon.offsetLeft}px, ${icon.offsetTop}px)`;
    // Why: the token, not its resolved colour, so a theme switch repaints the tile too.
    el.style.background = icon.closest("a")!.style.getPropertyValue("--section-wash");
    if (jump) {
      void el.offsetWidth;
      el.style.transition = "";
    } else {
      // Why: the colour moves only with a slide; a theme switch repaints the tile at once, like everything else.
      el.dataset.sliding = "";
      clearTimeout(slideEnd.current);
      slideEnd.current = setTimeout(() => delete el.dataset.sliding, 300);
    }
  }, [nav, target]);

  useLayoutEffect(() => {
    place(!placed);
    setPlaced(true);
  }, [place, placed]);

  // A wider screen shows the words and moves every glyph; the tile follows without sliding.
  // Why: one observer for the bar's life, reading the latest `place`; a new one per press fires at once and cut the slide.
  const latest = useRef(place);
  useEffect(() => {
    latest.current = place;
  }, [place]);
  useEffect(() => {
    const el = nav.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let first = true;
    const watch = new ResizeObserver(() => {
      if (first) first = false;
      else latest.current(true);
    });
    watch.observe(el);
    return () => watch.disconnect();
  }, [nav]);

  const press = (href: string) => (e: MouseEvent) => {
    if (isPlainClick(e) && href !== current) setPressed(href);
  };

  return { tile, placed, press, pressed };
}
