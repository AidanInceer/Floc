import { ico, esc, dateRange, weekday, dom, shortDate, openSheet, closeSheet, sheetHead, toast, isNarrow } from "/_house/kit/trip-frame.mjs";
import { TRIP, STOPS, freshEvents } from "./data.js";

export const DAYS = dateRange(TRIP.start, TRIP.end);
export const state = { variant: "A", focus: "2026-12-25", selected: null, events: freshEvents(), mode: "list", hover: null };
export const reset = () => { HOURS.from = 7; return Object.assign(state, { focus: "2026-12-25", selected: null, events: freshEvents(), mode: "list", hover: null }); };

let rerender = () => {};
export const onChange = (fn) => { rerender = fn; };
export const refresh = () => rerender();

export const TYPES = [["food", "Food"], ["activity", "Activity"], ["transport", "Transport"], ["other", "Other"]];
export const typeIcon = (e) => ico(e.type === "transport" ? (e.mode ?? "train") : e.type === "other" ? "pin" : e.type);
export const dayNo = (d) => DAYS.indexOf(d) + 1;
export const inTrip = (d) => DAYS.includes(d);
export const stopOf = (d) => STOPS.find((s) => d >= s.from && d <= s.to);
export const nightsOf = (s) => DAYS.filter((d) => d >= s.from && d <= s.to && d !== TRIP.end).length;
export const nightsWord = (n) => `${n} night${n === 1 ? "" : "s"}`;
export const eventsOn = (d) => state.events.filter((e) => e.date === d).sort((a, b) => a.time.localeCompare(b.time));
export const mins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const span = (e) => (e.allDay ? "All day" : `${e.time}–${e.end}`);
export const timedOn = (d) => eventsOn(d).filter((e) => !e.allDay);
export const allDayOn = (d) => eventsOn(d).filter((e) => e.allDay);
export const longDate = (d) => `${weekday(d)} ${dom(d)} December`;
export const step = (n) => { const i = DAYS.indexOf(state.focus) + n; if (i >= 0 && i < DAYS.length) { state.focus = DAYS[i]; state.selected = null; refresh(); } };
export const MOON = '<svg class="g" viewBox="0 0 14 14" aria-hidden="true"><path d="M11.2 8.8A4.8 4.8 0 0 1 5.2 2.8a4.8 4.8 0 1 0 6 6Z"/></svg>';

export function stopPill(s, { cols, cutL, cutR, compact } = {}) {
  const n = nightsOf(s);
  return `<button type="button" class="stop" data-stop="${s.from}"${cols ? ` style="grid-column: span ${cols}"` : ""} title="${esc(`${s.place}, ${nightsWord(n)}`)}" aria-label="${esc(`Overnight: ${s.place}, ${nightsWord(n)}`)}">` +
    `${cutL ? ico("chevL", "cut") : ""}${ico("bed")}<b>${esc(s.place)}</b>${compact ? "" : `<small class="nums">${n}${MOON}</small>`}${cutR ? ico("chevR", "cut") : ""}</button>`;
}

export function stopRuns(dates) {
  const out = [];
  dates.forEach((d) => {
    const s = d && inTrip(d) ? stopOf(d) : null;
    const last = out.at(-1);
    if (last && last.s === s) { last.n++; return; }
    out.push({ s, n: 1, first: d });
  });
  return out;
}

export const addBtn = (date, words = "Add event") =>
  `<button type="button" class="btn btn-primary" data-add="${date}">${ico("plus")}${words}</button>`;

export const dayFacts = (d) => {
  const s = stopOf(d);
  const n = eventsOn(d).length;
  return `Day ${dayNo(d)} of ${DAYS.length} · ${esc(s.place)} · ${n ? `${n} event${n === 1 ? "" : "s"}` : "Nothing planned"}`;
};

export function block(e, { top, height, left = 0, width = 100, slim } = {}) {
  const on = state.selected === e.id;
  const style = top == null ? "" : ` style="top:${top}px;height:${height}px;left:${left}%;width:${width}%"`;
  return `<button type="button" class="blk t-${e.type}${on ? " on" : ""}${height && height < 34 ? " short" : ""}${slim ? " slim" : ""}" data-ev="${e.id}"${style} title="${esc(`${e.title}, ${span(e)}`)}">` +
    `<span class="blk-t">${typeIcon(e)}<b>${esc(e.title)}</b></span><span class="blk-time nums">${span(e)}</span></button>`;
}

export function allDayRow(dates, template) {
  const cells = dates.map((d) => {
    if (!d || !inTrip(d)) return `<div class="adcell out"></div>`;
    const chips = allDayOn(d).map((e) =>
      `<button type="button" class="adchip t-${e.type}${state.selected === e.id ? " on" : ""}" data-ev="${e.id}" title="${esc(e.title)}, all day">${typeIcon(e)}<b>${esc(e.title)}</b></button>`).join("");
    return `<div class="adcell${d === state.focus ? " focus" : ""}">${chips}</div>`;
  }).join("");
  return `<div class="adrow" style="grid-template-columns:${template}"><span class="adlabel typed">All day</span>${cells}</div>`;
}

