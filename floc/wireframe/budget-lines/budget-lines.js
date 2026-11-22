import { esc, ico, tripFrame } from "/_house/kit/trip-frame.mjs";
import { variants } from "/_house/switcher.js";

const ME = { name: "Priya", initial: "Pr", tone: 1 };
const BUDGET = 950;
const FLIGHT_EXPENSE = 64;

const LINES = [
  { key: "travel", label: "Flights", icon: "flight", detail: "LHR to Paris, Lyon to LHR · Economy", range: [90, 170], spent: 0 },
  { key: "stay", label: "Stay", icon: "bed", detail: "5 nights · Mid-range · your share", range: [240, 420], spent: 98 },
  { key: "food", label: "Food and drink", icon: "food", detail: "6 days · Mid-range", range: [180, 300], spent: 24 },
  { key: "activities", label: "Activities", icon: "activity", detail: "6 days · Balanced", range: [60, 150], spent: 0 },
  { key: "transport", label: "Getting around", icon: "pin", detail: "6 days · trains, buses and taxis", range: [36, 72], spent: 0 },
];

const WAYS = {
  fly: { label: "Flights", icon: "flight" },
  train: { label: "Train", icon: "train", detail: "No guide for trains yet. Add your own figure." },
  drive: { label: "Driving", icon: "car", detail: "No guide for driving yet. Add your own figure." },
  ferry: { label: "Ferry", icon: "ferry", detail: "No guide for ferries yet. Add your own figure." },
};

const IDEA = "Press the name Flights to change the type. The … menu changes a figure in the row or removes a line.";
const SPENT_NOTE = "Not in your budget. The spending still counts.";

const fresh = () => ({ off: new Set(), way: "fly", own: null, figs: {}, editing: null, extra: 0, menu: null });
let s = fresh();

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const span = (r) => (r[0] === r[1] ? money(r[0]) : `${money(r[0])}–${money(r[1])}`);
const pct = (v, max) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
const savedFigure = (key) => (key === "travel" ? s.own : s.figs[key]);
const lineName = (l) => (l.key === "travel" ? "Getting there" : l.label);
const needsFigure = (l) => l.key === "travel" && !l.out && !l.plan;

function view(line) {
  const out = s.off.has(line.key);
  const spent = line.spent + (line.key === "travel" ? s.extra : 0);
  const own = savedFigure(line.key);
  let { label, icon, detail, range: plan } = line;
  if (line.key === "travel" && s.way !== "fly") {
    ({ label, icon, detail } = WAYS[s.way]);
    plan = null;
  }
  if (own != null) {
    plan = [own, own];
    detail = "Your figure";
  }
  return { key: line.key, label, icon, detail, plan: out ? null : plan, spent, out };
}

const lines = () => LINES.map(view);

function totals() {
  const all = lines();
  const low = all.reduce((sum, l) => sum + (l.plan?.[0] ?? 0), 0);
  const high = all.reduce((sum, l) => sum + (l.plan?.[1] ?? 0), 0);
  const spent = all.reduce((sum, l) => sum + l.spent, 0);
  return { range: [low, high], spent, left: BUDGET - spent };
}

function fit([low, high]) {
  if (!s.off.has("travel") && s.way !== "fly" && s.own == null) return { word: `Add your ${WAYS[s.way].label.toLowerCase()} figure`, tone: "" };
  if (BUDGET >= high) return { word: "Fits", tone: "good" };
  if (BUDGET >= low) return { word: `Tight · up to ${money(high - BUDGET)} short`, tone: "warn" };
  return { word: `Over by ${money(low - BUDGET)}`, tone: "bad" };
}

function progress(l) {
  if (!l.plan) return { word: "No guide", tone: "" };
  if (l.spent === 0) return { word: "Not started", tone: "" };
  if (l.spent > l.plan[1]) return { word: `Over by ${money(l.spent - l.plan[1])}`, tone: "bad" };
  if (l.spent >= l.plan[0]) return { word: "In range", tone: "good" };
  return { word: `${span([l.plan[0] - l.spent, l.plan[1] - l.spent])} to go`, tone: "" };
}

