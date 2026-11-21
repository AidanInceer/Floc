import { ico, plural } from "/_house/kit/trip-frame.mjs";
import { ME, faces, waiting, span, setBtn, rail } from "./shared.js";
import * as R2 from "./r2.js";

export const seed = () => ({ sel: null });

const CROSS = ico("cross");
const CHECK = ico("check");

function why(w) {
  return w.who.map((j) =>
    `<p class="why-row ${j.works ? "yes" : j.hasDays ? "no" : ""}">${faces([j.p.id], 20)}<span class="name">${j.p.id === ME.id ? "You" : j.p.name}</span>` +
    `<span class="why-text">${j.works ? CHECK : j.hasDays ? CROSS : ""}${j.text}</span></p>`).join("");
}

function side(s, R, r, cur) {
  const head = `<div class="card-head"><h2>Best dates</h2></div>`;
  const gap = R2.missing(R, r);
  if (gap) return `<section class="card">${head}<p class="hint">${gap}</p>${waiting(R2.notIn(R))}</section>`;
  const total = r.dayers.length;
  const rows = r.list.map((w, i) =>
    `<button type="button" class="bw pickable" data-act="h-sel" data-key="${R2.winKey(w)}" data-k="sel-${R2.winKey(w)}" aria-pressed="${w === cur}">` +
    `<span class="bw-head"><span class="when">${span(w.a, w.b)}</span><span class="sub">${plural(w.n, "night")}</span>${i === 0 ? `<span class="badge">Best</span>` : ""}</span>` +
    `<span class="bw-facts">${R2.facts(w, total).map((f) => `<span>${f}</span>`).join("")}</span></button>`).join("");
  return `<section class="card">${head}<p class="hint">${R2.HOW}</p>${waiting(R2.notIn(R))}<div class="bw-list">${rows}</div>` +
    `<div class="part"><p class="part-title">Why ${span(cur.a, cur.b)}</p><div class="why">${why(cur)}</div><div>${setBtn(s, cur.a, cur.b)}</div></div></section>`;
}

export function view(s) {
  const R = s.R;
  const r = R2.rank(R);
  const cur = r.list.find((w) => R2.winKey(w) === s.H.sel) ?? r.list[0];
  return {
    rail: rail("The group"),
    main:
      `<section class="card">${R2.lenSentence(R)}` +
      `<div class="part"><div class="card-head">${R2.modeTrack(R)}${R2.FILL}</div>${R2.groupDays(s, R, { mine: true, sel: cur })}${R2.groupKeys(true)}</div></section>`,
    side: side(s, R, r, cur),
  };
}

export function act(d, s) {
  if (d.act === "h-sel") s.H.sel = d.key;
}
