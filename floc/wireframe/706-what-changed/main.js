import { avatar, esc, ico, isNarrow, toast, tripFrame } from "/_house/kit/trip-frame.mjs";
import { variants } from "/_house/switcher.js";
import { DOLOMITES, EXTRA, ME, PEOPLE, SOME, STOPS, TABS } from "./data.mjs";

const CAP = 6;
const PLAN_ORDER = ["dinner", "lagos", "caves"];
const BELL = '<svg class="g" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.2 9.8V6.2a3.8 3.8 0 0 1 7.6 0v3.6l1 1.2H2.2ZM5.8 12.2h2.4"/></svg>';
const NEEDS = "Data: new logging for events, Notes and files, with old values.";
const UP_TO_DATE = `<p class="wc-none j-none">You are up to date.</p>`;
const STOPS_HEAD = `<div class="wc-head"><h2>Stops</h2></div>`;

const fresh = () => ({ cleared: new Set(), read: new Set(), more: new Set(), open: true, active: null, scroll: false });
const state = { key: "J5", amount: "some", ...fresh() };

const pick = (list) => list.filter((c) => !state.cleared.has(c.id));
const portugal = () => pick(state.amount === "none" ? [] : state.amount === "lots" ? [...SOME, ...EXTRA] : SOME);
const dolomites = () => pick(state.amount === "none" ? [] : DOLOMITES);
const unread = (list) => list.filter((c) => !state.read.has(c.id));
const planFirst = (list) => [
  ...list.filter((c) => c.key).sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key)),
  ...list.filter((c) => !c.key),
];
const tripsNow = () => [
  { id: "portugal", name: "New Year in Portugal", list: portugal() },
  { id: "dolomites", name: "The Dolomites", list: dolomites() },
].filter((t) => t.list.length);
const pageOf = (c) => (c.tab === "people" ? "overview" : c.tab);

function sub(c) {
  const parts = [];
  if (c.place) parts.push(`<span>${esc(c.place)}</span>`);
  if (c.before) parts.push(`<span><s>${esc(c.before)}</s> ${esc(c.after)}</span>`);
  if (c.amount) parts.push(`<span>${esc(c.amount)} in all</span>`);
  return parts.length ? `<span class="wc-sub nums">${parts.join("")}</span>` : "";
}

const inner = (c) =>
  `${avatar(PEOPLE[c.who], 26)}<span class="wc-copy"><span class="wc-say"><b>${esc(PEOPLE[c.who].name)}</b> ${esc(c.text)}</span>${sub(c)}</span>` +
  (c.share ? `<span class="wc-share"><span>Your share</span><b class="nums">${esc(c.share)}</b></span>` : "");

const row = (c) =>
  `<li><button type="button" class="wc-row${state.read.has(c.id) ? " is-read" : ""}" data-act="show:${c.id}"${state.active === c.id ? ' aria-current="true"' : ""}>${inner(c)}</button></li>`;

function capped(list, key) {
  const open = state.more.has(key);
  const shown = open ? list : list.slice(0, CAP);
  const more = !open && list.length > CAP ? `<button type="button" class="wc-more" data-act="more:${key}">Show all ${list.length}</button>` : "";
  return `<ul class="wc-rows">${shown.map(row).join("")}</ul>${more}`;
}

function dayRow(day, marks, note) {
  const c = day.key ? marks.get(day.key) : null;
  const kind = day.name ? `<span class="kind" data-type="${day.type}">${ico(day.glyph)}</span>` : `<span class="kind kind-open"></span>`;
  const name = day.name ? `<span class="day-name">${esc(day.name)}</span>` : `<span class="day-name day-empty">Nothing planned</span>`;
  const time = day.time ? `<span class="day-time nums">${c?.before ? `<s>${esc(c.before)}</s> ` : ""}${esc(day.time)}</span>` : "";
  const by = c ? `<span class="day-by">${avatar(PEOPLE[c.who], 20)}<span class="wc-tag">${esc(c.tag)}</span></span>` : "";
  const more = day.more && !c ? `<span class="more nums">+${day.more}</span>` : "";
  const keyAttr = day.key ? ` data-key="${day.key}"` : "";
  const after = c && note ? note(c) : "";
  return `<li class="day-row${c ? " is-changed" : ""}"${keyAttr}><span class="date"><span class="wd">${day.wd}</span><span>${day.d}</span></span>${kind}${name}<span class="day-end">${by}${time}${more}</span></li>` +
    (after ? `<li class="j5-row">${after}</li>` : "");
}

