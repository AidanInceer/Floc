import { state, DAYS, inTrip, eventsOn, hourGrid, addBtn, dayFacts, longDate, ico, weekday, dom, isNarrow, refresh, HOURS } from "./shared.js";
import { stopCells, strip, toolbar, wireMix } from "./v-mix.js";
import { addDays, dow, formatRange } from "/_house/kit/trip-frame.mjs";

const monday = (d) => addDays(d, -dow(d));

export const calWeeks = () => {
  const out = [];
  for (let m = monday(DAYS[0]); m <= DAYS.at(-1); m = addDays(m, 7)) out.push(Array.from({ length: 7 }, (_, i) => addDays(m, i)));
  return out;
};
const calIndex = () => calWeeks().findIndex((w) => w.includes(state.focus));
const thisWeek = () => calWeeks()[calIndex()];

const outWord = (d) => (d < DAYS[0] ? "Before the trip" : "After the trip");

const foldBtn = () =>
  `<button type="button" class="btn btn-ghost" data-fold aria-pressed="${HOURS.from === 0}">${ico("fold")}${HOURS.from === 0 ? "Fold empty hours" : "Every hour"}</button>`;

const weekLabel = (w) => `<span class="step-label nums">${formatRange(w[0], w[6])}</span>`;

const calSteps = () => {
  const w = calIndex(), n = calWeeks().length;
  return `<div class="stepper"><button type="button" class="iconbtn edge" data-cweek="-1" aria-label="Week before"${w === 0 ? " disabled" : ""}>${ico("chevL")}</button>` +
    `<button type="button" class="iconbtn edge" data-cweek="1" aria-label="Week after"${w === n - 1 ? " disabled" : ""}>${ico("chevR")}</button>${weekLabel(thisWeek())}</div>`;
};

const widths = (dates, wide, out) => `56px ${dates.map((d) => (!inTrip(d) ? out : d === state.focus ? wide : "1fr")).join(" ")}`;

function heads(dates, template, { small = false } = {}) {
  return `<div class="mheads" style="grid-template-columns:${template}"><span class="corner"></span>${dates.map((d) => {
    if (!inTrip(d)) return `<div class="mhead cout${small ? " small" : ""}"><span class="mh-top"><span class="typed">${weekday(d)}</span><b class="nums">${dom(d)}</b></span>${small ? "" : `<small>${outWord(d)}</small>`}</div>`;
    if (d === state.focus) return `<div class="mhead focus"><h3>${longDate(d)}</h3><p class="nums">${dayFacts(d)}</p></div>`;
    const n = eventsOn(d).length;
    return `<button type="button" class="mhead side${small ? " small" : ""}" data-day="${d}" aria-label="Show ${longDate(d)}"><span class="mh-top"><span class="typed">${weekday(d)}</span><b class="nums">${dom(d)}</b></span>${small ? "" : `<small>${n ? `${n} planned` : "Free"}</small>`}</button>`;
  }).join("")}</div>`;
}

const pills = (dates, template) => `<div class="mpills" style="grid-template-columns:${template}">${stopCells(dates, true)}</div>`;

const grid = (dates, template) =>
  hourGrid(dates, { template, hourPx: 46, heads: pills(dates, template) + heads(dates, template) });

function calWeek() {
  const week = thisWeek();
  const template = widths(week, "1.6fr", "0.55fr");
  const bar = `<div class="toolbar">${calSteps()}<span class="grow"></span>${foldBtn()}${addBtn(state.focus)}</div>`;
  return `<section class="card mix cal">${bar}<div class="scroller">${grid(week, template)}</div></section>`;
}

const isMid = () => matchMedia("(max-width: 1023px)").matches;

function focusThree() {
  const d = state.focus, i = DAYS.indexOf(d);
  const prev = i > 0 ? DAYS[i - 1] : addDays(d, -1);
  const next = i < DAYS.length - 1 ? DAYS[i + 1] : addDays(d, 1);
  const dates = [prev, d, next];
  const phone = isNarrow();
  const side = phone ? "40px" : "11rem";
  const template = `${phone ? "48px" : "56px"} ${side} minmax(0, 1fr) ${side}`;
  const g = hourGrid(dates, { template, hourPx: 46, heads: heads(dates, template, { small: phone }), compact: phone ? [prev, next] : [] });
  return `<section class="card mix cal three">${strip([d])}${toolbar()}<div class="scroller">${g}</div></section>`;
}

export const calPicked = () => (isMid() ? focusThree() : calWeek());

const goWeek = (i) => {
  const ws = calWeeks();
  const target = ws[Math.max(0, Math.min(ws.length - 1, i))];
  const want = dow(state.focus);
  const trip = target.filter(inTrip);
  state.focus = trip.reduce((best, d) => (Math.abs(dow(d) - want) < Math.abs(dow(best) - want) ? d : best), trip[0]);
  state.selected = null;
  refresh();
};

export function wireCal(root) {
  wireMix(root);
  root.querySelectorAll("[data-cweek]").forEach((b) => b.addEventListener("click", () => goWeek(calIndex() + Number(b.dataset.cweek))));
}