export const HOURS = { from: 7, to: 24 };
export function hourGrid(dates, { hourPx = 48, template, heads = "", narrowOne = false, compact = [] } = {}) {
  const rows = HOURS.to - HOURS.from;
  const height = rows * hourPx;
  const marks = Array.from({ length: rows }, (_, i) => `<span class="hr-mark nums" style="top:${i * hourPx}px">${String(HOURS.from + i).padStart(2, "0")}:00</span>`).join("");
  const cols = dates.map((d) => {
    if (!d || !inTrip(d)) return `<div class="hcol out" style="height:${height}px"></div>`;
    const blocks = timedOn(d).map((e) => {
      const top = ((mins(e.time) - HOURS.from * 60) / 60) * hourPx;
      const h = Math.max(22, ((mins(e.end) - mins(e.time)) / 60) * hourPx - 3);
      return block(e, { top, height: h });
    }).join("");
    return `<div class="hcol${d === state.focus ? " focus" : ""}${compact.includes(d) ? " compact" : ""}" data-col="${d}" style="height:${height}px;--hour:${hourPx}px">${blocks}</div>`;
  }).join("");
  return `<div class="hgrid${narrowOne ? " one" : ""}" style="grid-template-columns:${template}"><div class="ghead">${heads}${allDayRow(dates, template)}</div><div class="gutter" style="height:${height}px">${marks}</div>${cols}</div>`;
}

function typeTiles(current) {
  return `<div class="type-tiles" role="radiogroup" aria-label="Type">${TYPES.map(([k, l]) =>
    `<button type="button" role="radio" class="ttile t-${k}" data-type="${k}" aria-checked="${current === k}">${ico(k === "transport" ? "train" : k === "other" ? "pin" : k)}<span>${l}</span></button>`).join("")}</div>`;
}

export function eventForm(e, date) {
  const v = e ?? { title: "", type: "", time: "", end: "", place: "", allDay: false };
  const off = v.allDay ? " disabled" : "";
  return `<form class="evform" data-form="${e ? e.id : "new"}" data-date="${e ? e.date : date}">` +
    `<label class="field"><span class="typed">Title</span><input name="title" value="${esc(v.title)}" required></label>` +
    `${typeTiles(v.type)}<input type="hidden" name="type" value="${esc(v.type)}">` +
    `<label class="check"><input type="checkbox" name="allDay"${v.allDay ? " checked" : ""}> All day</label>` +
    `<div class="field-row"><label class="field"><span class="typed">Starts</span><input name="time" class="nums" value="${esc(v.time)}" pattern="[0-2][0-9]:[0-5][0-9]" required${off}></label>` +
    `<label class="field"><span class="typed">Ends</span><input name="end" class="nums" value="${esc(v.end)}" pattern="[0-2][0-9]:[0-5][0-9]" required${off}></label></div>` +
    `<label class="field"><span class="typed">Place</span><input name="place" class="prose" value="${esc(v.place)}"></label>` +
    `<div class="sheet-foot">${e ? `<button type="button" class="btn btn-ghost danger-word" data-del="${e.id}">Delete</button><span class="grow"></span>` : ""}<button type="submit" class="btn btn-primary">${e ? "Save" : "Add event"}</button></div></form>`;
}

export function openEvent(id) {
  const e = state.events.find((x) => x.id === id);
  state.selected = id;
  refresh();
  openSheet(`${sheetHead(shortDate(e.date))}<div class="sheet-body">${eventForm(e)}</div>`, "side");
}
export function openAdd(date) {
  openSheet(`${sheetHead(`Add to ${shortDate(date)}`)}<div class="sheet-body">${eventForm(null, date)}</div>`, "side");
}

function fromForm(form) {
  const f = new FormData(form);
  const allDay = f.get("allDay") === "on";
  return { title: f.get("title").trim(), type: f.get("type") || "other", time: allDay ? "" : f.get("time"), end: allDay ? "" : f.get("end"), place: f.get("place").trim(), allDay };
}

document.addEventListener("change", (ev) => {
  if (ev.target.name !== "allDay") return;
  const { time, end } = ev.target.form.elements;
  time.disabled = end.disabled = ev.target.checked;
});

document.addEventListener("click", (ev) => {
  const t = ev.target.closest("[data-type]");
  if (t && t.closest(".evform")) {
    const form = t.closest(".evform");
    form.querySelectorAll("[data-type]").forEach((b) => b.setAttribute("aria-checked", String(b === t)));
    form.elements.type.value = t.dataset.type;
    return;
  }
  const del = ev.target.closest("[data-del]");
  if (del) {
    state.events = state.events.filter((x) => x.id !== Number(del.dataset.del));
    state.selected = null;
    closeSheet();
    toast("Event deleted");
    refresh();
  }
});

document.addEventListener("submit", (ev) => {
  const form = ev.target.closest(".evform");
  if (!form) return;
  ev.preventDefault();
  const v = fromForm(form);
  if (!v.allDay && mins(v.end) <= mins(v.time)) { form.elements.end.setCustomValidity("Ends after it starts"); form.reportValidity(); form.elements.end.setCustomValidity(""); return; }
  if (form.dataset.form === "new") {
    const id = Math.max(0, ...state.events.map((x) => x.id)) + 1;
    state.events.push({ id, date: form.dataset.date, at: stopOf(form.dataset.date).place === "Lisbon" ? [38.712, -9.138] : [37.1, -8.672], ...v });
    state.selected = id;
    toast("Event added");
  } else {
    Object.assign(state.events.find((x) => x.id === Number(form.dataset.form)), v);
    toast("Saved");
  }
  if (!form.closest("dialog")) { refresh(); return; }
  closeSheet();
  refresh();
});

export function wireCommon(root) {
  root.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => step(Number(b.dataset.step))));
  root.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openAdd(b.dataset.add); }));
  root.querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => { state.focus = b.dataset.day; state.selected = null; refresh(); }));
  root.querySelectorAll("[data-stop]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toast(`Opens where you sleep from ${shortDate(b.dataset.stop)}`); }));
}

export { ico, esc, weekday, dom, shortDate, isNarrow, toast };