function stopsHtml(marks = new Map(), note = null) {
  return STOPS.map((stop) => {
    const c = stop.key ? marks.get(stop.key) : null;
    const range = c?.before ? `<s>${esc(c.before)}</s> ${esc(c.after)}` : esc(stop.range);
    const tag = c ? `<span class="day-by">${avatar(PEOPLE[c.who], 20)}<span class="wc-tag">${esc(c.tag)}</span></span>` : "";
    const keyAttr = stop.key ? ` data-key="${stop.key}"` : "";
    return `<article class="stop"><header class="stop-head${c ? " is-changed" : ""}"${keyAttr}><span class="stop-n">${stop.n}</span><h3>${esc(stop.place)}</h3>` +
      `<span class="stop-note">${esc(stop.nights)}, ${range}</span>${tag}</header>${c && note ? note(c) : ""}<ol class="days">${stop.days.map((d) => dayRow(d, marks, note)).join("")}</ol></article>` +
      (stop.hop ? `<p class="hop">${ico("train")}${esc(stop.hop)}</p>` : "");
  }).join("");
}

const ghost = () =>
  `<aside class="wc-ghost" aria-label="Bookings, unchanged"><h3>Bookings</h3><p><span class="nums">1</span> Lisbon <em class="nums">31 Dec – 3 Jan</em></p><p><span class="nums">2</span> Lagos <em class="nums">3–7 Jan</em></p><p>Whole trip</p></aside>`;

const activeMarks = () => {
  const c = portugal().find((x) => x.id === state.active);
  return c?.key ? new Map([[c.key, c]]) : new Map();
};

const plan = (marks = activeMarks(), note = null, head = STOPS_HEAD, rail = ghost()) =>
  `<div class="wc-grid"><div class="wc-main">${head}${stopsHtml(marks, note)}</div>${rail}</div>`;

const panelHead = (title, any) =>
  `<div class="j-head"><h2>${esc(title)}</h2>${any ? `<button type="button" class="wc-btn" data-act="seen">Mark all read</button>` : ""}</div>`;

const byTrip = () =>
  tripsNow().map((t) => `<section><h3>${esc(t.name)}</h3>${capped(planFirst(t.list), `list-${t.id}`)}</section>`).join("") || UP_TO_DATE;

const pop = (body, cls = "") => `<div class="j-pop ${cls}" role="dialog" aria-label="Inbox">${body}</div>`;

const popJ = () => pop(`${panelHead("Inbox", tripsNow().length)}<div class="j-list">${byTrip()}</div>`);

const steps = () => planFirst(portugal().filter((c) => c.key));

function noteJ5(c) {
  if (c.id !== state.active) return "";
  const list = steps();
  const i = list.findIndex((x) => x.id === c.id);
  const next = i === list.length - 1
    ? `<button type="button" class="wc-btn wc-primary" data-act="notedone">Done</button>`
    : `<button type="button" class="j5-step" data-act="note:1" aria-label="Next change">${ico("chevR")}</button>`;
  return `<div class="j5-note" role="status"><p class="j5-copy"><b>${esc(PEOPLE[c.who].name)}</b> ${esc(c.text.split(" ")[0])} this on <span class="nums">${esc(c.when)}</span></p><div class="j5-tools"><button type="button" class="j5-link" data-act="bell">${ico("chevL")}Inbox</button><span class="j5-n nums">${i + 1} of ${list.length}</span>` +
    `<button type="button" class="j5-step" data-act="note:-1" aria-label="Previous change"${i ? "" : " disabled"}>${ico("chevL")}</button>${next}</div></div>`;
}

