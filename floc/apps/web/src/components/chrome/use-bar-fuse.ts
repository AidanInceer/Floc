"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

import {
  foldAmount,
  joinStep,
  nextJoined,
  wantJoined,
  BAR_HOLD_EVENT,
  restGap,
  scrollProgress,
  skinPath,
  splitStep,
  type Pull,
} from "@/lib/bar-fuse";

// useLayoutEffect warns during SSR; on the server there is nothing to measure.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const JOIN_MS = 360;
const SPLIT_MS = 300;
const MIN_FOLD = 2;
const FOLDED_PAD = 6;

type Fold = { el: HTMLElement; inner: HTMLElement | null; width: number; gap: number };
type Pad = { el: HTMLElement; start: number };

const px = (value: string) => Number.parseFloat(value) || 0;

function tween(ms: number, run: (k: number) => void, done?: () => void): () => void {
  const start = performance.now();
  let id = 0;
  const tick = (now: number) => {
    const k = Math.min(1, (now - start) / ms);
    run(k);
    if (k < 1) id = requestAnimationFrame(tick);
    else done?.();
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

function pulse(row: HTMLElement, name: string, ms: number) {
  if (row.querySelector('[data-open="true"]')) return;
  row.classList.remove(name);
  void row.offsetWidth;
  row.classList.add(name);
  window.setTimeout(() => row.classList.remove(name), ms);
}

type Layout = { folds: Fold[]; pads: Pad[]; base: number; radius: number };
const NO_LAYOUT: Layout = { folds: [], pads: [], base: 0, radius: 0 };

const beadsOf = (row: HTMLElement, svg: SVGSVGElement) =>
  [...row.children].filter((c): c is HTMLElement => c !== svg && c instanceof HTMLElement);

function clearLayout(row: HTMLElement, { folds, pads }: Layout) {
  for (const { el } of folds) el.removeAttribute("style");
  for (const { el } of pads) el.style.removeProperty("padding-right");
  row.style.removeProperty("column-gap");
}

function readLayout(row: HTMLElement, svg: SVGSVGElement): Layout {
  const found = [...row.querySelectorAll<HTMLElement>("[data-fuse]")].filter((el) => el.offsetWidth > MIN_FOLD);
  const parents = new Set(found.map((el) => el.parentElement).filter((el): el is HTMLElement => el !== null));
  return {
    base: px(getComputedStyle(row).columnGap),
    radius: px(getComputedStyle(beadsOf(row, svg)[0] ?? row).borderTopLeftRadius),
    folds: found.map((el) => ({
      el,
      inner: el.querySelector<HTMLElement>("[data-fuse-in]"),
      width: el.offsetWidth,
      gap: px(getComputedStyle(el.parentElement ?? el).columnGap),
    })),
    pads: [...parents].map((el) => ({ el, start: px(getComputedStyle(el).paddingRight) })),
  };
}

function foldTo({ folds, pads }: Layout, t: number) {
  for (const { el, inner, width, gap } of folds) {
    el.style.width = `${width * (1 - t)}px`;
    el.style.marginLeft = `${-gap * t}px`;
    el.style.opacity = String(Math.max(0, 1 - t * 1.6));
    el.style.flexShrink = "0";
    el.style.overflow = "hidden";
    if (inner) inner.style.transform = `translateX(${-width * t}px)`;
  }
  for (const { el, start } of pads) el.style.paddingRight = `${start + (Math.min(start, FOLDED_PAD) - start) * t}px`;
}

function drawSkin(row: HTMLElement, svg: SVGSVGElement, path: Element, radius: number, neck: number) {
  const boxes = beadsOf(row, svg).map((b) => ({ x: b.offsetLeft + 1, w: b.offsetWidth - 2 }));
  const height = row.offsetHeight;
  svg.setAttribute("width", String(row.offsetWidth));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${row.offsetWidth} ${height}`);
  path.setAttribute("transform", "translate(0 1)");
  path.setAttribute("d", skinPath(boxes, height - 2, radius - 1, boxes.slice(1).map(() => neck)));
}

/** Eases the words' fold from `from` back to where the scroll has it, once a hold lets go. */
function easeFold(from: number, to: () => number, set: (t: number) => void, done: () => void) {
  return tween(SPLIT_MS, (k) => set(from + (to() - from) * k), done);
}

// Why: scroll sets how far the words have folded; the join plays once on crossing the mark, so the scroll is never hijacked.
export function useBarFuse(rowRef: RefObject<HTMLElement | null>, svgRef: RefObject<SVGSVGElement | null>) {
  useIsoLayoutEffect(() => {
    const row = rowRef.current;
    const svg = svgRef.current;
    const path = svg?.firstElementChild;
    if (!row || !svg || !path) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let layout = NO_LAYOUT;
    let p = 0;
    let t = 0;
    let joined = false;
    let held = false;
    // Why: a trip opening resets the scroll mid-hold; the words keep their fold until the hold lets go, then ease back.
    let heldFold: number | null = null;
    let easing = false;
    let unfold = () => {};
    let busy = false;
    let pull: Pull = { gap: 0, neck: 0 };
    let stop = () => {};
    let frame = 0;

    const measure = () => {
      clearLayout(row, layout);
      layout = readLayout(row, svg);
    };

    const paint = () => {
      foldTo(layout, t);
      row.style.columnGap = `${pull.gap}px`;
      drawSkin(row, svg, path, layout.radius, pull.neck);
    };

    const rest = () => ({ gap: restGap(p, layout.base), neck: 0 });
    const settled = (): Pull => (joined ? { gap: 0, neck: 1 } : rest());

    const run = (to: boolean) => {
      stop();
      joined = to;
      busy = true;
      const from = pull;
      const target = rest();
      const done = () => {
        busy = false;
        pulse(row, to ? "fuse-settle" : "fuse-plip", to ? 420 : 360);
      };
      stop = tween(
        to ? JOIN_MS : SPLIT_MS,
        (k) => {
          pull = to ? joinStep(k, from) : splitStep(k, from, target.gap);
          paint();
        },
        done,
      );
    };

    const update = () => {
      frame = 0;
      p = scrollProgress(window.scrollY);
      t = heldFold ?? (easing ? t : foldAmount(p));
      if (reduce.matches) {
        stop();
        busy = false;
        joined = wantJoined(joined, p, held);
        t = joined ? 1 : 0;
        pull = settled();
      } else if (wantJoined(joined, p, held) !== joined) {
        run(!joined);
      } else if (!busy) {
        pull = settled();
      }
      paint();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const relayout = () => {
      measure();
      update();
    };

    row.dataset.fuse = "on";
    measure();
    p = scrollProgress(window.scrollY);
    joined = nextJoined(false, p);
    pull = settled();
    update();

    // Why: a longer name or a new count changes what folds; style writes are attributes, so they never wake this.
    const watch = new MutationObserver(relayout);
    watch.observe(row, { childList: true, subtree: true, characterData: true });
    window.addEventListener("scroll", schedule, { passive: true });
    const hold = (e: Event) => {
      const on = (e as CustomEvent<boolean>).detail === true;
      if (on && !held) heldFold = t;
      if (!on && heldFold !== null) {
        unfold();
        unfold = easeFold(heldFold, () => foldAmount(p), (v) => ((t = v), paint()), () => (easing = false));
        [heldFold, easing] = [null, true];
      }
      held = on;
      update();
    };
    window.addEventListener(BAR_HOLD_EVENT, hold);
    window.addEventListener("resize", relayout);
    reduce.addEventListener("change", update);
    void document.fonts?.ready.then(relayout);
    return () => {
      stop();
      cancelAnimationFrame(frame);
      watch.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener(BAR_HOLD_EVENT, hold);
      unfold();
      window.removeEventListener("resize", relayout);
      reduce.removeEventListener("change", update);
      clearLayout(row, layout);
      delete row.dataset.fuse;
      path.removeAttribute("d");
      path.removeAttribute("transform");
    };
  }, [rowRef, svgRef]);
}
