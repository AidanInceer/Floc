import { span, setBtn, rail } from "./shared.js";
import * as R2 from "./r2.js";
import * as Q from "./g-quiet.js";

export const seed = () => ({ key: null });

function tile(w, total, on) {
  const key = R2.winKey(w);
  return `<button type="button" class="wtile" data-act="q-open" data-key="${key}" data-k="wt-${key}" aria-pressed="${on}">` +
    `<span class="when">${span(w.a, w.b)}</span><span class="sub">${Q.brief(w, total)}</span></button>`;
}

function best(s, R, p) {
  if (p.gap) return Q.empty(R, p.gap);
  const why = Q.reasons(p.w).join(". ");
  return `<div class="wtiles">${p.list.map((w, i) => tile(w, p.total, i === p.at)).join("")}</div>` +
    `<div class="bar"><span class="hint">${why ? `${why}.` : ""}</span>${setBtn(s, p.w.a, p.w.b)}</div>${Q.rest(R)}`;
}

export function view(s) {
  const R = s.R;
  const p = Q.picks(R, s.G4.key);
  return {
    rail: rail("Your days"),
    main: Q.lengthCard(R) + Q.daysCard(s, R, p.w) +
      `<section class="card"><div class="card-head"><h2>Best dates</h2></div>${best(s, R, p)}</section>` + Q.dock(s, p.w, p.total),
    side: "",
    solo: true,
  };
}

export function act(d, s) {
  if (d.act === "q-open") s.G4.key = d.key;
}
