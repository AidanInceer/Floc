import { ico } from "/_house/kit/trip-frame.mjs";
import { PEOPLE, ME, nameList, span, rail } from "./shared.js";
import * as R2 from "./r2.js";

export const seed = () => ({ open: null });

function auto(R) {
  const d = R2.done(R, ME.id);
  return !d.len ? 1 : !d.days ? 2 : 5;
}

const next = (n) => `<div class="bar"><span></span><button type="button" class="btn btn-primary" data-act="i-open" data-n="${n}" data-k="next-${n}">Next</button></div>`;

function step(open, k, title, sum, isDone, body) {
  const on = open === k;
  return `<button type="button" class="acc-head" data-act="i-open" data-n="${k}" data-k="acc-${k}" aria-expanded="${on}">` +
    `<span class="acc-num${isDone ? " done" : ""}">${isDone ? ico("check") : k}</span><span class="acc-title">${title}</span><span class="acc-sum">${sum}</span>${ico(on ? "chev" : "chevR")}</button>` +
    (on ? `<div class="acc-body">${body}</div>` : "");
}

export function view(s) {
  const R = s.R;
  const d = R2.done(R, ME.id);
  s.I.open ??= auto(R);
  const open = s.I.open;
  const r = R2.rank(R);
  const top = r.list[0];
  const group = R2.lenGroup(R);
  const rest = R2.notIn(R);
  const prefers = R.prefer[ME.id].size;
  const body =
    step(open, 1, "How long can you go?", R2.lenText(R, ME.id) || "To do", d.len, R2.lenRows(R) + (group ? `<p class="hint">${group}</p>` : "") + next(2)) +
    step(open, 2, "Which days can you do?", d.days ? `${R.can[ME.id].size} days` : "To do", d.days,
      `<div class="bar-acts">${R2.FILL}${R2.CLEAR}</div>${R2.myDays(s, R, "can")}${R2.MARK_KEYS}${next(3)}`) +
    step(open, 3, "Which days would you rather?", prefers ? `${prefers} days` : "If you like", d.prefer, `${R2.myDays(s, R, "prefer")}${R2.MARK_KEYS}${next(4)}`) +
    step(open, 4, "Who's in", rest.length ? `Waiting on ${nameList(rest)}` : `All ${PEOPLE.length}`, !rest.length, `<div>${R2.whoRows(R)}</div>${next(5)}`) +
    step(open, 5, "Best dates", s.trip ? "Set" : top ? span(top.a, top.b) : "Needs a length and days", Boolean(s.trip), R2.bestBody(s, R, { how: true, limit: 4 }));
  return {
    rail: rail("Plan the dates", "Plan the dates"),
    main: `<section class="card acc">${body}</section>`,
    side: "",
    solo: true,
  };
}

export function act(d, s) {
  if (d.act !== "i-open") return;
  const n = Number(d.n);
  const open = s.I.open ?? auto(s.R);
  s.I.open = open === n ? 0 : n;
}
