import { PEOPLE, ME } from "./shared.js";
import * as R2 from "./r2.js";

export const seed = () => ({ tab: "How long" });

function steps(s) {
  const R = s.R;
  const items = [
    ["How long", R2.lenText(R, ME.id) || "To do", true],
    ["Your days", R2.daysText(R, ME.id) || "To do", true],
    ["The group", `${R2.inCount(R)} of ${PEOPLE.length} in`, true],
    ["The trip", s.trip ? "Set" : "Not set", false],
    ["Forecast", "", false],
  ];
  return items.map(([label, sub, live]) =>
    `<button type="button" class="two" data-act="${live ? "tab" : "tab-off"}" data-tab="${label}" data-k="tab-${label}" aria-current="${s.F.tab === label}">` +
    `<span>${label}</span>${sub ? `<span class="sub">${sub}</span>` : ""}</button>`).join("");
}

const next = (tab, label) => `<div class="bar"><span></span><button type="button" class="btn btn-primary" data-act="tab" data-tab="${tab}" data-k="next">${label}</button></div>`;

function main(s) {
  const R = s.R;
  if (s.F.tab === "How long") {
    const group = R2.lenGroup(R);
    return `<section class="card"><div class="card-head"><h2>How long?</h2></div><p class="hint">Press once for can do, twice for prefer</p>` +
      R2.lenStrip(R) + R2.MARK_KEYS + (group ? `<p class="hint">${group}</p>` : "") + next("Your days", "Next: your days") + `</section>`;
  }
  if (s.F.tab === "Your days") {
    return `<section class="card"><div class="card-head">${R2.modeTrack(R)}${R2.FILL}</div>${R2.myDays(s, R)}${R2.MARK_KEYS}${next("The group", "Next: the group")}</section>`;
  }
  return `<section class="card">${R2.groupDays(s, R)}${R2.groupKeys(false)}</section>` +
    `<section class="card"><div class="card-head"><h2>Best dates</h2></div>${R2.bestBody(s, R, { how: true, limit: 4 })}</section>`;
}

function side(s) {
  const R = s.R;
  const soFar = s.F.tab === "The group" ? "" : `<section class="card"><div class="card-head"><h2>Best so far</h2></div>${R2.bestBody(s, R, { limit: 1, noSet: true })}</section>`;
  return soFar + R2.whoCard(R);
}

export function view(s) {
  return { rail: steps(s), main: main(s), side: side(s) };
}

export function act(d, s) {
  if (d.act === "tab") s.F.tab = d.tab;
}