const VARIANTS = {
  J5: { round: 3, name: "Note on the changed row", reads: true, closes: true, render: () => plan(activeMarks(), noteJ5), panel: popJ, idea: "Press a change and a note opens on that row. Step to the next change from there." },
};

function drawBar() {
  const v = VARIANTS[state.key];
  const amounts = [["some", "Some"], ["lots", "Lots"], ["none", "None"]];
  document.getElementById("bar").innerHTML =
    `<div class="proto-bar"><b>${state.key}. ${esc(v.name)}</b><span class="idea">${esc(v.idea)} ${NEEDS}</span>` +
    `<div class="knob"><span>Changes</span>${amounts.map(([k, l]) => `<button type="button" data-act="amount:${k}" aria-pressed="${state.amount === k}">${l}</button>`).join("")}</div>` +
    `<div class="knob"><button type="button" data-act="reset">Start over</button></div></div>`;
}

function drawFrame() {
  const frame = document.getElementById("frame");
  frame.innerHTML = tripFrame("overview", ME);
  const n = unread([...portugal(), ...dolomites()]).length;
  const count = n ? `<span class="b-count nums">${n}</span>` : "";
  frame.querySelector(".tf-you").insertAdjacentHTML("beforebegin",
    `<button type="button" class="wc-bell" data-act="bell" aria-expanded="${state.open}" aria-label="Inbox${n ? `, ${n} new` : ""}">${BELL}${count}</button>`);
  const panel = VARIANTS[state.key].panel;
  if (state.open && panel) frame.querySelector(".tf-beads").insertAdjacentHTML("beforeend", panel());
}

function showActive() {
  const c = portugal().find((x) => x.id === state.active);
  if (!c?.key) return;
  const el = document.querySelector(`.wc-main [data-key="${c.key}"]`);
  el?.classList.add("is-focus");
  if (state.scroll) el?.scrollIntoView({ block: isNarrow() ? "start" : "nearest" });
  state.scroll = false;
}

function draw() {
  document.body.dataset.v = state.key;
  document.body.dataset.open = String(state.open);
  drawBar();
  drawFrame();
  document.getElementById("stage").innerHTML = VARIANTS[state.key].render();
  showActive();
}

function show(id) {
  const v = VARIANTS[state.key];
  const c = [...portugal(), ...dolomites()].find((x) => x.id === id);
  if (!c) return;
  if (v.reads) state.read.add(id);
  if (dolomites().includes(c)) {
    draw();
    return toast("Opens The Dolomites");
  }
  if (!c.key) {
    draw();
    return toast(`Opens ${TABS[pageOf(c)].label}`);
  }
  state.active = id;
  state.scroll = true;
  if (v.closes) state.open = false;
  draw();
}

function stepNote(by) {
  const list = steps();
  const i = list.findIndex((x) => x.id === state.active);
  const next = list[i + Number(by)];
  if (!next) return;
  state.active = next.id;
  state.read.add(next.id);
  state.scroll = true;
  draw();
}

const ACTIONS = {
  amount: (v) => { state.amount = v; Object.assign(state, fresh()); draw(); },
  reset: () => { Object.assign(state, fresh()); draw(); },
  more: (v) => { state.more.add(v); draw(); },
  bell: () => { state.open = !state.open; draw(); },
  seen: () => {
    [...portugal(), ...dolomites()].forEach((c) => state.cleared.add(c.id));
    state.active = null;
    draw();
    toast("Marked all read");
  },
  show,
  note: stepNote,
  notedone: () => { state.active = null; draw(); },
};

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href="#"]');
  if (link) event.preventDefault();
  const el = event.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  const at = act.indexOf(":");
  const [name, value] = at < 0 ? [act] : [act.slice(0, at), act.slice(at + 1)];
  ACTIONS[name]?.(value);
});

matchMedia("(max-width: 700px)").addEventListener("change", draw);

variants(
  Object.entries(VARIANTS).map(([key, v]) => ({ key, name: v.name, round: v.round })),
  (key) => {
    state.key = key;
    Object.assign(state, fresh());
    draw();
  },
);
