// The Explore page around the picks, drawn by eye from the live site: top bar, the globe, All trips with its rail and tiles.
import { esc } from "/_house/kit/trip-frame.mjs";
import { LISTINGS as RAW } from "./listings.js";

// Explore lists Asia first, as the live page does.
const ORDER = ["Asia", "Europe", "Africa", "Americas", "Oceania"];
export const LISTINGS = [...RAW].sort((a, b) => ORDER.indexOf(a.region) - ORDER.indexOf(b.region));

export const MON = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const TODAY = 11;
export const YEAR = Array.from({ length: 12 }, (_, i) => ((TODAY - 1 + i) % 12) + 1);
export const SEASON = [12, 1, 2];
export const windowName = (ms) => (ms.length === 1 ? MONTH[ms[0]] : `${MONTH[ms[0]]} to ${MONTH[ms[ms.length - 1]]}`);

const REGION_TONE = { Europe: "blue", Africa: "yellow", Asia: "red", Americas: "green", Oceania: "pen" };
export const toneOf = (t) => REGION_TONE[t.region];

/** Every top pick for the window, regions taken in turn, shortest season first; at most two a region, nine in all. */
export function allPicksFor(months, cap = 9, perRegion = 2) {
  const fit = LISTINGS.filter((t) => months.every((m) => t.months.includes(m)))
    .sort((a, b) => a.months.length - b.months.length || a.id.localeCompare(b.id));
  const byRegion = new Map();
  for (const t of fit) {
    if (!byRegion.has(t.region)) byRegion.set(t.region, []);
    byRegion.get(t.region).push(t);
  }
  const out = [];
  for (let round = 0; round < perRegion && out.length < cap; round++) {
    for (const list of byRegion.values()) if (list[round] && out.length < cap) out.push(list[round]);
  }
  return out;
}

export const g = (d, cls = "g") => `<svg class="${cls}" viewBox="0 0 14 14" aria-hidden="true">${d}</svg>`;
export const GLYPH = {
  heart: '<path d="M7 12.2S1.8 8.8 1.8 5.1A2.9 2.9 0 0 1 7 3.6a2.9 2.9 0 0 1 5.2 1.5c0 3.7-5.2 7.1-5.2 7.1Z"/>',
  arrow: '<path d="M2.4 7h9.2M8 3.4 11.6 7 8 10.6"/>',
  search: '<circle cx="6.2" cy="6.2" r="3.8"/><path d="m9 9 3 3"/>',
  filter: '<path d="M2 4h10M4 7h6M6 10h2"/>',
  chev: '<path d="M3.5 5.5 7 9l3.5-3.5"/>',
  globe: '<circle cx="7" cy="7" r="5.2"/><path d="M1.8 7h10.4M7 1.8c1.6 1.6 2.3 3.3 2.3 5.2S8.6 10.6 7 12.2M7 1.8C5.4 3.4 4.7 5.1 4.7 7s.7 3.6 2.3 5.2"/>',
  plane: '<path d="M12.2 1.8 1.8 6.1l4.1 1.5 1.5 4.1Z"/><path d="M5.9 7.6 8.4 5.1"/>',
  people: '<circle cx="5.2" cy="5" r="2"/><path d="M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3"/><path d="M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8"/>',
  check: '<path d="M2.6 7.4 5.6 10.4 11.4 4"/>',
  sun: '<circle cx="7" cy="7" r="2.6"/><path d="M7 1.4v1.4M7 11.2v1.4M1.4 7h1.4M11.2 7h1.4M3 3l1 1M10 10l1 1M3 11l1-1M10 4l1-1"/>',
  match: '<path d="M7 12.1C3.3 9.4 1.5 7.5 1.5 5.4A3.2 3.2 0 0 1 7 3.5a3.2 3.2 0 0 1 5.5 1.9c0 2.1-1.8 4-5.5 6.7Z"/>',
  cheap: '<path d="M3 10.5v-8M1.2 4.3 3 2.5l1.8 1.8M7 4h2M7 7h3.5M7 10h5"/>',
  dear: '<path d="M3 3.5v8m-1.8-1.8L3 11.5l1.8-1.8M7 4h5M7 7h3.5M7 10h2"/>',
  short: '<path d="M2 7h4M2 4.5v5M10 7h2"/>',
  long: '<path d="M2 7h10M2 4.5v5M12 4.5v5"/>',
};

GLYPH.season = GLYPH.sun;

