import { ico, plural } from "/_house/kit/trip-frame.mjs";
import { ME, faces, waiting, span, setBtn, rail } from "./shared.js";
import * as R2 from "./r2.js";

export const seed = () => ({});

const mark = (j) => (j.works ? ico("check") : j.hasDays ? ico("cross") : "");
const tone = (j) => (j.works ? "yes" : j.hasDays ? "no" : "");
const who = (j) => (j.p.id === ME.id ? "You" : j.p.name);

function matrix(s, cols, total) {
  const head = `<div class="mx-x"></div>` + cols.map((w, i) =>
    `<div class="mx-h"><span class="when">${span(w.a, w.b)}</span><span class="sub">${plural(w.n, "night")}</span>` +
    `<span class="mx-fact">${R2.facts(w, total)[0]}</span>${i === 0 ? `<span><span class="badge">Best</span></span>` : ""}</div>`).join("");
  const rows = cols[0].who.map((_, p) =>
    `<div class="mx-p">${faces([cols[0].who[p].p.id], 20)}<span>${who(cols[0].who[p])}</span></div>` +
    cols.map((w) => `<div class="mx-c ${tone(w.who[p])}">${mark(w.who[p])}<span>${w.who[p].short}</span></div>`).join("")).join("");
  const foot = `<div class="mx-x"></div>` + cols.map((w, i) => `<div class="mx-f">${setBtn(s, w.a, w.b, { quiet: i > 0 })}</div>`).join("");
  return `<div class="mx only-wide" style="--cols:${cols.length}">${head}${rows}${foot}</div>`;
}

function stacked(s, cols, total) {
  return `<div class="only-narrow">${cols.map((w, i) =>
    `<div class="bw"><div class="bw-head"><span class="when">${span(w.a, w.b)}</span><span class="sub">${plural(w.n, "night")}</span>${i === 0 ? `<span class="badge">Best</span>` : ""}</div>` +
    `<p class="bw-facts">${R2.facts(w, total).map((f) => `<span>${f}</span>`).join("")}</p>` +
    `<div class="why">${w.who.map((j) => `<p class="why-row ${tone(j)}">${faces([j.p.id], 20)}<span class="name">${who(j)}</span><span class="why-text">${mark(j)}${j.short}</span></p>`).join("")}</div>` +
    `<div>${setBtn(s, w.a, w.b, { quiet: i > 0 })}</div></div>`).join("")}</div>`;
}

function best(s, R) {
  const r = R2.rank(R);
  const head = `<div class="card-head"><h2>Best dates</h2></div>`;
  const gap = R2.missing(R, r);
  if (gap) return `<section class="card">${head}<p class="hint">${gap}</p>${waiting(R2.notIn(R))}</section>`;
  const cols = r.list.slice(0, 3);
  return `<section class="card">${head}<p class="hint">${R2.HOW}</p>${waiting(R2.notIn(R))}${matrix(s, cols, r.dayers.length)}${stacked(s, cols, r.dayers.length)}</section>`;
}

function answers(s, R) {
  return `<section class="card"><div class="card-head"><h2>Your answers</h2></div><div class="two-up">` +
    `<div class="stack-lg"><p class="part-title">How long?</p><p class="hint">Press once for can do, twice for prefer</p>${R2.lenStrip(R)}${R2.MARK_KEYS}</div>` +
    `<div class="stack-lg small"><div class="card-head">${R2.modeTrack(R)}${R2.FILL}</div>${R2.myDays(s, R)}</div></div></section>`;
}

export function view(s) {
  const R = s.R;
  const d = R2.done(R, ME.id);
  const mine = answers(s, R);
  const group = best(s, R);
  return { rail: rail("The group"), main: d.len && d.days ? group + mine : mine + group, side: "", full: true };
}

export function act() {}
