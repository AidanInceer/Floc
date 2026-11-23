import { ico, esc, weekday, dom, monthShort } from "/_house/kit/trip-frame.mjs";
import { DAYS, ME } from "./store.js";

const EXTRA = {
  overview: '<path d="M2 6.4 7 2.2l5 4.2M3.4 5.4v6.4h7.2V5.4M5.8 11.8V8.4h2.4v3.4"/>',
  days: '<path d="M2.4 3.4h1.2M5.6 3.4h6M2.4 7h1.2M5.6 7h6M2.4 10.6h1.2M5.6 10.6h6"/>',
  money: '<path d="M3 1.8h8v10.4l-1.6-1-1.2 1-1.2-1-1.2 1-1.2-1-1.6 1ZM5 5h4M5 7.6h4"/>',
  packing: '<path d="M2.2 4.4 7 2l4.8 2.4v5.2L7 12l-4.8-2.4ZM2.2 4.4 7 6.8l4.8-2.4M7 6.8V12"/>',
  moon: '<path d="M11.4 8.6A4.8 4.8 0 0 1 5.4 2.6a4.8 4.8 0 1 0 6 6Z"/>',
  up: '<path d="M7 11.6V2.6M3.4 6.2 7 2.6l3.6 3.6"/>',
  drink: '<path d="M2.6 2.4h8.8L7 7.6ZM7 7.6v4M4.6 11.6h4.8"/>',
  bulb: '<path d="M5.2 10.2h3.6M5.6 12h2.8M7 1.8a3.6 3.6 0 0 0-2.2 6.4c.4.3.5.7.5 1.1v.9h3.4v-.9c0-.4.1-.8.5-1.1A3.6 3.6 0 0 0 7 1.8Z"/>',
  bell: '<path d="M3.4 9.8V6.4a3.6 3.6 0 0 1 7.2 0v3.4l1 1.2H2.4ZM5.8 12.2h2.4"/>',
  gear: '<circle cx="7" cy="7" r="1.8"/><path d="M7 1.8v1.6M7 10.6v1.6M1.8 7h1.6M10.6 7h1.6M3.3 3.3l1.1 1.1M9.6 9.6l1.1 1.1M10.7 3.3 9.6 4.4M4.4 9.6l-1.1 1.1"/>',
  upload: '<path d="M7 9.2V2.4M4 5.2l3-2.8 3 2.8M2.4 9.4v2.2h9.2V9.4"/>',
  out: '<path d="M4 10 10 4M5.2 4H10v4.8"/>',
  invite: '<circle cx="5.2" cy="5" r="2"/><path d="M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3M10.6 3.8v3.4M8.9 5.5h3.4"/>',
  sliders: '<path d="M2 4.4h6M10.6 4.4H12M2 9.6h1.4M6 9.6h6"/><circle cx="9.3" cy="4.4" r="1.3"/><circle cx="4.7" cy="9.6" r="1.3"/>',
  grip: '<circle cx="5" cy="3.6" r=".7"/><circle cx="9" cy="3.6" r=".7"/><circle cx="5" cy="7" r=".7"/><circle cx="9" cy="7" r=".7"/><circle cx="5" cy="10.4" r=".7"/><circle cx="9" cy="10.4" r=".7"/>',
  move: '<path d="M2.2 7h9.6M9 4.2 11.8 7 9 9.8M5 4.2 2.2 7 5 9.8"/>',
  pencil: '<path d="M2.4 11.6 3 9l6-6 2 2-6 6Z"/>',
};

export const gl = (name, cls = "") =>
  EXTRA[name] ? `<svg class="g ${cls}" viewBox="0 0 14 14" aria-hidden="true">${EXTRA[name]}</svg>` : ico(name, cls);

export const dayLabel = (iso) => `${weekday(iso)} ${dom(iso)} ${monthShort(iso)}`;

export function voteBtn(idea, cls = "") {
  const mine = idea.votes.includes(ME);
  const n = idea.votes.length;
  const count = n === 1 ? "1 vote" : `${n} votes`;
  return `<button type="button" class="vote ${cls}" data-a="vote" data-id="${idea.id}" aria-pressed="${mine}" aria-label="${mine ? "Take back your vote for" : "Vote for"} ${esc(idea.title)}, ${count}">${gl("up")}<span class="nums">${n}</span></button>`;
}

