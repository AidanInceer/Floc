import { ico, plural } from "/_house/kit/trip-frame.mjs";
import { span, setBtn, rail } from "./shared.js";
import * as R2 from "./r2.js";
import * as Q from "./g-quiet.js";

export const seed = () => ({ key: null });

function pager(p) {
  if (p.list.length < 2) return "";
  const b = (step, label, name) => `<button type="button" class="iconbtn" data-act="q-step" data-step="${step}" data-k="q-step-${step}" aria-label="${label}">${ico(name)}</button>`;
  return `<span class="pager">${b(-1, "Previous option", "chevL")}<span class="sub">${p.at + 1} of ${p.list.length}</span>${b(1, "Next option", "chevR")}</span>`;
}

function one(s, p) {
  const w = p.w;
  const why = Q.reasons(w).map((t) => `<span>${t}</span>`).join("");
  return `<div class="one"><p class="big">${span(w.a, w.b)}</p><p class="one-fact">${plural(w.n, "night")}. ${Q.tally(w, p.total)}.</p>` +
    (why ? `<p class="bd-why">${why}</p>` : "") + `<div>${setBtn(s, w.a, w.b)}</div></div>`;
}

export function view(s, keyed) {
  const R = s.R;
  const p = Q.picks(R, s.G3.key);
  return {
    rail: rail("Your days"),
    main: Q.lengthCard(R) + Q.daysCard(s, R, p.w, keyed) + Q.dock(s, p.w, p.total),
    side: `<section class="card"><div class="card-head"><h2>Best dates</h2>${p.gap ? "" : pager(p)}</div>${p.gap ? Q.empty(R, p.gap) : one(s, p) + Q.rest(R)}</section>`,
  };
}

export function act(d, s) {
  if (d.act !== "q-step") return;
  const p = Q.picks(s.R, s.G3.key);
  if (!p.list.length) return;
  const next = p.list[(p.at + Number(d.step) + p.list.length) % p.list.length];
  s.G3.key = R2.winKey(next);
}
