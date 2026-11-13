// The live Days page, drawn by eye from components/days/: day strip, toolbar, the three-slot calendar (day before, the day, day after).
import { esc, glyph, button, isNarrow } from "./shared.mjs";

const HOUR = 48;
const FROM = 8;
const TO = 23;

export const TRIP_DAYS = [
  { date: "2026-12-21", wd: "Mon", dm: 21, long: "Monday 21 December", short: "Mon 21 Dec", stay: ["Lisbon", 1, 3],
    ev: [["transport", "10:15", "12:45", "Flight to Lisbon", "Birmingham to Lisbon", "flight"], ["other", "14:00", "15:00", "Check in, Alfama flat", "Rua dos Remédios"], ["food", "19:30", "21:30", "Dinner at Taberna da Rua das Flores", "Chiado"]],
    allDay: [] },
  { date: "2026-12-22", wd: "Tue", dm: 22, long: "Tuesday 22 December", short: "Tue 22 Dec", stay: ["Lisbon", 2, 3],
    ev: [["activity", "09:30", "11:00", "Belém Tower", "Belém"], ["food", "11:15", "12:00", "Pastéis de Belém", "Rua de Belém"], ["transport", "15:00", "16:00", "Tram 28 to Alfama", "Martim Moniz", "tram"], ["activity", "20:00", "22:00", "Fado at Clube de Fado", "Alfama"]],
    allDay: [] },
  { date: "2026-12-23", wd: "Wed", dm: 23, long: "Wednesday 23 December", short: "Wed 23 Dec", stay: ["Lisbon", 3, 3],
    ev: [["transport", "08:40", "09:20", "Train to Sintra", "Rossio", "train"], ["activity", "10:00", "16:30", "Pena Palace and the Moorish castle", "Sintra"], ["food", "19:30", "21:00", "Dinner at Cervejaria Ramiro", "Intendente"]],
    allDay: [["other", "Pack for Lagos"]] },
  { date: "2026-12-24", wd: "Thu", dm: 24, long: "Thursday 24 December", short: "Thu 24 Dec", stay: ["Lagos", 1, 3],
    ev: [["transport", "09:10", "12:40", "Train to Lagos", "Lisboa Oriente", "train"], ["activity", "15:00", "17:00", "Ponta da Piedade walk", "Lagos"], ["food", "20:00", "22:00", "Christmas Eve dinner", "Casa Rosa"]],
    allDay: [["other", "Check out by 11:00"]] },
  { date: "2026-12-25", wd: "Fri", dm: 25, long: "Friday 25 December", short: "Fri 25 Dec", stay: ["Lagos", 2, 3],
    ev: [["activity", "10:30", "12:00", "Swim at Praia do Camilo", "Praia do Camilo"], ["food", "13:30", "16:30", "Christmas lunch", "The villa"]],
    allDay: [["other", "Shops shut"]] },
  { date: "2026-12-26", wd: "Sat", dm: 26, long: "Saturday 26 December", short: "Sat 26 Dec", stay: ["Lagos", 3, 3],
    ev: [["activity", "10:00", "13:00", "Kayak to the grottoes", "Marina de Lagos"], ["food", "19:00", "20:30", "Dinner at A Forja", "Lagos"]],
    allDay: [] },
  { date: "2026-12-27", wd: "Sun", dm: 27, long: "Sunday 27 December", short: "Sun 27 Dec", stay: null,
    ev: [["transport", "11:00", "13:45", "Train to Faro", "Lagos", "train"], ["transport", "16:20", "18:50", "Flight home", "Faro to Birmingham", "flight"]],
    allDay: [] },
];

const minutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const y = (hhmm) => ((minutes(hhmm) - FROM * 60) / 60) * HOUR;
const typeGlyph = (type, how) => glyph(type === "transport" ? (how === "flight" ? "flight" : how === "train" ? "train" : "car") : type === "food" ? "food" : type === "activity" ? "activity" : "clock");

function block(e, focus) {
  const [type, start, end, title, place, how] = e;
  const top = y(start);
  const height = Math.max(y(end) - top - 2, 18);
  const tight = height < 40;
  return `<div class="ev-block ${type}${focus ? " focus" : ""}${tight ? " tight" : ""}" style="top:${top}px;height:${height}px">` +
    `<span class="t nums">${tight ? start : `${start} – ${end}`}</span><b>${esc(title)}</b>` +
    (tight ? "" : `<span class="pl">${typeGlyph(type, how)}${focus ? `<span>${esc(place)}</span>` : ""}</span>`) + "</div>";
}

const outside = (i) => i < 0 || i >= TRIP_DAYS.length;

