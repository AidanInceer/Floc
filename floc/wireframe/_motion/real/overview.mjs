// The live Overview top, drawn by eye from components/trip/: the sorted bar, the route map with the trip card over it, and the people row.
import { glyph, button, PEOPLE } from "./shared.mjs";
import { avatar } from "/_house/kit/trip-frame.mjs";

// Equirectangular, scaled for 39°N; one unit is about 3 km.
const P = (lon, lat) => [Math.round((lon + 14.5) * 28 * 10) / 10, Math.round((41.1 - lat) * 36 * 10) / 10];
const COAST = [
  [-8.9, 42.3], [-8.87, 41.87], [-8.78, 41.4], [-8.67, 41.15], [-8.65, 40.64], [-8.87, 40.13], [-9.07, 39.6], [-9.37, 39.36],
  [-9.42, 38.95], [-9.5, 38.78], [-9.42, 38.69], [-9.2, 38.69], [-9.0, 38.75], [-8.98, 38.66], [-9.22, 38.43], [-8.9, 38.48],
  [-8.8, 38.2], [-8.87, 37.95], [-8.8, 37.5], [-8.92, 37.02], [-8.67, 37.08], [-8.2, 37.08], [-7.93, 37.0], [-7.4, 37.18],
  [-6.95, 37.17], [-6.4, 36.8], [-6.25, 36.5], [-6.0, 36.2], [-5.6, 36.0], [-5.35, 36.15], [-4.4, 36.7], [-3.0, 36.75], [-2.2, 36.7], [-1.6, 37.3],
  [-0.98, 37.6], [-0.48, 38.34], [0.23, 38.73], [-0.33, 39.47], [-0.04, 39.98], [0.85, 40.7], [1.25, 41.1], [2.17, 41.38], [3.2, 41.9], [3.2, 43],
];
const AFRICA = [[-6.6, 34.5], [-6.2, 35.6], [-5.8, 35.79], [-5.3, 35.9], [-4.5, 35.2], [-2.9, 35.2], [-1.9, 35.1], [0, 35.8], [3.2, 36.8], [3.2, 34.5]];
const shape = (pts) => `M${pts.map((c) => P(...c).join(" ")).join(" L")} Z`;
export const LAND = `${shape([...COAST, [-8.9, 43]])} ${shape(AFRICA)}`;
const BORDER = [[-8.87, 41.87], [-8.2, 42.1], [-6.6, 41.95], [-6.2, 41.6], [-6.9, 41.0], [-6.85, 40.3], [-7.0, 39.67], [-7.5, 39.6], [-7.0, 38.9], [-7.3, 38.4], [-7.0, 38.0], [-7.5, 37.5], [-7.4, 37.18]];
export const BORDER_PATH = `M${BORDER.map((c) => P(...c).join(" ")).join(" L")}`;

export const STOPS = [
  { name: "Lisbon", lon: -9.14, lat: 38.72, sub: "3 nights", mark: "start", dx: 8, dy: -6 },
  { name: "Lagos", lon: -8.67, lat: 37.1, sub: "3 nights", mark: "mid", dx: -7, dy: -3, end: true },
  { name: "Faro", lon: -7.93, lat: 37.02, sub: "Fly home", mark: "end", dx: 7, dy: 12 },
];
const [L, G, F] = STOPS.map((s) => P(s.lon, s.lat));
export const LEGS = [
  { d: `M${L[0]} ${L[1]} C ${L[0] + 12} ${L[1] + 24}, ${G[0] + 4} ${G[1] - 30}, ${G[0]} ${G[1]}`, arrow: 0.5 },
  { d: `M${G[0]} ${G[1]} C ${G[0] + 7} ${G[1] - 7}, ${F[0] - 8} ${F[1] - 7}, ${F[0]} ${F[1]}`, arrow: 0.5 },
];