export const money = (minor) => "£" + (minor / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const nightsOf = (n) => `${n} ${n === 1 ? "night" : "nights"}`;

export const saved = new Set(["mexico-yucatan-loop", "hanoi-to-bangkok"]);
export const heart = (t, cls = "heart") =>
  `<button type="button" class="${cls}" data-save="${t.id}" aria-pressed="${saved.has(t.id)}" aria-label="${saved.has(t.id) ? "Saved" : "Save"}: ${esc(t.title)}">${g(GLYPH.heart)}</button>`;

// A seeded blob of land under the route, standing in for the live tile's country outline.
function rand(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}
function blob(cx, cy, r, seed, n = 9) {
  const rnd = rand(seed);
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 0.72 + rnd() * 0.5;
    return [cx + Math.cos(a) * r * k * 1.25, cy + Math.sin(a) * r * k];
  });
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (!i) d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

/** The tile's map: land in the region's pastel, the route in ink. */
export function tileMap(t, w = 240, h = 170) {
  const lat0 = t.stops.reduce((a, s) => a + s[1], 0) / t.stops.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xs = t.stops.map((s) => s[2] * k), ys = t.stops.map((s) => -s[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, (maxY - minY) * 1.4, 0.8);
  const scale = (w * 0.5) / span;
  const ox = w / 2 - ((minX + maxX) / 2) * scale, oy = h / 2 - ((minY + maxY) / 2) * scale;
  const pts = t.stops.map((s, i) => [xs[i] * scale + ox, ys[i] * scale + oy]);
  const line = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
  const dots = pts.map((q) => `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3.2"/>`).join("");
  return `<svg class="tile-map tone-${toneOf(t)}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path class="land" d="${blob(w / 2, h / 2 + 6, w * 0.46, t.id)}"/><path class="route" d="${line}"/><g class="stops">${dots}</g></svg>`;
}

/** One listing as the live tile: map, country tag, title, figures, tags, More like this. */
export function tile(t, { mark = "", extra = "", cls = "", lite = false } = {}) {
  if (lite) {
    return `<li class="tile ${cls}"><a class="tile-link" href="#${t.id}"><span class="tile-art">${tileMap(t)}</span>
      <span class="tile-body lite"><span class="tag tone-${toneOf(t)}">${esc(t.country)}</span><b class="tile-title">${esc(t.title)}</b>
      <span class="figs">${nightsOf(t.nights)} · ${money(t.price)}</span></span></a>${mark}${heart(t, "heart heart-tile")}</li>`;
  }
  return `<li class="tile ${cls}"><a class="tile-link" href="#${t.id}">
      <span class="tile-art">${tileMap(t)}</span>
      <span class="tile-body"><span class="tag tone-${toneOf(t)}">${esc(t.country)}</span>
      <b class="tile-title">${esc(t.title)}</b>
      <span class="figs">${nightsOf(t.nights)} · ${money(t.price)}</span>
      ${extra}
      <span class="chips">${t.tags.slice(0, 2).map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</span></span></a>
    ${mark}${heart(t, "heart heart-tile")}
    <span class="tile-foot"><button type="button" class="link">More like this</button></span></li>`;
}

export const ownTile = () => `<li class="tile own"><span class="tag dashed">Anywhere</span><b class="tile-title">Your own</b>
  <span class="own-text">No dates, no destination. See who agrees.</span><button type="button" class="btn-sm">Start blank</button></li>`;

export function topBar() {
  return `<header class="topbar"><span class="pill wordmark"><svg viewBox="0 0 22 14" aria-hidden="true"><path d="M1.5 11 6 4.5l3.5 5L13 5l3.5 4.5L20.5 3"/></svg>floc<b>.</b></span>
    <nav class="pill navs" aria-label="Main"><span class="nav on">${g(GLYPH.globe)}<span>Explore</span></span><span class="nav">${g(GLYPH.plane)}<span>Trips</span></span><span class="nav">${g(GLYPH.people)}<span>Friends</span></span></nav>
    <span class="pill acct"><span class="avatar who-3" style="width:24px;height:24px;font-size:10px">Ai</span><span class="acct-name">Aidan</span>${g(GLYPH.chev)}</span></header>`;
}

// Orthographic globe, as the live one: a pastel sphere, every listing a pin.
export function globe({ lon0 = 40, lat0 = 8, r = 520, w = 1280, h = 360, cx = w / 2, cy = 360, highlight = [], arc = null } = {}) {
  const rad = (d) => (d * Math.PI) / 180;
  const project = (lat, lon) => {
    const φ = rad(lat), λ = rad(lon - lon0), φ0 = rad(lat0);
    const cosc = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ);
    return { x: cx + r * Math.cos(φ) * Math.sin(λ), y: cy - r * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ)), seen: cosc > 0.05 };
  };
  const grid = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 6) { const p = project(lat, lon); if (p.seen) pts.push(p); else if (pts.length) { grid.push(pts.splice(0)); } }
    if (pts.length) grid.push(pts);
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = [];
    for (let lat = -80; lat <= 80; lat += 5) { const p = project(lat, lon); if (p.seen) pts.push(p); else if (pts.length) grid.push(pts.splice(0)); }
    if (pts.length) grid.push(pts);
  }
  const lines = grid.filter((l) => l.length > 1).map((l) => `<path d="${l.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("")}"/>`).join("");
  const pins = LISTINGS.map((t) => {
    const p = project(t.stops[0][1], t.stops[0][2]);
    if (!p.seen) return "";
    const hot = highlight.includes(t.id);
    return `<circle class="pin${hot ? " hot tone-" + toneOf(t) : ""}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${hot ? 7 : 4.5}"/>`;
  }).join("");
  let arcPath = "";
  if (arc) {
    const p = project(arc[1], arc[2]);
    if (p.seen) arcPath = `
      <g class="callout" transform="translate(${(p.x + 12).toFixed(1)} ${(p.y - 11).toFixed(1)})"><rect width="${arc[0].length * 7 + 16}" height="22" rx="6"/><text x="8" y="15">${esc(arc[0])}</text></g>`;
  }
  return `<svg class="globe" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <circle class="sphere" cx="${cx}" cy="${cy}" r="${r}"/><g class="grat">${lines}</g>${arcPath}<g>${pins}</g></svg>`;
}