const badge = ({ word, tone }) => `<span class="bl-badge ${tone}">${esc(word)}</span>`;
const icon = (l) => `<span class="bl-ic">${ico(l.icon)}</span>`;

function bar(spent, plan, budget, thin) {
  const max = Math.max(plan?.[1] ?? 0, spent, budget ?? 0) * 1.1 || 1;
  const band = plan ? `<i class="plan" style="left:${pct(plan[0], max)};width:${pct(plan[1] - plan[0], max)};min-width:4px"></i>` : "";
  const mark = budget != null ? `<i class="mark" style="left:${pct(budget, max)}"></i>` : "";
  return `<span class="bl-bar${thin ? " thin" : ""}" aria-hidden="true">${band}<i class="spent" style="width:${pct(spent, max)}"></i>${mark}</span>`;
}

function summary() {
  const t = totals();
  const figure = (label, value) => `<span class="bl-figure"><span>${label}</span><b>${value}</b></span>`;
  return `<div class="bl-summary"><div class="bl-figures">${figure("Budget", money(BUDGET))}${figure("Spent", money(t.spent))}${figure("Left", money(t.left))}${figure("Estimate", span(t.range))}<span class="bl-fit">${badge(fit(t.range))}</span></div>${bar(t.spent, t.range, BUDGET, true)}</div>`;
}

function cell(l) {
  const figure = l.plan ? `${money(l.spent)} of ${span(l.plan)}` : "";
  return `<span class="bl-cell">${figure ? `<span class="nums">${figure}</span>` : ""}${badge(progress(l))}</span>`;
}

function figureField(l) {
  return `<span class="bl-cell"><label class="bl-inline"><span class="typed">Your figure</span><span class="bl-money">£<input data-own="${l.key}" inputmode="decimal" autocomplete="off" aria-label="Your ${esc(l.label.toLowerCase())} figure" value="${savedFigure(l.key) ?? ""}"></span></label></span>`;
}

function menu(l) {
  const open = s.menu === l.key;
  const pop = open
    ? `<div class="menu-pop"><button type="button" data-act="figure" data-key="${l.key}">Change figure</button><button type="button" data-act="remove" data-key="${l.key}">Not needed on this trip</button></div>`
    : "";
  return `<span class="menu-wrap"><button type="button" class="bl-bare" data-act="menu" data-key="${l.key}" aria-label="More for ${esc(l.label)}" aria-expanded="${open}">${ico("more")}</button>${pop}</span>`;
}

function wayPicker(l) {
  const open = s.menu === "picker";
  const items = Object.entries(WAYS).map(([key, w]) =>
    `<button type="button" class="bl-pop-item" data-act="way" data-way="${key}" aria-pressed="${s.way === key}">${ico(w.icon)}<span>${w.label}</span>${s.way === key ? ico("check") : ""}</button>`).join("");
  const pop = open ? `<div class="menu-pop bl-pop-left" role="group" aria-label="How you get there">${items}</div>` : "";
  return `<span class="menu-wrap bl-picker-wrap"><button type="button" class="bl-picker" data-act="menu" data-key="picker" aria-expanded="${open}" aria-label="Change how you get there, now ${esc(l.label)}">${esc(l.label)}${ico("chev")}</button>${pop}</span>`;
}

const addBack = (l) => `<button type="button" class="bl-link" data-act="restore" data-key="${l.key}" aria-label="Add ${esc(lineName(l))} back">Add back</button>`;

function outRow(l) {
  return `<li class="bl-row is-out">${icon(l)}<span class="bl-name">${esc(lineName(l))}<small>${SPENT_NOTE}</small></span><span class="bl-barcell">${bar(l.spent, l.plan)}</span><span class="bl-cell"><span class="nums">${money(l.spent)} spent</span>${addBack(l)}</span><span></span></li>`;
}