function head(i, focusIdx) {
  if (outside(i)) return `<div class="d-head d-out"><span class="typed">${i < 0 ? "Trip starts" : "Last day"}</span></div>`;
  const d = TRIP_DAYS[i];
  if (i !== focusIdx) {
    const left = i < focusIdx;
    return `<button type="button" class="d-head d-side" data-go-to="${i}" aria-label="Show ${d.long}">${left ? glyph("chevL", "side-chev") : ""}<span class="typed">${d.wd}</span><b class="nums">${d.dm}</b>${left ? "" : glyph("chevR", "side-chev")}</button>`;
  }
  const stay = d.stay ? `${d.stay[0]}, night ${d.stay[1]} of ${d.stay[2]}` : "Day home";
  const count = d.ev.length + d.allDay.length;
  return `<div class="d-head d-focus"><div class="min"><h2><span class="wide">${d.long}</span><span class="narrow nums">${d.short}</span></h2>` +
    `<p>Day ${i + 1} of ${TRIP_DAYS.length}<span class="wide"> · ${stay}</span> · ${count} events</p></div>` +
    `<div class="acts">${button("Add", { icon: "plus", kind: "wide-only" })}<button type="button" class="ib" aria-label="${d.long} actions">${glyph("more")}</button></div></div>`;
}

function allDay(i, focusIdx) {
  if (outside(i)) return `<div class="d-all d-out"></div>`;
  return `<div class="d-all${i === focusIdx ? " on" : ""}">${TRIP_DAYS[i].allDay.map(([type, t]) => `<span class="ad ${type}"><span class="${i === focusIdx ? "" : "side-words"}">${esc(t)}</span></span>`).join("")}</div>`;
}

function column(i, focusIdx) {
  if (outside(i)) return `<div class="d-col d-out"></div>`;
  const focus = i === focusIdx;
  return `<div class="d-col${focus ? "" : " side"}">${TRIP_DAYS[i].ev.map((e) => block(e, focus)).join("")}</div>`;
}

/** One slot: its head, its all-day cell and its clock column, stacked, so a slot moves as one piece. */
export const slot = (i, focusIdx) =>
  `<div class="d-slot${i === focusIdx ? " is-focus" : ""}" data-slot="${i}">${head(i, focusIdx)}${allDay(i, focusIdx)}${column(i, focusIdx)}</div>`;

function gutter() {
  let marks = "";
  for (let h = FROM; h <= TO; h += 1) marks += `<span class="nums" style="top:${(h - FROM) * HOUR}px">${String(h).padStart(2, "0")}:00</span>`;
  return `<div class="d-gutter"><div class="g-head"></div><div class="g-all"><span>All day</span></div><div class="g-clock" style="height:${(TO - FROM) * HOUR}px">${marks}</div></div>`;
}

function rules() {
  let lines = "";
  for (let h = FROM; h <= TO; h += 1) lines += `<i style="top:${(h - FROM) * HOUR}px"></i>`;
  return `<div class="d-rules" style="height:${(TO - FROM) * HOUR}px">${lines}</div>`;
}

function strip(focusIdx) {
  const pill = (name, from, span, nights) =>
    `<button type="button" class="stop-pill" style="grid-column:${from} / span ${span}">${glyph("bed")}<b>${name}</b><small class="nums">${nights}${glyph("moon")}</small></button>`;
  const cells = TRIP_DAYS.map((d, i) =>
    `<button type="button" class="day-cell${i === focusIdx ? " on" : ""}" data-go-to="${i}" ${i === focusIdx ? 'aria-current="date"' : ""} title="${d.long}"><span class="typed">${d.wd}</span><b class="nums">${d.dm}</b></button>`).join("");
  return `<div class="d-strip"><div class="d-strip-grid">${pill("Lisbon", 1, 3, 3)}${pill("Lagos", 4, 3, 3)}<span class="day-wash" aria-hidden="true"></span>${cells}</div></div>`;
}

export function daysPage(focusIdx) {
  const slots = [focusIdx - 1, focusIdx, focusIdx + 1].map((i) => slot(i, focusIdx)).join("");
  return `<div class="page-top">${button("Add to calendar", { attrs: 'tabindex="-1"' })}</div>` +
    `<section class="card days-card">${strip(focusIdx)}` +
    `<div class="d-tools"><button type="button" class="fb" data-step="-1" aria-label="Day before">${glyph("chevL")}</button><button type="button" class="fb" data-step="1" aria-label="Day after">${glyph("chevR")}</button>` +
    `<span class="flex"></span>${button("Every hour", { kind: "ghost tools-fold", icon: "fold" })}${button("Add event", { kind: "primary", icon: "plus" })}</div>` +
    `<div class="d-cal">${gutter()}<div class="d-track-wrap">${rules()}<div class="d-track">${slots}</div></div></div></section>`;
}

/** Puts the strip's pen wash on a day cell; the wash is one element so it can travel. */
export function placeWash(root, focusIdx) {
  const wash = root.querySelector(".day-wash");
  const cell = root.querySelectorAll(".day-cell")[focusIdx];
  const grid = root.querySelector(".d-strip-grid").getBoundingClientRect();
  const r = cell.getBoundingClientRect();
  wash.style.transform = `translate(${r.left - grid.left}px, ${r.top - grid.top}px)`;
  wash.style.width = `${r.width}px`;
  wash.style.height = `${r.height}px`;
}

export const sideWidth = () => (isNarrow() ? 38 : 176);
