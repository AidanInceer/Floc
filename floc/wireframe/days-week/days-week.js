// Days: the stop strip one trip week at a time (A) and the overnight dialog's nights picked on a month calendar (F).
import { variants } from "/_house/switcher.js";
import { tripFrame, ico, esc, addDays, dow, dom, weekday, shortDate, dateRange, formatRange, monthName, monthGrid } from "/_house/kit/trip-frame.mjs";

const START = "2026-12-10";
const END = "2026-12-26";
const DAYS = dateRange(START, END);
const me = { name: "Aidan", initial: "Ai", tone: 1 };

const MOON = '<svg class="g" viewBox="0 0 14 14" aria-hidden="true"><path d="M11.2 8.8A4.8 4.8 0 0 1 5.2 2.8a4.8 4.8 0 1 0 6 6Z"/></svg>';
const EVENTS = { "2026-12-10": 2, "2026-12-11": 3, "2026-12-12": 1, "2026-12-13": 2, "2026-12-15": 1, "2026-12-16": 4, "2026-12-18": 2, "2026-12-19": 3, "2026-12-22": 1, "2026-12-24": 2, "2026-12-25": 1 };

function freshNights() {
  const n = {};
  DAYS.forEach((d) => {
    n[d] = d <= "2026-12-13" ? "Lisbon" : d === "2026-12-14" ? null : d <= "2026-12-17" ? "Porto" : d <= "2026-12-21" ? "Madrid" : "Barcelona";
  });
  return n;
}

const state = { variant: "A", night: freshNights(), focus: START, week: 0, dlg: null };

// Stops are runs of the same place (rule 3). The last day is the day home, so it is no night.
function stops(night = state.night) {
  const out = [];
  DAYS.forEach((d) => {
    const last = out.at(-1);
    if (last && last.place === night[d]) { last.end = d; last.dates.push(d); return; }
    out.push({ start: d, end: d, place: night[d], dates: [d] });
  });
  out.forEach((s) => { s.nights = s.dates.length - (s.end === END ? 1 : 0); });
  return out;
}
const stopOf = (d) => stops().find((s) => s.dates.includes(d));
const dayNo = (d) => DAYS.indexOf(d) + 1;
const nightsWord = (n) => `${n} night${n === 1 ? "" : "s"}`;

function tripWeeks() {
  const weeks = [];
  for (let i = 0; i < DAYS.length; i += 7) {
    const w = DAYS.slice(i, i + 7);
    while (w.length < 7) w.push(addDays(w.at(-1), 1));
    weeks.push(w);
  }
  return weeks;
}
const weeksFor = tripWeeks;
const inTrip = (d) => d >= START && d <= END;
const weekOf = (d) => weeksFor().findIndex((w) => w.includes(d));

function pill(stop, cells) {
  const first = cells[0], last = cells.at(-1);
  const cutL = stop.start < first, cutR = stop.end > last;
  const span = cells.length;
  const name = stop.place ?? "Not set";
  const label = `Overnight: ${stop.place ? `${stop.place}, ${nightsWord(stop.nights)}` : "not set"}`;
  return `<button type="button" class="pill${stop.place ? "" : " unset"}${cutL ? " cut-l" : ""}${cutR ? " cut-r" : ""} span-${Math.min(span, 3)}" style="grid-column: span ${span}" data-stop="${stop.start}" aria-label="${esc(label)}" title="${esc(stop.place ? `${stop.place} · ${nightsWord(stop.nights)}` : "Not set")}">` +
    `${cutL ? `<span class="cut">${ico("chevL")}</span>` : ""}${ico("bed", "bed")}<b>${esc(name)}</b>` +
    (stop.place && stop.nights > 1 ? `<small class="nums">${stop.nights}${MOON}</small>` : "") +
    `${cutR ? `<span class="cut">${ico("chevR")}</span>` : ""}</button>`;
}

function weekCells(week) {
  const all = stops();
  let html = "", i = 0;
  while (i < 7) {
    const d = week[i];
    if (!inTrip(d)) { html += `<span class="pill-gap"></span>`; i++; continue; }
    const s = all.find((x) => x.dates.includes(d));
    const cells = [];
    while (i < 7 && inTrip(week[i]) && s.dates.includes(week[i])) cells.push(week[i++]);
    html += pill(s, cells);
  }
  html += week.map((d) => {
    if (!inTrip(d)) return `<span class="day out" aria-hidden="true"><span class="typed">${weekday(d)}</span><b class="nums">${dom(d)}</b></span>`;
    const on = d === state.focus;
    return `<button type="button" class="day" data-day="${d}"${on ? ' aria-current="date"' : ""} title="${shortDate(d)}"><span class="typed">${weekday(d)}</span><b class="nums">${dom(d)}</b></button>`;
  }).join("");
  return html;
}

function weekLabel(week) {
  const trip = week.filter(inTrip);
  return formatRange(trip[0], trip.at(-1));
}

