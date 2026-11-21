import { ico } from "/_house/kit/trip-frame.mjs";
import { span, setBtn, rail } from "./shared.js";
import * as R2 from "./r2.js";
import * as Q from "./g-quiet.js";

export const seed = () => ({ key: null });

function row(s, w, total, on) {
  const key = R2.winKey(w);
  const why = Q.reasons(w).map((t) => `<span>${t}</span>`).join("");
  return `<div class="bd"><button type="button" class="bd-head" data-act="q-open" data-key="${key}" data-k="bd-${key}" aria-expanded="${on}">` +
    `<span class="when">${span(w.a, w.b)}</span><span class="sub">${Q.brief(w, total)}</span>${ico(on ? "chev" : "chevR")}</button>` +
    (on ? `<div class="bd-body">${why ? `<p class="bd-why">${why}</p>` : ""}<div>${setBtn(s, w.a, w.b)}</div></div>` : "") + `</div>`;
}

export function view(s) {
  const R = s.R;
  const p = Q.picks(R, s.G2.key);
  const body = p.gap ? Q.empty(R, p.gap) : `<div class="bd-list">${p.list.map((w, i) => row(s, w, p.total, i === p.at)).join("")}</div>${Q.rest(R)}`;
  return {
    rail: rail("Your days"),
    main: Q.lengthCard(R) + Q.daysCard(s, R) + Q.dock(s, p.w, p.total),
    side: `<section class="card"><div class="card-head"><h2>Best dates</h2></div>${body}</section>`,
  };
}

export function act(d, s) {
  if (d.act === "q-open") s.G2.key = d.key;
}