function liveRow(l) {
  const title = l.key === "travel" ? wayPicker(l) : esc(l.label);
  const editing = s.editing === l.key;
  const guided = l.key !== "travel" || s.way === "fly";
  const detail = editing && guided ? `Floc's guide: ${span(LINES.find((x) => x.key === l.key).range)}` : l.detail;
  return `<li class="bl-row">${icon(l)}<span class="bl-name">${title}<small>${esc(detail)}</small></span><span class="bl-barcell">${bar(l.spent, l.plan)}</span>${editing || needsFigure(l) ? figureField(l) : cell(l)}${menu(l)}</li>`;
}

function render() {
  const all = lines();
  const rows = all.filter((l) => !l.out || l.spent > 0).map((l) => (l.out ? outRow(l) : liveRow(l))).join("");
  const waiting = all.filter((l) => l.out && l.spent === 0).map((l) => `<span class="bl-out">${ico(l.icon)}${esc(lineName(l))} ${addBack(l)}</span>`).join("");
  const out = waiting ? `<span class="bl-outs"><span>Not in your budget</span>${waiting}</span>` : "";
  const style = s.way === "fly" && !s.off.has("travel") ? "Economy from Heathrow, mid-range stays, balanced pace" : "Mid-range stays, balanced pace";
  return `<section class="bl-panel" aria-label="Your budget">${summary()}<ul class="bl-rows">${rows}</ul><div class="bl-foot"><span>${style}</span><button type="button" class="bl-link">Change</button>${out}</div></section>`;
}

function protoBar() {
  const names = (test) => lines().filter(test).map((l) => l.label).join(", ") || "nothing";
  return `<div class="proto-bar"><b>E · Type in the row's name</b><span class="idea">${esc(IDEA)}</span><span class="knob"><span>Try</span><button type="button" data-act="spend" aria-pressed="${s.extra > 0}">${money(FLIGHT_EXPENSE)} flight expense</button><button type="button" data-act="reset">Reset</button></span><span class="bl-state">In: ${esc(names((l) => !l.out))} · Out: ${esc(names((l) => l.out))} · Spent counts every expense</span></div>`;
}

const stage = document.getElementById("stage");

function draw() {
  stage.innerHTML = `${protoBar()}${tripFrame("money", ME)}<div class="bl-page">${render()}<div class="bl-ghost">Below: expenses and who owes who, unchanged</div></div>`;
  if (s.editing) {
    const field = stage.querySelector(`[data-own="${s.editing}"]`);
    field?.focus();
    field?.select();
  }
}

function setWay(way) {
  s.off.delete("travel");
  if (way !== s.way) s.own = null;
  s.way = way;
}

function saveFigure(key, raw) {
  const text = raw.trim();
  const value = text === "" || Number.isNaN(Number(text)) || Number(text) < 0 ? null : Number(text);
  if (key === "travel") s.own = value;
  else if (value == null) delete s.figs[key];
  else s.figs[key] = value;
}

const ACTIONS = {
  menu: ({ key }) => { s.menu = s.menu === key ? null : key; },
  remove: ({ key }) => { s.off.add(key); s.menu = null; },
  restore: ({ key }) => { s.off.delete(key); },
  figure: ({ key }) => { s.menu = null; s.editing = key; },
  way: ({ way }) => { setWay(way); s.menu = null; },
  spend: () => { s.extra = s.extra ? 0 : FLIGHT_EXPENSE; },
  reset: () => { s = fresh(); },
};

stage.addEventListener("click", (e) => {
  const target = e.target.closest("[data-act]");
  if (!target) {
    if (s.menu) { s.menu = null; draw(); }
    return;
  }
  ACTIONS[target.dataset.act]?.(target.dataset);
  draw();
});

stage.addEventListener("focusout", (e) => {
  if (!e.target.matches("[data-own]") || e.target.dataset.done) return;
  e.target.dataset.done = "1";
  saveFigure(e.target.dataset.own, e.target.value);
  s.editing = null;
  setTimeout(draw, 160);
});

stage.addEventListener("keydown", (e) => {
  if (!e.target.matches("[data-own]")) return;
  if (e.key === "Enter") e.target.blur();
  if (e.key === "Escape") {
    e.target.dataset.done = "1";
    s.editing = null;
    draw();
  }
});

variants([{ key: "E", name: "Type in the row's name", round: 2 }], () => {
  s = fresh();
  draw();
});