const monthCounts = () => Array.from({ length: 12 }, (_, i) => LISTINGS.filter((t) => t.months.includes(i + 1)).length);
const regionCounts = () => ["Europe", "Africa", "Asia", "Americas", "Oceania"].map((r) => [r, LISTINGS.filter((t) => t.region === r).length]);

/** The filter rail as on the live site; `months` ticks the Dates facet. */
export function rail(months = []) {
  const counts = monthCounts();
  const bars = [2, 9, 12, 3, 0, 1, 2, 2, 3, 2, 2, 1, 1, 0, 1].map((n) => `<i style="height:${4 + n * 3}px"></i>`).join("");
  return `<aside class="rail" aria-label="Filters"><div class="rail-head"><h3>Filters</h3><button type="button" class="link" data-clear>Clear all</button></div>
    <p class="rail-group typed">Must fit</p>
    <div class="facet"><div class="facet-title">Where ${g(GLYPH.chev)}</div><div class="fchips"><span class="fchip on">Anywhere</span>${regionCounts().map(([r, n]) => `<span class="fchip">${r} <span class="nums">${n}</span></span>`).join("")}</div></div>
    <div class="facet"><div class="facet-title">Dates ${g(GLYPH.chev)}</div><div class="mgrid">${MON.slice(1).map((m, i) => `<button type="button" class="mcell${months.includes(i + 1) ? " on" : ""}" data-month="${i + 1}" aria-pressed="${months.includes(i + 1)}"><b>${m}</b><span class="nums">${counts[i]}</span></button>`).join("")}</div>
      <span class="hint">Trips in season. Pick every month you could go.</span></div>
    <div class="facet"><div class="facet-title">Duration ${g(GLYPH.chev)}</div><div class="hbars">${bars}</div><div class="range"><span class="knob"></span><span class="knob"></span></div><div class="range-words typed"><span>Any length</span><span>${LISTINGS.length} trips</span></div></div>
    <div class="facet last"><div class="facet-title">Price ${g(GLYPH.chev)}</div></div></aside>`;
}

export function sortPicker(on = "match", extra = []) {
  const keys = [...extra, ["match", "Best match"], ["cheap", "Cheapest first"], ["dear", "Dearest first"], ["short", "Shortest first"], ["long", "Longest first"]];
  return `<div class="sorts" role="radiogroup" aria-label="Sort">${keys.map(([k, name]) => `<button type="button" role="radio" data-sort="${k}" aria-checked="${on === k}" title="${name}" aria-label="${name}">${g(GLYPH[k])}</button>`).join("")}</div>`;
}

export function allHead(sort) {
  return `<div class="all-head"><h2 class="all-title">All trips</h2><div class="all-tools"><label class="search">${g(GLYPH.search)}<input type="search" aria-label="Search trips"></label>${sort}</div></div>`;
}
export const finderBar = (n) => `<div class="fbar"><b class="nums">${n} trips</b><button type="button" class="filters-btn typed">${g(GLYPH.filter)}Filters</button></div>`;

export const moreButton = (n) => `<button type="button" class="more typed">Show ${n} more ${g(GLYPH.chev)}</button>`;
