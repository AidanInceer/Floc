import { state, DAYS, inTrip, stopRuns, stopPill, addBtn, openEvent, wireCommon, ico, weekday, dom, refresh, HOURS } from "./shared.js";
import { addDays } from "/_house/kit/trip-frame.mjs";

export const weeks = () => {
  const out = [];
  for (let i = 0; i < DAYS.length; i += 7) {
    const w = DAYS.slice(i, i + 7);
    while (w.length < 7) w.push(addDays(w.at(-1), 1));
    out.push(w);
  }
  return out;
};
export const weekOfFocus = () => weeks().findIndex((w) => w.includes(state.focus));

export function stopCells(dates, gutter) {
  const all = stopRuns(dates);
  return (gutter ? "<span></span>" : "") + all.map((r, i) => r.s
    ? stopPill(r.s, { cols: r.n, cutL: i === 0 && r.s.from < dates[0], cutR: i === all.length - 1 && r.s.to > dates.at(-1) })
    : `<span class="stop-gap" style="grid-column: span ${r.n}"></span>`).join("");
}

export function strip(visible = [], ws = weeks(), attr = "week") {
  const w = ws.findIndex((x) => x.includes(state.focus));
  const week = ws[w];
  const inside = week.filter(inTrip);
  const days = week.map((d) => {
    if (!inTrip(d)) return `<span class="sday out" aria-hidden="true"><span class="typed">${weekday(d)}</span><b class="nums">${dom(d)}</b></span>`;
    const cls = `sday${visible.includes(d) ? " inview" : ""}${visible[0] === d ? " first" : ""}${visible.at(-1) === d ? " last" : ""}`;
    return `<button type="button" class="${cls}" data-day="${d}"${d === state.focus ? ' aria-current="date"' : ""}><span class="typed">${weekday(d)}</span><b class="nums">${dom(d)}</b></button>`;
  }).join("");
  return `<div class="wstrip"><p class="wstrip-note nums">Days ${DAYS.indexOf(inside[0]) + 1}–${DAYS.indexOf(inside.at(-1)) + 1} of ${DAYS.length}</p>` +
    `<div class="wstrip-row"><button type="button" class="wstep" data-${attr}="-1" aria-label="Week before"${w === 0 ? " disabled" : ""}>${ico("chevL")}</button>` +
    `<div class="wgrid"><div class="wpills">${stopCells(week)}</div><div class="wdays">${days}</div></div>` +
    `<button type="button" class="wstep" data-${attr}="1" aria-label="Week after"${w === ws.length - 1 ? " disabled" : ""}>${ico("chevR")}</button></div></div>`;
}

export function toolbar(extra = "") {
  return `<div class="toolbar"><div class="stepper"><button type="button" class="iconbtn edge" data-step="-1" aria-label="Day before"${state.focus === DAYS[0] ? " disabled" : ""}>${ico("chevL")}</button>` +
    `<button type="button" class="iconbtn edge" data-step="1" aria-label="Day after"${state.focus === DAYS.at(-1) ? " disabled" : ""}>${ico("chevR")}</button></div>${extra}<span class="grow"></span>` +
    `<button type="button" class="btn btn-ghost" data-fold aria-pressed="${HOURS.from === 0}">${ico("fold")}${HOURS.from === 0 ? "Fold empty hours" : "Every hour"}</button>${addBtn(state.focus)}</div>`;
}

export function wireMix(root) {
  wireCommon(root);
  root.querySelectorAll("[data-ev]").forEach((b) => b.addEventListener("click", () => openEvent(Number(b.dataset.ev))));
  root.querySelectorAll("[data-week]").forEach((b) => b.addEventListener("click", () => {
    const ws = weeks();
    const w = Math.max(0, Math.min(ws.length - 1, weekOfFocus() + Number(b.dataset.week)));
    const at = ws[w].indexOf(state.focus) >= 0 ? ws[w].indexOf(state.focus) : weeks()[weekOfFocus()].indexOf(state.focus);
    const target = ws[w].filter(inTrip);
    state.focus = target[Math.min(at, target.length - 1)];
    state.selected = null;
    refresh();
  }));
  root.querySelector("[data-fold]")?.addEventListener("click", () => { HOURS.from = HOURS.from === 0 ? 7 : 0; refresh(); });
  root.querySelectorAll(".hcol[data-col]").forEach((c) => c.addEventListener("dblclick", () => { state.focus = c.dataset.col; refresh(); }));
  const sc = root.querySelector(".scroller");
  if (sc) sc.scrollTop = HOURS.from === 0 ? 46 * 8 : 46;
}
