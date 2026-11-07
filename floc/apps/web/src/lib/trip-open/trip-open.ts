/**
 * Opening a trip from My trips, in two beats. The list sinks back while the trip loads and the top bar's own beads
 * join (BAR_HOLD_EVENT); then the Overview pours out of the bar onto its card (curtain.ts). Reduced motion, a new
 * tab or anything missing: a plain page change.
 */
import { BAR_HOLD_EVENT } from "@/lib/bar-fuse";

import { curtainAt, POUR_MS, type Box } from "./curtain";
import { gooLayer } from "./goo-layer";

const LEAVE_MS = 300;
// Why: a page that never arrives (an error, a redirect, a slow server) shows itself plainly rather than a blank screen.
const GIVE_UP_MS = 2500;

let pending: { href: string; timer: number; arrived?: boolean } | null = null;

const root = () => document.documentElement;
const state = (s: "leaving" | "waiting" | "pouring" | null) => {
  if (s) root().dataset.tripOpen = s;
  else delete root().dataset.tripOpen;
};
const hold = (on: boolean) => window.dispatchEvent(new CustomEvent(BAR_HOLD_EVENT, { detail: on }));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function barBox(): Box | null {
  const beads = [...(document.querySelector(".fuse-row")?.children ?? [])].filter((el) => el.tagName.toLowerCase() !== "svg");
  const boxes = beads.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0);
  if (boxes.length === 0) return null;
  const [left, top] = [Math.min(...boxes.map((b) => b.left)), Math.min(...boxes.map((b) => b.top))];
  return { x: left, y: top, w: Math.max(...boxes.map((b) => b.right)) - left, h: Math.max(...boxes.map((b) => b.height)) };
}

function run(ms: number, frame: (t: number) => void, done: () => void) {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    frame(t);
    if (t < 1) requestAnimationFrame(step);
    else done();
  };
  requestAnimationFrame(step);
}

function release() {
  if (pending) window.clearTimeout(pending.timer);
  pending = null;
  window.removeEventListener("popstate", release);
  state(null);
  hold(false);
  root().style.removeProperty("--trip-open-page");
  document.querySelector("main")?.style.removeProperty("transform-origin");
}

/** Called on a bar's click: start the first beat, then change page. */
export function openTrip(href: string, navigate: (href: string) => void) {
  if (reduced() || pending || !barBox()) {
    navigate(href);
    return;
  }
  document.querySelector("main")?.style.setProperty("transform-origin", `50% ${scrollY + innerHeight / 2}px`);
  state("leaving");
  hold(true);
  pending = { href, timer: window.setTimeout(release, LEAVE_MS + GIVE_UP_MS) };
  window.addEventListener("popstate", release);
  window.setTimeout(() => {
    if (pending?.href !== href) return;
    state("waiting");
    navigate(href);
  }, LEAVE_MS);
}

/** Called by the Overview once it is on screen: pour the page out of the bar onto `target`. */
export function arrive(target: Element, href: string) {
  // Why: React may run the Overview's effect twice; the second must not pour a second curtain.
  if (!pending || pending.arrived) return;
  const bar = barBox();
  if (pending.href !== href || !bar) {
    release();
    return;
  }
  window.clearTimeout(pending.timer);
  pending.arrived = true;
  const r = target.getBoundingClientRect();
  // Why: a card taller than the window lands at the window's foot; the page underneath carries on below.
  const card = { x: r.left, y: r.top, w: r.width, h: Math.min(r.height, innerHeight - r.top - 12) };
  const layer = gooLayer();
  state("pouring");
  run(
    POUR_MS,
    (t) => {
      const f = curtainAt(t, { bar, card });
      const c = f.card;
      const squashed = { x: c.x + (c.w - c.w * f.squash.sx) / 2, y: c.y + (c.h - c.h * f.squash.sy), w: c.w * f.squash.sx, h: c.h * f.squash.sy };
      layer.draw({ neck: f.neck, card: squashed });
      root().style.setProperty("--trip-open-page", String(f.page));
    },
    () => {
      layer.remove();
      release();
    },
  );
}
