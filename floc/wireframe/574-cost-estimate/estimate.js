import { variants } from "/_house/switcher.js";
import { tripFrame, ico, esc, avatar, openSheet, closeSheet, sheetHead, toast } from "/_house/kit/trip-frame.mjs";
import { budgetView, basedSheet, fitFor } from "./budget.mjs";

const ME = { name: "Aidan", initial: "Ai", tone: 1 };
const PEOPLE = [ME, { name: "Priya", initial: "Pr", tone: 2 }, { name: "Jo", initial: "Jo", tone: 3 }, { name: "Alex", initial: "Al", tone: 4 }];
const TRIP = { name: "Lisbon and Porto", range: "Sat 12 – Sat 19 Sep", nights: 7, days: 8, stops: [["Lisbon", 4], ["Porto", 3]] };
const PROFILE = { cabin: "Economy", stay: "Mid-range", pace: "Balanced" };

const CABIN = { Economy: 1, "Premium economy": 1.7, Business: 3.6, First: 6 };
const STAY = { Budget: [2500, 4000], "Mid-range": [4500, 7000], "High-end": [9000, 15000] };
const FOOD = { Budget: [2000, 3000], "Mid-range": [3000, 4500], "High-end": [5000, 8000] };
const PACE = { Easy: [800, 1500], Balanced: [1500, 3000], Active: [3000, 5500] };
const SPENT = { flights: 14200, lodging: 9800, food: 0, activity: 0, transport: 0 };

const P = new URLSearchParams(location.search);
const state = { tab: P.get("tab") || "money", pro: P.get("pro") !== "0", home: P.get("home") !== "0", style: { ...PROFILE }, mine: {}, budget: 110000, seg: P.get("seg") || "budget" };

const GL = {
  pencil: '<path d="M9.4 2.6 11.4 4.6 5 11H3V9Z"/>',
  lock: '<rect x="2.8" y="6.2" width="8.4" height="6" rx="1.2"/><path d="M4.8 6.2V4.6a2.2 2.2 0 0 1 4.4 0v1.6"/>',
};
const g = (name) => (GL[name] ? `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${GL[name]}</svg>` : ico(name));
const pounds = (p) => "£" + Math.round(p / 100).toLocaleString("en-GB");
const range = ([lo, hi]) => (lo === hi ? pounds(lo) : `${pounds(lo)}–${pounds(hi)}`);
const times = ([lo, hi], n) => [lo * n, hi * n];

function lines() {
  const s = state.style, c = CABIN[s.cabin];
  return [
    { id: "flights", icon: "flight", label: "Flights", detail: state.home ? `LHR to Lisbon, Porto to LHR · ${s.cabin}` : "Where do you fly from?", guide: state.home ? [Math.round(11000 * c), Math.round(19000 * c)] : null },
    { id: "lodging", icon: "bed", label: "Stay", detail: `${TRIP.nights} nights · ${s.stay} · your share`, guide: times(STAY[s.stay], TRIP.nights) },
    { id: "food", icon: "food", label: "Food and drink", detail: `${TRIP.days} days · ${s.stay}`, guide: times(FOOD[s.stay], TRIP.days) },
    { id: "activity", icon: "activity", label: "Activities", detail: `${TRIP.days} days · ${s.pace}`, guide: times(PACE[s.pace], TRIP.days) },
    { id: "transport", icon: "train", label: "Getting around", detail: "Lisbon to Porto train, metro, taxis", guide: [4000, 7000] },
  ].map((l) => ({ ...l, plan: state.mine[l.id] != null ? [state.mine[l.id], state.mine[l.id]] : l.guide }));
}
const total = () => lines().reduce(([a, b], l) => (l.plan ? [a + l.plan[0], b + l.plan[1]] : [a, b]), [0, 0]);
const spent = () => Object.values(SPENT).reduce((a, b) => a + b, 0);
const fitTag = (f) => (f ? `<span class="fit fit-${f.tone}">${esc(f.word)}</span>` : "");
const ctx = { state, lines, total, spent, SPENT, PROFILE, CABIN, STAY, PACE, pounds, range, fitTag, ico, g, esc, sheetHead };

const lockCard = () =>
  `<section class="lock"><span class="lock-ico">${g("lock")}</span><div><p class="lock-title">Cost estimate and budget</p>` +
  `<p class="hint">See roughly what this trip will cost you, set your own budget and track it. Only you see it.</p></div>` +
  `<button type="button" class="btn" data-act="pro">See Pro</button></section>`;

function banner() {
  if (!state.pro) return "";
  const t = total();
  return `<a href="#" class="banner" data-act="to-budget"><span class="banner-ico">${ico("money")}</span>` +
    `<span class="banner-text"><span class="nums">${range(t)}</span> for you</span>${fitTag(fitFor(ctx, t))}<span class="banner-go">Budget ${ico("chevR")}</span></a>`;
}

const ghostLabel = (t) => `<p class="ghost-label">${t}</p>`;
const overview = () =>
  `<section class="ov-hero ghost" aria-hidden="true"><div class="ov-map"></div><div class="ov-card"><p class="nums hint">${TRIP.range} · ${TRIP.nights} nights</p><h2 class="ov-name">${TRIP.name}</h2>` +
  `<div class="avatar-row">${PEOPLE.map((p) => avatar(p, 24)).join("")}</div></div></section>` + banner() + ghostLabel("Below: stops — unchanged") +
  `<section class="ov-stops ghost" aria-hidden="true">${TRIP.stops.map(([n, k], i) => `<div class="ov-stop"><b>${i + 1}</b><span>${n}</span><small class="nums">${k} nights</small></div>`).join("")}</section>`;
