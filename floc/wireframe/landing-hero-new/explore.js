// Round 4: Sicily drawn as Explore draws a route (components/explore/route/paint-route.ts): ink line edged in white, patterned
// by mode, one arrow and one tag a leg, white dots for the nights, an ink disc to start and to end, each name with its nights.
import { STOPS, proj, leg, mode } from "./common.js";

const BEND = 0.18;
const TAG_H = 13;
const pt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
// Hand-placed for this one route, so nothing lands on a line or a tag: [dx, dy, anchor] for the name; nights sit beneath.
const NAME = [[0, -24, "middle"], [0, 16, "middle"], [-8, 12, "end"], [-10, -1, "end"]];
let uid = 0;

function legs(ps) {
  return ps.slice(1).map((p1, i) => {
    const p0 = ps[i];
    const [dx, dy] = [p1[0] - p0[0], p1[1] - p0[1]];
    const len = Math.hypot(dx, dy);
    const c = [(p0[0] + p1[0]) / 2 + dy * BEND, (p0[1] + p1[1]) / 2 - dx * BEND];
    const mid = [0.25 * p0[0] + 0.5 * c[0] + 0.25 * p1[0], 0.25 * p0[1] + 0.5 * c[1] + 0.25 * p1[1]];
    const [how, time] = leg(STOPS[i].name, STOPS[i + 1].name);
    return { d: `M${pt(p0)} Q${pt(c)} ${pt(p1)}`, mid, along: [dx / len, dy / len], out: [dy / len, -dx / len], how, time: len > 70 ? time : "" };
  });
}

function tag(l) {
  const w = l.time ? 20 + l.time.length * 4.1 : TAG_H;
  const gap = Math.abs(l.out[0]) * w / 2 + Math.abs(l.out[1]) * TAG_H / 2 + 4;
  const [x, y] = [l.mid[0] + l.out[0] * gap, l.mid[1] + l.out[1] * gap];
  const icon = l.time ? x - w / 2 + 8 : x;
  return `<rect class="ex-tag${l.time ? "" : " icon"}" x="${(x - w / 2).toFixed(1)}" y="${(y - TAG_H / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${TAG_H}" rx="${TAG_H / 2}"/>
    <g transform="translate(${(icon - 4.25).toFixed(1)} ${(y - 4.25).toFixed(1)}) scale(${(8.5 / 14).toFixed(3)})">${mode(l.how).replace(/<\/?svg[^>]*>/g, "")}</g>
    ${l.time ? `<text class="ex-time" x="${(icon + 7).toFixed(1)}" y="${(y + 2.4).toFixed(1)}">${l.time}</text>` : ""}`;
}

function arrow(l) {
  const a = (Math.atan2(l.along[1], l.along[0]) * 180) / Math.PI;
  return `<path class="ex-arrow" d="M-2.3 -2.6 L1 0 L-2.3 2.6" transform="translate(${pt(l.mid)}) rotate(${a.toFixed(1)})"/>`;
}

function disc([x, y], end) {
  const r = 6.2;
  const mark = end
    ? `<rect x="${(x - r * 0.36).toFixed(1)}" y="${(y - r * 0.36).toFixed(1)}" width="${(r * 0.72).toFixed(1)}" height="${(r * 0.72).toFixed(1)}" rx="0.7"/>`
    : `<path d="M${pt([x - r * 0.24 + 0.4, y - r * 0.42])} L${pt([x + r * 0.44 + 0.4, y])} L${pt([x - r * 0.24 + 0.4, y + r * 0.42])} Z"/>`;
  return `<circle class="ex-disc" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/><g class="ex-disc-mark">${mark}</g>`;
}

export const BOX = [-10, -10, 320, 215];

/** The trip's route over Sicily in Explore's map style. `.routed` on any ancestor draws it, leg by leg; `--leg` is one leg's time. */
export function exploreSicily({ cls = "", box = BOX, names = true } = {}) {
  const id = `ex-pen-${++uid}`;
  const ps = STOPS.map((s) => proj(s.lat, s.lng));
  const ls = legs(ps);
  const at = (k) => `style="--k:${k}"`;
  const lines = ls.map((l) => {
    const look = l.how === "train" ? "rail" : "road";
    return `<path class="ex-edge" d="${l.d}"/><path class="ex-line ${look}" d="${l.d}"/>`;
  }).join("");
  const pen = ls.map((l, k) => `<path d="${l.d}" pathLength="1" ${at(k)}/>`).join("");
  const marks = ls.map((l, k) => `<g class="ex-mark" ${at(k + 0.5)} data-o="${pt(l.mid)}">${arrow(l)}${tag(l)}</g>`).join("");
  const stops = STOPS.map((s, k) => {
    const p = ps[k];
    const dot = k === 0 || k === STOPS.length - 1 ? disc(p, k > 0) : `<circle class="ex-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.3"/>`;
    const [dx, dy, anchor] = NAME[k];
    const [x, y] = [p[0] + dx, p[1] + dy];
    const o = `data-o="${pt(p)}"`;
    if (!names) return `<g class="ex-stop" ${at(k)} ${o}>${dot}</g>`;
    return `<g class="ex-stop" ${at(k)} ${o}>${dot}
      <text class="ex-name" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}">${s.name}</text>
      <text class="ex-sub" x="${x.toFixed(1)}" y="${(y + 9.5).toFixed(1)}" text-anchor="${anchor}">${s.nights} night${s.nights === 1 ? "" : "s"}</text></g>`;
  }).join("");
  return `<svg class="ex-map ${cls}" viewBox="${box.join(" ")}" aria-hidden="true">
    <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"><g class="ex-pen">${pen}</g></mask></defs>
    <path class="ex-land"/>
    <g mask="url(#${id})">${lines}</g>${marks}${stops}</svg>`;
}

/** Hold the marks, names and lines at one size on screen while the view box zooms: `z` is view-box units per H1 unit. */
export function setZoom(svg, z) {
  svg.style.setProperty("--z", z.toFixed(4));
  svg.querySelectorAll("[data-o]").forEach((g) => {
    const [x, y] = g.dataset.o.split(" ");
    g.setAttribute("transform", `translate(${x} ${y}) scale(${z.toFixed(4)}) translate(${-x} ${-y})`);
  });
}
