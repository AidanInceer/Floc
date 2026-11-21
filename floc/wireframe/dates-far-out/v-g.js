import { span, setBtn, rail } from "./shared.js";
import * as R2 from "./r2.js";

export const seed = () => ({});

function dock(s, R) {
  const r = R2.rank(R);
  const w = r.list[0];
  if (!w) return "";
  return `<div class="dock"><span class="stack"><span class="when">${span(w.a, w.b)}</span><span class="sub">${R2.facts(w, r.dayers.length)[0]}</span></span>${setBtn(s, w.a, w.b)}</div>`;
}

export function view(s) {
  const R = s.R;
  const group = R2.lenGroup(R);
  return {
    rail: rail("Your days"),
    main:
      `<section class="card"><div class="card-head"><h2>How long?</h2></div><p class="hint">Press once for can do, twice for prefer</p>${R2.lenTiles(R)}` +
      (group ? `<p class="hint">${group}</p>` : "") + `</section>` +
      `<section class="card"><div class="card-head">${R2.modeTrack(R)}<span class="bar-acts">${R2.CLEAR}${R2.FILL}</span></div>${R2.myDays(s, R)}${R2.MARK_KEYS}</section>` +
      dock(s, R),
    side: `<section class="card"><div class="card-head"><h2>Best dates</h2></div>${R2.bestBody(s, R, { how: true })}</section>` + R2.whoCard(R),
  };
}

export function act() {}