const markFor = (s) => {
  const [x, y] = P(s.lon, s.lat);
  const shape = s.mark === "start"
    ? `<circle r="5.2" class="m-fill"/><path d="M-1.6 -2.4 2.4 0 -1.6 2.4Z" class="m-in"/>`
    : s.mark === "end" ? `<circle r="5.2" class="m-fill"/><rect x="-1.8" y="-1.8" width="3.6" height="3.6" class="m-in"/>`
    : `<circle r="3.6" class="m-ring"/>`;
  return `<g class="stop" data-stop="${s.name}" transform="translate(${x} ${y})"><g class="mk">${shape}</g>` +
    `<g${s.end ? " text-anchor=\"end\"" : ""}><text x="${s.dx}" y="${s.dy}" class="s-name">${s.name}</text><text x="${s.dx}" y="${s.dy}" dy="1.9em" class="s-sub">${s.sub}</text></g></g>`;
};

export function mapSvg() {
  return `<svg class="map-svg" viewBox="0 0 460 210" preserveAspectRatio="xMinYMid slice" role="img" aria-label="Route: Lisbon, Lagos, Faro">` +
    `<g class="map-world"><path class="land" d="${LAND}"/><path class="border" d="${BORDER_PATH}"/>` +
    `<g class="legs">${LEGS.map((l, i) => `<path class="leg" data-leg="${i}" d="${l.d}"/>`).join("")}</g>` +
    `<g class="arrows"></g>${STOPS.map(markFor).join("")}</g></svg>`;
}

/** Arrowheads at the middle of each leg, placed from the drawn path. */
export function placeArrows(svg) {
  const g = svg.querySelector(".arrows");
  g.innerHTML = "";
  svg.querySelectorAll(".leg").forEach((leg, i) => {
    const len = leg.getTotalLength();
    const at = leg.getPointAtLength(len * LEGS[i].arrow);
    const ahead = leg.getPointAtLength(len * LEGS[i].arrow + 1);
    const deg = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI;
    g.insertAdjacentHTML("beforeend", `<path class="arrow" data-leg="${i}" d="M-2.6 -2.4 1 0 -2.6 2.4" transform="translate(${at.x} ${at.y}) rotate(${deg})"/>`);
  });
}

export function overviewTop() {
  const beads = Array.from({ length: 11 }, (_, i) => `<i class="${i < 7 ? "on" : ""}"></i>`).join("");
  return `<section class="card sorted"><span class="beads">${beads}</span><b class="nums">7</b><span class="of">of 11 sorted</span>` +
    `<span class="next">Next: <b>No table booked for Christmas Eve</b></span><span class="flex"></span>${button("Find a table")}<button type="button" class="ib" aria-label="Show all">${glyph("chev")}</button></section>`;
}

export function overviewPage() {
  const faces = PEOPLE.map((p) => avatar(p, 26)).join("");
  return overviewTop() +
    `<section class="card ov-card"><div class="ov-map"><div class="map-ground"></div>${mapSvg()}</div>` +
    `<aside class="trip-card"><div class="tc-head"><h1>Lisbon and the Algarve${glyph("pencil", "tc-pen")}</h1><span class="stamp nums">21 DEC</span></div>` +
    `<p class="tc-dates nums">Mon 21 Dec – Sun 27 Dec 2026 · 6${glyph("moon")}</p><p class="tc-count">In 38 days</p>` +
    `<button type="button" class="tag">${glyph("plus")}Add a tag</button><hr><p class="tc-money"><span>You are owed</span><b class="nums">£24.10</b></p></aside>` +
    `<div class="ov-people"><span class="faces">${faces}</span><span class="who"><b>4 going</b><small>Priya, Sofia, Tom and you</small></span>${button("Invite", { icon: "invite" })}` +
    `<span class="flex"></span><span class="ov-files"><b>Files</b><small>6 tickets and bookings</small><button type="button" class="ib framed" aria-label="Upload">${glyph("upload")}</button></span></div></section>` +
    `<h2 class="sec">Stops</h2><section class="card stops-ghost"><p>Lisbon · 3 nights</p><p>Lagos · 3 nights</p><p>Home · Sun 27 Dec</p></section>`;
}

