import { plural } from "/_house/kit/trip-frame.mjs";
import { span, setBtn, waiting } from "./shared.js";
import * as R2 from "./r2.js";

const CLEAR = `<button type="button" class="btn" data-act="r-clear" data-k="r-clear" aria-label="Clear my days">Clear</button>`;

export function lengthCard(R) {
  const group = R2.lenBrief(R);
  return `<section class="card"><div class="card-head"><h2>How long?</h2><span class="sub">Press twice to prefer</span></div>` +
    `${R2.lenTiles(R, { brief: true })}${group ? `<p class="hint">${group}</p>` : ""}</section>`;
}

function keyedTrack(R) {
  const b = (v, label) => `<button type="button" data-act="r-mode" data-v="${v}" data-k="mode-${v}" aria-pressed="${R.mode === v}"><i class="sw ${v}"></i>${label}</button>`;
  return `<div class="track" role="group" aria-label="What a press marks">${b("can", "Can do")}${b("prefer", "Prefer")}</div>`;
}

export const daysCard = (s, R, sel, keyed) =>
  `<section class="card"><div class="card-head">${keyed ? keyedTrack(R) : R2.modeTrack(R)}<span class="bar-acts">${CLEAR}${R2.FILL}</span></div>${R2.myDays(s, R, null, sel)}</section>`;

export function picks(R, key) {
  const r = R2.rank(R);
  const list = r.list.slice(0, 3);
  const at = Math.max(0, list.findIndex((w) => R2.winKey(w) === key));
  return { list, at, w: list[at] ?? null, total: r.dayers.length, gap: R2.missing(R, r) };
}

export const count = (w, total) => (w.works === total ? `All ${total}` : `${w.works} of ${total}`);
export const tally = (w, total) => `${count(w, total)} can make it`;
export const brief = (w, total) => `${plural(w.n, "night")}, ${w.works === total ? `all ${total}` : `${w.works} of ${total}`} can make it`;
export const reasons = (w) => [w.like ? `${w.like} prefer these days` : "", ...R2.misses(w)].filter(Boolean);
export const rest = (R) => waiting(R2.notIn(R));
export const empty = (R, gap) => `<p class="hint">${gap}</p>${rest(R)}`;

export const dock = (s, w, total) =>
  w ? `<div class="dock"><span class="stack"><span class="when">${span(w.a, w.b)}</span><span class="sub">${brief(w, total)}</span></span>${setBtn(s, w.a, w.b)}</div>` : "";