export function track(ctx, cls = "") {
  const options = [{ id: "all", label: "All" }, ...ctx.s.cats];
  const buttons = options.map((o) => {
    const n = ctx.store.live(o.id).length;
    return `<button type="button" data-a="cat" data-id="${o.id}" aria-pressed="${ctx.ui.cat === o.id}"><span>${esc(o.label)}</span><span class="ct-n nums">${n}</span></button>`;
  }).join("");
  const adder = ctx.ui.catNew
    ? `<form class="ct-new" data-f="cat"><input name="label" maxlength="20" aria-label="New category name" data-keep="cat-new" autocomplete="off"><button type="submit" class="btn btn-primary">Add</button><button type="button" class="ibtn" data-a="cat-new" aria-label="Cancel new category">${gl("cross")}</button></form>`
    : `<button type="button" class="ct-plus" data-a="cat-new" aria-label="Add a category">${gl("plus")}</button>`;
  return `<div class="ct ${cls}">
    <button type="button" class="ct-step" data-a="cat-step" data-by="-1" aria-label="Previous category">${gl("chevL")}</button>
    <div class="ct-track" role="group" aria-label="Show ideas by category" data-scroll="cats"><span class="ct-tile" aria-hidden="true"></span>${buttons}</div>
    <button type="button" class="ct-step" data-a="cat-step" data-by="1" aria-label="Next category">${gl("chevR")}</button>
    ${adder}
  </div>`;
}

export function addField(ctx, { fixedCat = null, key = "main", cls = "", label = "" } = {}) {
  const current = fixedCat ?? (ctx.ui.cat !== "all" ? ctx.ui.cat : "other");
  const picker = fixedCat
    ? `<input type="hidden" name="cat" value="${fixedCat}">`
    : `<label class="af-cat"><span class="sr">Category</span><select name="cat">${ctx.s.cats.map((c) => `<option value="${c.id}"${c.id === current ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</select>${gl("chev")}</label>`;
  const named = label ? `<span class="af-label typed" aria-hidden="true">${esc(label)}</span>` : "";
  return `<form class="af ${cls}" data-f="idea">${named}<input name="title" maxlength="80" aria-label="New idea" data-keep="add-${key}" autocomplete="off">${picker}<button type="submit" class="af-go">Add</button></form>`;
}

export const TIMES = [["", "No time"], ["09:00", "Morning"], ["13:00", "Lunch"], ["15:00", "Afternoon"], ["19:30", "Dinner"], ["22:00", "Late"]];

export function dayChips(selected, action = "when-day", extra = "") {
  return `<div class="dch" role="group" aria-label="Day" data-scroll="days-${action}${extra.replace(/\W/g, "")}">${DAYS.map((d) =>
    `<button type="button" data-a="${action}" data-day="${d.date}" ${extra} aria-pressed="${selected === d.date}"><span class="typed">${weekday(d.date)}</span><b class="nums">${dom(d.date)}</b><small>${d.place}</small></button>`).join("")}</div>`;
}

export function timeChips(selected) {
  const custom = selected && !TIMES.some(([t]) => t === selected);
  return `<div class="tch" role="group" aria-label="Time">${TIMES.map(([t, label]) =>
    `<button type="button" data-a="when-time" data-time="${t}" aria-pressed="${(selected ?? "") === t}">${label}${t ? `<span class="nums">${t}</span>` : ""}</button>`).join("")}${
    custom ? `<button type="button" aria-pressed="true" data-a="when-time" data-time="${selected}">Set<span class="nums">${selected}</span></button>` : ""}</div>`;
}

export function placeModal(ctx) {
  const id = ctx.ui.placeId;
  if (!id) return "";
  const idea = ctx.store.idea(id);
  const when = ctx.ui.when;
  return `<div class="ov" data-a="place-cancel" data-self><section class="dlg" role="dialog" aria-modal="true" aria-label="Add ${esc(idea.title)} to Days">
    <header class="dlg-h t-${ctx.store.cat(idea.cat).type}"><h2>${esc(idea.title)}</h2><button type="button" class="ibtn" data-a="place-cancel" aria-label="Close">${gl("cross")}</button></header>
    <div class="dlg-p"><h3 class="ptitle">Day</h3>${dayChips(when.day)}</div>
    <div class="dlg-p"><h3 class="ptitle">Time</h3>${timeChips(when.time)}</div>
    <footer class="dlg-f"><button type="button" class="btn" data-a="place-cancel">Cancel</button><button type="button" class="btn btn-primary" data-a="place-confirm"${when.day ? "" : " disabled"}>Add to Days</button></footer>
  </section></div>`;
}