function strip() {
  const weeks = weeksFor();
  const w = Math.max(0, Math.min(state.week, weeks.length - 1));
  const week = weeks[w];
  const prev = `<button type="button" class="step" data-step="-1" aria-label="Week before"${w === 0 ? " disabled" : ""}>${ico("chevL")}</button>`;
  const next = `<button type="button" class="step" data-step="1" aria-label="Week after"${w === weeks.length - 1 ? " disabled" : ""}>${ico("chevR")}</button>`;
  const grid = `<div class="week" role="group" aria-label="${esc(weekLabel(week))}">${weekCells(week)}</div>`;
  const label = `<p class="strip-note nums">Days ${dayNo(week.filter(inTrip)[0])}–${dayNo(week.filter(inTrip).at(-1))} of ${DAYS.length}</p>`;
  return `<div class="strip">${label}<div class="strip-row">${prev}${grid}${next}</div></div>`;
}

function focusHeads() {
  const i = DAYS.indexOf(state.focus);
  const col = (d, kind) => {
    if (!d) return `<div class="fh ghost-cap"><span class="typed">${kind === "prev" ? "Trip starts" : "Last day"}</span></div>`;
    const s = stopOf(d);
    const evs = EVENTS[d] ?? 0;
    if (kind !== "focus") return `<div class="fh side"><span class="typed">${weekday(d)}</span><b class="nums">${dom(d)}</b></div>`;
    return `<div class="fh focus"><h3>${shortDate(d)}</h3><p class="nums">Day ${dayNo(d)} of ${DAYS.length} · ${s.place ? esc(s.place) : "No overnight place"} · ${evs} event${evs === 1 ? "" : "s"}</p></div>`;
  };
  return `<div class="heads"><span class="gutter"></span>${col(DAYS[i - 1], "prev")}${col(state.focus, "focus")}${col(DAYS[i + 1], "next")}</div>`;
}

function ghostGrid() {
  const hours = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];
  return `<div class="grid-ghost" aria-hidden="true">${hours.map((h) => `<div class="hr"><span class="nums">${h}</span><i></i><i></i><i></i></div>`).join("")}` +
    `<div class="blk b1">Breakfast</div><div class="blk b2">Walking tour</div><div class="blk b3">Dinner</div></div>`;
}

// The run each in-trip night belongs to, shown as a labelled bar under the numbers.
function runsIn(week, placeOf) {
  const out = [];
  week.forEach((d, i) => {
    const place = d && inTrip(d) ? placeOf(d) : undefined;
    const last = out.at(-1);
    if (last && place !== undefined && last.place === place && last.on === (state.dlg && inStay(d))) { last.span++; return; }
    out.push({ place, span: 1, i, d, on: !!(state.dlg && d && inStay(d)) });
  });
  return out;
}
const inStay = (d) => !!state.dlg && d >= state.dlg.start && d <= state.dlg.end;

function monthCal(ym, { pressable, mark, data, bars, placeOf = (d) => state.night[d] }) {
  const head = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => `<span class="typed">${w}</span>`).join("");
  const rows = monthGrid(ym).map((week) => {
    const nums = week.map((d) => {
      if (!d) return `<span class="mc-cell empty"></span>`;
      const can = pressable(d);
      const m = mark(d);
      const cls = `mc-cell${m ? ` on${m === "edge-s" || m === "edge-se" ? " s" : ""}${m === "edge-e" || m === "edge-se" ? " e" : ""}` : ""}${inTrip(d) ? "" : " out"}`;
      return can
        ? `<button type="button" class="${cls}" data-${data}="${d}" aria-pressed="${!!m}" aria-label="${shortDate(d)}"><b class="nums">${dom(d)}</b></button>`
        : `<span class="${cls}"><b class="nums">${dom(d)}</b></span>`;
    }).join("");
    const bar = bars && week.some((d) => d && inTrip(d)) ? `<div class="mc-bars">${runsIn(week, placeOf).map((r) =>
      r.place === undefined
        ? `<span style="grid-column: span ${r.span}"></span>`
        : `<span class="bar${r.on ? " on" : ""}${r.place ? "" : " unset"}" style="grid-column: span ${r.span}">${esc(r.place ?? "Not set")}</span>`).join("")}</div>` : "";
    return `<div class="mc-row">${nums}</div>${bar}`;
  }).join("");
  return `<div class="mc"><p class="mc-month">${monthName(ym)}</p><div class="mc-head">${head}</div>${rows}</div>`;
}

function openDialog(start) {
  const s = stops().find((x) => x.start === start);
  state.dlg = { start: s.start, end: s.end === END && s.dates.length > 1 ? addDays(END, -1) : s.end, place: s.place ?? "", was: s, picking: null };
  render();
}

function preview(d) {
  const g = state.dlg;
  if (d >= g.start && d <= g.end) return g.place.trim() || null;
  if (d >= g.was.start && d <= g.was.end && g.was.place) return null;
  return state.night[d];
}

function nightsLine() {
  const g = state.dlg;
  const n = dateRange(g.start, g.end).length;
  const taken = [];
  dateRange(g.start, g.end).forEach((d) => {
    const p = state.night[d];
    if (!p || p === g.was.place) return;
    const last = taken.at(-1);
    if (last && last.place === p && addDays(last.to, 1) === d) last.to = d;
    else taken.push({ place: p, from: d, to: d });
  });
  return `<p class="ov-nights nums" aria-live="polite">${nightsWord(n)}, ${formatRange(g.start, addDays(g.end, 1))}</p>` +
    taken.map((t) => `<p class="ov-taken">Takes ${t.from === t.to ? shortDate(t.from) : formatRange(t.from, t.to)} from ${esc(t.place)}.</p>`).join("");
}

