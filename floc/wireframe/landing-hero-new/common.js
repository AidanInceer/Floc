// Shared bits for the four hero takes: the live headline copy, the Sicily sample trip, a hand-drawn Sicily outline. Throwaway.
import { ico, face, group } from "/_house/switcher.js";
export { ico, face, group };

export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const narrow = () => innerWidth <= 720;
export const fine = () => matchMedia("(pointer: fine)").matches;
export const people = Object.fromEntries(group.map((p) => [p.name, p]));
export const you = { name: "You", tone: 5 };

export const WORDS = ["started.", "shared.", "taking shape.", "sorted."];

export const STOPS = [
  { name: "Palermo", nights: 2, tone: "blue", lat: 38.1157, lng: 13.3615 },
  { name: "Cefalù", nights: 1, tone: "green", lat: 38.0392, lng: 14.023 },
  { name: "Taormina", nights: 2, tone: "yellow", lat: 37.8516, lng: 15.2853 },
  { name: "Syracuse", nights: 2, tone: "red", lat: 37.0755, lng: 15.2866 },
];

const LEGS = {
  "Palermo|Cefalù": ["train", "1h"], "Cefalù|Taormina": ["train", "2h 40"], "Taormina|Syracuse": ["car", "1h 30"],
  "Palermo|Taormina": ["car", "3h"], "Palermo|Syracuse": ["car", "3h 10"], "Cefalù|Syracuse": ["car", "2h 50"],
};
export const leg = (a, b) => LEGS[`${a}|${b}`] || LEGS[`${b}|${a}`];

// Fri 12 June 2026 is day 0.
export function day(i) {
  const d = new Date(2026, 5, 12 + i);
  return { wd: d.toLocaleDateString("en-GB", { weekday: "short" }), n: d.getDate(), month: d.toLocaleDateString("en-GB", { month: "long" }) };
}

export function headline(cls = "") {
  const h = document.createElement("h1");
  h.className = `hn-h1 ${cls}`;
  h.innerHTML = `<span class="hn-sr">Trip planning, sorted.</span><span aria-hidden="true">Trip planning,</span> <span class="hn-word" aria-hidden="true"></span>`;
  const w = h.querySelector(".hn-word");
  let cur = -1;
  let timer;
  const settle = () => { w.classList.remove("typing"); w.classList.toggle("hl-green", cur === 3); };
  function set(i, instant) {
    if (i === cur) return;
    cur = i;
    clearInterval(timer);
    const target = WORDS[i];
    w.classList.remove("hl-green");
    if (instant || reduce) { w.textContent = target; settle(); return; }
    w.classList.add("typing");
    let t = w.textContent;
    timer = setInterval(() => {
      if (t && !target.startsWith(t)) t = t.slice(0, -1);
      else if (t.length < target.length) t = target.slice(0, t.length + 1);
      else { clearInterval(timer); settle(); }
      w.textContent = t;
    }, 42);
  }
  return { el: h, set, stop: () => clearInterval(timer) };
}

export const lede = () =>
  `<p class="hn-lede">Keep the destination, dates, route and costs in one place. Plan on your own, or with everyone who&rsquo;s coming.</p>`;
export const ctas = () =>
  `<div class="hn-ctas"><a class="pill-btn" href="#">Start a trip — free</a><a class="pill-btn ghost" href="#">See example trips</a></div>`;

// One clock per variant: every timer goes through it, so switching variant cancels the lot.
export function clock() {
  const ids = new Set();
  return {
    at(ms, fn) { const id = setTimeout(() => { ids.delete(id); fn(); }, reduce ? 0 : ms); ids.add(id); },
    stop() { ids.forEach(clearTimeout); ids.clear(); },
  };
}

// Sicily, by hand from coastal towns. viewBox 0 0 300 200, equirectangular, corrected for latitude.
const COAST = [
  [37.8, 12.43], [38.02, 12.5], [38.18, 12.73], [38.03, 12.9], [38.22, 13.3], [38.12, 13.37], [38.11, 13.54],
  [37.98, 13.7], [38.04, 14.02], [38.16, 14.75], [38.27, 15.24], [38.27, 15.65], [38.19, 15.56], [37.85, 15.29],
  [37.5, 15.09], [37.23, 15.22], [37.07, 15.29], [36.69, 15.14], [36.73, 14.85], [37.07, 14.25], [37.1, 13.94],
  [37.27, 13.58], [37.51, 13.08], [37.65, 12.59],
];
export const proj = (lat, lng) => [((lng - 12.3) / 3.5) * 300, ((38.45 - lat) / 1.85) * 200];
const pt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