const expenses = () =>
  `<div class="ghost" aria-hidden="true"><div class="m-top"><button class="btn btn-primary">Add expense</button></div>` +
  `<section class="m-panel"><h3>Settle up</h3>${PEOPLE.slice(1).map((p, i) => `<div class="m-row">${avatar(p, 28)}<span>${p.name}</span><span class="nums">${["You owe £42.50", "Owes you £18.00", "Settled"][i]}</span></div>`).join("")}</section>` +
  `<section class="m-panel"><h3>Activity</h3>${[["Flat deposit, Alfama", "£392.00", "Priya"], ["Flights LHR to LIS", "£142.00", "You"], ["Fado tickets", "£96.00", "Jo"]].map(([a, b, c]) => `<div class="m-row"><span>${a}</span><small>${c}</small><span class="nums">${b}</span></div>`).join("")}</section></div>`;
function money() {
  const seg = `<div class="seg" role="group" aria-label="Money view"><button type="button" data-seg="spend" aria-pressed="${state.seg === "spend"}">Expenses</button><button type="button" data-seg="budget" aria-pressed="${state.seg === "budget"}">Budget</button></div>`;
  return `<div class="seg-row">${seg}</div>` + (state.seg === "spend" ? expenses() : state.pro ? budgetView(ctx) : lockCard());
}

function render() {
  document.getElementById("frame").innerHTML = tripFrame(state.tab, ME);
  const page = document.getElementById("page");
  page.innerHTML = `<h1 class="sr-only">${state.tab === "money" ? "Money" : "Overview"}</h1>` + (state.tab === "overview" ? overview() : money());
  document.getElementById("proto").innerHTML = `<span class="typed">Prototype</span>` +
    [["pro", "Pro", "Free"], ["home", "Home airport set", "No home airport"]].map(([k, on, off]) => `<button type="button" data-proto="${k}">${state[k] ? on : off}</button>`).join("");
}

function refreshSheet() { const d = document.querySelector("dialog.based-sheet"); if (d) d.innerHTML = basedSheet(ctx); }
function editLine(id) {
  const l = lines().find((x) => x.id === id);
  openSheet(sheetHead(l.label) + `<form class="sheet-body" data-line="${id}"><p class="hint">Floc's guide: <span class="nums">${l.guide ? range(l.guide) : "no flight guide yet"}</span></p>` +
    `<label class="field"><span class="typed">Your figure, £</span><input name="v" inputmode="numeric" class="nums" value="${state.mine[id] != null ? state.mine[id] / 100 : ""}"></label>` +
    `<div class="sheet-foot">${state.mine[id] != null ? "<button type=\"button\" class=\"btn btn-ghost\" data-clear>Use Floc's guide</button>" : ""}<button class="btn btn-primary">Save</button></div></form>`);
}
function editBudget() {
  openSheet(sheetHead("Your budget") + `<form class="sheet-body" data-budget><label class="field"><span class="typed">For the whole trip, £</span><input name="v" inputmode="numeric" class="nums" value="${state.budget != null ? state.budget / 100 : ""}"></label>` +
    `<div class="sheet-foot">${state.budget != null ? '<button type="button" class="btn btn-ghost" data-clear>Remove</button>' : ""}<button class="btn btn-primary">Save</button></div></form>`);
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act],[data-edit],[data-seg],[data-proto],[data-clear],[data-choose],.tf-tabs a");
  if (!t) return;
  if (t.matches(".tf-tabs a")) {
    e.preventDefault();
    const name = t.textContent.trim().toLowerCase();
    if (name === "overview" || name === "money") { state.tab = name; render(); } else toast("Not in this prototype");
    return;
  }
  if (t.dataset.clear != null) {
    const form = t.closest("form");
    if (form.dataset.line) delete state.mine[form.dataset.line]; else state.budget = null;
    closeSheet(); render(); return;
  }
  if (t.dataset.choose) { const [k, v] = t.dataset.choose.split(":"); state.style[k] = v; render(); refreshSheet(); return; }
  if (t.dataset.edit) return editLine(t.dataset.edit);
  if (t.dataset.seg) { state.seg = t.dataset.seg; render(); return; }
  if (t.dataset.proto) { state[t.dataset.proto] = !state[t.dataset.proto]; render(); return; }
  e.preventDefault();
  const act = t.dataset.act;
  if (act === "to-budget") { state.tab = "money"; state.seg = "budget"; render(); window.scrollTo(0, 0); }
  else if (act === "budget") editBudget();
  else if (act === "reset") { state.style = { ...PROFILE }; render(); refreshSheet(); }
  else if (act === "based") openSheet(basedSheet(ctx), "based-sheet");
  else if (act === "home") { state.home = true; render(); toast("Home airport set: London Heathrow (LHR)"); }
  else if (act === "pro") toast("Opens the Pro page");
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target, raw = form.elements.v.value.replace(/[^0-9.]/g, "");
  const v = raw === "" ? null : Math.round(Number(raw) * 100);
  if (form.dataset.line) { if (v == null) delete state.mine[form.dataset.line]; else state.mine[form.dataset.line] = v; }
  else state.budget = v;
  closeSheet(); render();
});

variants([{ key: "B3d", round: 4, title: "Money / Budget switch, quiet top", note: "Chosen. One row of Budget, Spent, Left and Estimate, a thin whole-trip bar, then each line against its plan." }], () => render());
render();