function lastNightPicker() {
  const g = state.dlg;
  const months = [...new Set(DAYS.map((d) => d.slice(0, 7)))];
  const mark = (d) => {
    if (!inStay(d)) return false;
    const s = d === g.start || dow(d) === 0, e = d === g.end || dow(d) === 6;
    return s && e ? "edge-se" : s ? "edge-s" : e ? "edge-e" : "mid";
  };
  const opts = { pressable: inTrip, mark, data: "range", bars: true, placeOf: preview };
  const title = "First and last night";
  return `<span class="ov-label typed">${title}</span>${months.map((ym) => monthCal(ym, opts)).join("")}${nightsLine()}`;
}

function dialog() {
  const g = state.dlg;
  const place = g.place.trim();
  return `<div class="ov-back" data-close></div><div class="ov" role="dialog" aria-modal="true" aria-label="Overnight from ${shortDate(g.start)}">` +
    `<div class="ov-head"><div class="ov-top nums"><span>Overnight from ${shortDate(g.start)}</span><button type="button" class="ov-x" data-close aria-label="Close">${ico("cross")}</button></div>` +
    `<div class="ov-place"><span class="ov-bed">${ico("bed")}</span><input class="ov-input" data-place value="${esc(g.place)}" aria-label="Where you sleep" autocomplete="off"></div></div>` +
    `<div class="ov-part">${lastNightPicker()}</div>` +
    (place ? `<section class="ov-find"><p>Find a stay in ${esc(place)}</p><div class="ov-sites"><span>Booking.com</span><span>Airbnb</span><span>Hostelworld</span></div><p class="ov-off">Opens the site in a new tab.</p></section>` : "") +
    `<footer class="ov-foot">${g.was.place ? `<button type="button" class="ov-clear typed" data-clear>Clear place</button>` : ""}` +
    `<button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn btn-primary" data-save${place ? "" : " disabled"}>Save</button></footer></div>`;
}

function render() {
  const page = document.getElementById("page");
  page.innerHTML =
    `<section class="days-card">${strip()}` +
    `<div class="below"><div class="toolbar"><span class="btn btn-quiet">Today</span><span class="btn btn-quiet">${ico("plus")} Add</span></div>${focusHeads()}${ghostGrid()}</div>` +
    `<p class="ghost-label typed">Below the strip: day columns, unchanged</p></section>`;
  document.getElementById("dlg")?.remove();
  if (state.dlg) {
    const host = document.createElement("div");
    host.id = "dlg";
    host.innerHTML = dialog();
    document.body.appendChild(host);
  }
}

function saveDialog() {
  const g = state.dlg;
  const place = g.place.trim();
  if (!place) return;
  if (g.was.place) dateRange(g.was.start, g.was.end).forEach((d) => { if (d > g.end || d < g.start) state.night[d] = null; });
  dateRange(g.start, g.end).forEach((d) => { state.night[d] = place; });
  if (g.end === addDays(END, -1) && state.night[END] !== place) state.night[END] = place;
  state.dlg = null;
  render();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button, [data-close]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.step) { state.week += Number(ds.step); state.focus = weeksFor()[state.week].find(inTrip); return render(); }
  if (ds.day) { state.focus = ds.day; return render(); }
  if (ds.stop) return openDialog(ds.stop);
  if (ds.range) {
    const g = state.dlg;
    if (g.picking !== "end") { g.start = ds.range; g.end = ds.range; g.picking = "end"; }
    else { if (ds.range < g.start) g.start = ds.range; else g.end = ds.range; g.picking = null; }
    return render();
  }
  if ("save" in ds) return saveDialog();
  if ("clear" in ds) { dateRange(state.dlg.was.start, state.dlg.was.end).forEach((d) => { state.night[d] = null; }); state.dlg = null; return render(); }
  if ("close" in ds) { state.dlg = null; return render(); }
});
document.addEventListener("input", (e) => {
  if (!e.target.matches("[data-place]")) return;
  state.dlg.place = e.target.value;
  const at = e.target.selectionStart;
  render();
  const input = document.querySelector("[data-place]");
  input.focus();
  input.setSelectionRange(at, at);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.dlg) { state.dlg = null; render(); } });

document.getElementById("frame").innerHTML = tripFrame("days", me);

const LIST = [
  { key: "A", name: "Trip weeks: days 1–7, 8–14, 15–17", round: 1 },
  { key: "F", name: "Dialog: pick first and last night", round: 1 },
];

variants(LIST, (key) => {
  state.variant = key;
  state.night = freshNights();
  state.focus = START;
  state.week = 0;
  state.dlg = null;
  if (key === "F") {
    state.focus = "2026-12-15";
    state.week = weekOf("2026-12-15");
    openDialog("2026-12-15");
  } else render();
});