export function sicily({ cls = "", labels = true } = {}) {
  const coast = `M${COAST.map((c) => pt(proj(...c))).join(" L")} Z`;
  const ps = STOPS.map((s) => proj(s.lat, s.lng));
  let route = `M${pt(ps[0])}`;
  for (let i = 1; i < ps.length; i++) {
    const [x0, y0] = ps[i - 1];
    const [x1, y1] = ps[i];
    route += ` Q${pt([(x0 + x1) / 2 + (y1 - y0) * 0.18, (y0 + y1) / 2 - (x1 - x0) * 0.18])} ${pt(ps[i])}`;
  }
  const dots = STOPS.map((s, i) => {
    const [x, y] = ps[i];
    const right = i < 2;
    const lx = right ? x + 9 : x - 9;
    const ly = i === 0 || i === 2 ? y - 10 : i === 1 ? y + 18 : y + 4;
    return `<circle class="sc-dot tone-${s.tone}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>` +
      (labels ? `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${right ? "start" : "end"}">${s.name}</text>` : "");
  }).join("");
  return `<svg class="sc ${cls}" viewBox="-10 -10 320 215" aria-hidden="true"><path class="sc-land" d="${coast}"/><path class="sc-route" d="${route}" pathLength="1"/>${dots}</svg>`;
}

const MODES = {
  flight: ["M11.03 2.97C11.42 3.36 11.35 3.99 10.85 4.49L8.66 6.68L9.93 11.49L9.09 12.34L6.96 8.38L5.27 10.08L5.48 11.7L4.84 12.34L3.68 10.32L1.66 9.16L2.3 8.52L3.92 8.73L5.62 7.04L1.66 4.91L2.51 4.07L7.32 5.34L9.51 3.15C10.01 2.65 10.64 2.58 11.03 2.97Z"],
  train: ["M4.8 1.8h4.4A1.8 1.8 0 0 1 11 3.6v4.8a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 8.4V3.6a1.8 1.8 0 0 1 1.8-1.8Z", "M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"],
  car: ["M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10", "M4.4 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9.6 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"],
};
// The house travel glyphs (components/explore/route/mode-paths.ts): flight is an aeroplane, never a paper plane.
export const mode = (m) => `<svg class="ico" viewBox="0 0 14 14" aria-hidden="true">${MODES[m].map((d) => `<path d="${d}"/>`).join("")}</svg>`;

// Round 2: the word changes by a slow cross-fade, never typed.
export function calmHeadline(cls = "") {
  const h = document.createElement("h1");
  h.className = `hn-h1 calm ${cls}`;
  h.innerHTML = `<span class="hn-sr">Trip planning, sorted.</span><span aria-hidden="true">Trip planning,</span> <span class="hn-word" aria-hidden="true"></span>`;
  const w = h.querySelector(".hn-word");
  let cur = -1;
  let id;
  function set(i, instant) {
    if (i === cur) return;
    cur = i;
    clearTimeout(id);
    const swap = () => { w.textContent = WORDS[i]; w.classList.toggle("hl-green", i === 3); w.classList.remove("out"); };
    if (instant || reduce || !w.textContent) return swap();
    w.classList.add("out");
    id = setTimeout(swap, 380);
  }
  return { el: h, set, stop: () => clearTimeout(id) };
}

export function onView(el, fn, threshold = 0.3) {
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold });
  io.observe(el);
  return () => io.disconnect();
}

// Round 3: the app's own 1:50m outline (public/land-50m.json, packed by packLand), for Sicily and the toe of Italy beside it.
let fineLand = null;
export function fineSicily(root) {
  fineLand ??= fetch("/landing-hero-new/land-50m.json").then((r) => r.json()).then((packed) => (packed.IT || []).map((flat) => {
    const ring = [];
    let [x, y] = [0, 0];
    for (let i = 0; i + 1 < flat.length; i += 2) { x += flat[i]; y += flat[i + 1]; ring.push([y / 100, x / 100]); }
    return ring;
  }).filter((ring) => ring.some(([lat, lng]) => lat > 36.3 && lat < 38.8 && lng > 12 && lng < 16.4))
    .map((ring) => `M${ring.map((c) => pt(proj(...c))).join(" L")} Z`).join(" "));
  return fineLand.then((d) => root.querySelectorAll(".r3-map .sc-land, .ex-map .ex-land").forEach((p) => p.setAttribute("d", d)));
}
