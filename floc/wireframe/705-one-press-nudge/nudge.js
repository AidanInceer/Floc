import { variants } from "/_house/switcher.js";
import { tripFrame, ico, esc, avatar, toast } from "/_house/kit/trip-frame.mjs";
import { CAP, DAY, HOUR, SCENARIOS, TASKS, ago, complete, names, nudgedRecently, person, send, usedToday, waiting } from "./model.mjs";
import { NOTES, receiver, stateReadout } from "./receiver.mjs";

const Q = new URLSearchParams(location.search);
const ui = {
  variant: "C1",
  tab: Q.get("tab") || "overview",
  scenario: Q.get("scenario") || "three",
  ideasOpen: Q.get("ideas") === "1",
  sortOpen: Q.get("open") === "1",
  doneOpen: false,
  lines: Q.get("lines") || "all",
  busy: new Set(),
  menu: null,
};
const TABS = ["overview", "dates", "days", "money", "packing", "notes", "files"];
const LIVE = ["overview", "dates", "money"];
const scenario = () => SCENARIOS.find((s) => s.key === ui.scenario) ?? SCENARIOS[0];
let state = scenario().make();
if (person(state, Q.get("as"))) state.viewer = Q.get("as");

const BULB = '<svg class="g bulb" viewBox="0 0 14 14" aria-hidden="true"><path d="M5.2 10.2h3.6M5.6 12h2.8M7 1.8a3.6 3.6 0 0 0-2.2 6.4c.4.3.5.7.5 1.1v.9h3.4v-.9c0-.4.1-.8.5-1.1A3.6 3.6 0 0 0 7 1.8Z"/></svg>';
const k = (id, task) => `${id}:${task}`;
const me = () => person(state, state.viewer);
const label = (p) => (p.id === state.viewer ? "You" : p.name);
const short = (list) => (list.length > 3 ? `${list.slice(0, 2).join(", ")} and ${list.length - 2} others` : names(list));
const have = (n) => (n === 1 ? "has" : "have");
const daysLabel = (n) => (n === 0 ? "No days" : `${n} day${n === 1 ? "" : "s"}`);
const NUDGED = `<span class="nudged">${ico("check")}Nudged</span>`;

const stateOf = (id, task) => (ui.busy.has(k(id, task)) || ui.busy.has(k("all", task)) ? "busy" : nudgedRecently(state, id, task) ? "nudged" : "open");

function menu(key, name, items) {
  const open = ui.menu === key;
  return `<span class="menu-wrap"><button type="button" class="ib" data-menu="${key}" aria-expanded="${open}" aria-label="More for ${esc(name)}">${ico("more")}</button>` +
    (open ? `<div class="menu-pop">${items}</div>` : "") + `</span>`;
}

function one(p, task) {
  const s = stateOf(p.id, task);
  if (s === "nudged") return `<span class="slot">${NUDGED}</span>`;
  return `<span class="slot"><button type="button" class="word-btn" data-nudge="${p.id}" data-task="${task}"${s === "busy" ? " disabled" : ""} aria-label="Nudge ${esc(p.name)}">Nudge${s === "busy" ? "…" : ""}</button></span>`;
}

function all(task, people, { word = false, text = "Nudge" } = {}) {
  if (ui.busy.has(k("all", task))) return `<button type="button" class="${word ? "word-btn" : "b"}" disabled>${text}…</button>`;
  if (people.every((p) => nudgedRecently(state, p.id, task))) return NUDGED;
  return `<button type="button" class="${word ? "word-btn" : "b"}" data-all="${task}">${text}</button>`;
}

const COLOUR = { days: "yellow", ideas: "blue", money: "red", packing: "blue", stay: "blue", travel: "green" };
const GLYPH = { days: "dates", ideas: "star", money: "money", packing: "packing", stay: "bed", travel: "train" };

function gaps() {
  const v = me();
  const finding = state.trip.moment === "finding";
  const every = ui.lines === "all";
  const list = [];
  const done = [];
  const go = (to, label) => ({ go: to, label });
  const ask = (task, people) => ({ task, people });
  if (finding) {
    if (v.days === null) list.push({ kind: "days", mine: true, text: "Mark the days you can do", act: go("dates", "Mark my days") });
    else done.push({ kind: "days", text: "You marked your days" });
    const late = waiting(state, "days");
    if (late.length) list.push({ kind: "days", mine: false, text: `${short(late.map((p) => p.name))} ${have(late.length)} not marked any days`, count: "have not marked any days", act: ask("days", late) });
    else if (state.people.length > 1) done.push({ kind: "days", text: "Everyone has marked their days" });
  }
  list.push({ kind: "travel", mine: false, text: "Lisbon to Porto: no travel set", sub: ["Thu 17 Sep"], act: go("days", "Set travel") });
  list.push({ kind: "packing", mine: false, text: "Speaker is up for grabs", act: go("packing", "Bring something") });
  done.push({ kind: "packing", text: "Sun cream", sub: ["Someone is bringing it"] });
  state.debts.filter((d) => d.payer === v.id).forEach((d) =>
    list.push({ kind: "money", mine: true, text: `You owe ${person(state, d.payee).name} ${d.amount}`, act: go("money", "Settle up") }));
  const owing = waiting(state, "money");
  if (every && owing.length) {
    const sub = state.debts.filter((d) => d.payee === v.id).map((d) => `${person(state, d.payer).name} ${d.amount}`);
    list.push({ kind: "money", mine: false, text: `${short(owing.map((p) => p.name))} ${owing.length === 1 ? "owes" : "owe"} you`, count: owing.length === 1 ? "owes you" : "owe you", sub: sub.slice(0, 3), act: ask("money", owing) });
  }
  if (finding && state.ideas.length) {
    if (!v.voted) list.push({ kind: "ideas", mine: true, text: `Vote on where: ${state.ideas.length} ideas`, act: go("ideas", "Vote") });
    else done.push({ kind: "ideas", text: "You voted on where" });
    const late = waiting(state, "ideas");
    if (every && late.length) list.push({ kind: "ideas", mine: false, text: `${short(late.map((p) => p.name))} ${have(late.length)} not voted on where`, count: "have not voted on where", act: ask("ideas", late) });
  }
  const STEP = { days: 0, stay: 1, travel: 1, packing: 2, money: 3, ideas: 4 };
  list.sort((a, b) => STEP[a.kind] - STEP[b.kind] || Number(b.mine) - Number(a.mine));
  return { list, done };
}

const tile = (kind, done = false) =>
  `<span class="tile" style="background:var(--pastel-${COLOUR[kind]});color:var(--pastel-${COLOUR[kind]}-ink)">${ico(done ? "check" : GLYPH[kind])}</span>`;

function fitPerson(p, task) {
  const s = stateOf(p.id, task);
  const done = s === "nudged";
  const attrs = done
    ? `data-pid="${p.id}" aria-label="${esc(p.name)}: nudged today" disabled`
    : `data-pid="${p.id}" data-nudge="${p.id}" data-task="${task}" aria-label="Nudge ${esc(p.name)}"${s === "busy" ? " disabled" : ""}`;
  return `<button type="button" class="chip${done ? " done" : ""}" ${attrs}>${avatar(p, 18)}${esc(p.name)}${done ? ico("check") : ""}</button>`;
}

function fitRow(g) {
  const { task, people } = g.act;
  const key = k("more", task);
  const items = people.map((p) => nudgedRecently(state, p.id, task)
    ? `<button type="button" data-pid="${p.id}" disabled>${esc(p.name)}: nudged today</button>`
    : `<button type="button" data-pid="${p.id}" data-nudge="${p.id}" data-task="${task}">Nudge ${esc(p.name)}</button>`).join("");
  const open = ui.menu === key;
  const opener = `<button type="button" class="ib" data-menu="${key}" aria-expanded="${open}" aria-label="Nudge someone else">${ico("more")}</button>`;
  const more = `<span class="menu-wrap fit-more" hidden>${opener}${open ? `<div class="menu-pop">${items}</div>` : ""}</span>`;
  const busy = ui.busy.has(k("all", task));
  const end = people.every((p) => nudgedRecently(state, p.id, task))
    ? NUDGED
    : `<button type="button" class="b" data-all="${task}"${busy ? " disabled" : ""}>Nudge all${busy ? "…" : ""}</button>`;
  const n = people.length;
  const text = `${n} ${n === 1 ? "person" : "people"} ${n === 1 ? g.count.replace(/^have/, "has").replace(/^owe\b/, "owes") : g.count}`;
  return `<li class="srow fitrow">${tile(g.kind)}<span class="srow-text">${esc(text)}</span>` +
    `<span class="fit-wrap"><span class="fit">${people.map((p) => fitPerson(p, task)).join("")}</span>${more}</span>` +
    `<span class="srow-end">${end}</span></li>`;
}

function fitNames() {
  document.querySelectorAll(".fit").forEach((fit) => {
    const more = fit.parentElement.querySelector(".fit-more");
    const kids = [...fit.children];
    kids.forEach((c) => { c.hidden = false; });
    more.hidden = true;
    let shown = kids.length;
    while (shown > 0 && fit.scrollWidth > fit.clientWidth + 1) {
      more.hidden = false;
      kids[--shown].hidden = true;
    }
    const rest = kids.slice(shown).map((c) => c.dataset.pid);
    more.querySelectorAll(".menu-pop [data-pid]").forEach((b) => { b.hidden = !rest.includes(b.dataset.pid); });
  });
}
addEventListener("resize", () => fitNames());
document.fonts?.addEventListener("loadingdone", () => fitNames());
document.fonts?.ready.then(() => fitNames());

function sortRow(g) {
  const asking = g.act?.task;
  if (asking) return fitRow(g);
  const text = g.text;
  const sub = (g.sub ?? []).map((s) => `<span class="nums">${esc(s)}</span>`).join("");
  const end = `<button type="button" class="lnk" data-go="${g.act.go}">${esc(g.act.label)}</button>`;
  return `<li class="srow">${tile(g.kind)}<span class="srow-text">${esc(text)}</span><span class="srow-sub">${sub}</span><span class="srow-end">${end}</span></li>`;
}

function stripAct(next) {
  if (!next.act.task) return `<button type="button" class="b${next.mine ? " b-pri" : ""}" data-go="${next.act.go}">${esc(next.act.label)}</button>`;
  const { task, people } = next.act;
  if (people.every((p) => nudgedRecently(state, p.id, task))) return NUDGED;
  const busy = ui.busy.has(k("all", task));
  return `<button type="button" class="b" data-all="${task}"${busy ? " disabled" : ""}>Nudge all${busy ? "…" : ""}</button>`;
}

function leftToSort() {
  const { list, done } = gaps();
  const next = list[0];
  if (!next) return "";
  const total = list.length + done.length;
  const cubes = Array.from({ length: total }, (_, i) => `<i${i < done.length ? ' class="on"' : ""}></i>`).join("");
  const doneRows = ui.doneOpen
    ? done.map((d) => `<li class="srow">${tile(d.kind, true)}<span class="srow-text faint">${esc(d.text)}</span><span class="srow-sub">${(d.sub ?? []).map((s) => `<span class="nums">${esc(s)}</span>`).join("")}</span><span class="srow-end faint">Sorted</span></li>`).join("")
    : "";
  const deck = done.length
    ? `<li class="deck"><button type="button" class="deck-head" data-done aria-expanded="${ui.doneOpen}"><span class="cubes" aria-hidden="true">${done.map(() => '<i class="on"></i>').join("")}</span><span>${done.length} already sorted</span>${ico("chev")}</button>${doneRows ? `<ul class="stack">${doneRows}</ul>` : ""}</li>`
    : "";
  return `<section class="lts${ui.sortOpen ? " open" : ""}" aria-label="Left to sort"><div class="lts-strip" data-strip><span class="cubes" aria-hidden="true">${cubes}</span>` +
    `<span class="lts-count"><b class="nums">${done.length}</b> of ${total} sorted</span>` +
    `<span class="lts-next">${next.mine ? "Next for you:" : "Next:"} <b>${esc(next.text)}</b></span><span class="slot lts-act">${stripAct(next)}</span>` +
    `<button type="button" class="ib" data-sort aria-expanded="${ui.sortOpen}" aria-label="${ui.sortOpen ? "Hide what is left" : "Show what is left"}">${ico("chev")}</button></div>` +
    (ui.sortOpen ? `<ul class="stack">${list.map(sortRow).join("")}${deck}</ul>` : '<span class="edge e1"></span><span class="edge e2"></span>') + `</section>`;
}

function ideas() {
  if (state.trip.moment !== "finding" || !state.ideas.length) return "";
  const top = [...state.ideas].sort((a, b) => b.votes - a.votes)[0];
  const late = waiting(state, "ideas");
  const line = late.length
    ? `<div class="ideas-wait"><span class="faces">${late.slice(0, 4).map((p) => avatar(p, 20)).join("")}</span>` +
      `<span class="gap-text">${esc(short(late.map((p) => p.name)))} ${have(late.length)} not voted</span><span class="slot">${all("ideas", late, { word: true })}</span></div>`
    : "";
  const rows = state.ideas.map((i, n) =>
    `<li><button type="button" class="vote${me().voted && n === 0 ? " on" : ""}" ${me().voted ? "disabled" : 'data-do="ideas"'} aria-label="Vote for ${esc(i.title)}"><b class="nums">${i.votes}</b></button><span>${esc(i.title)}</span></li>`).join("");
  const board = ui.ideasOpen
    ? `<div class="ideas-board" id="ideas-board"><ul class="ideas-list">${rows}</ul>${line}</div>`
    : "";
  return `<div class="ideas" id="ideas"><button type="button" class="ideas-row" data-ideas aria-expanded="${ui.ideasOpen}">${BULB}` +
    `<span class="ideas-words"><span>${state.ideas.length} ideas</span><small>Top: ${esc(top.title)}</small></span>${ico(ui.ideasOpen ? "chev" : "chevR")}</button>${board}</div>`;
}

function roster() {
  const rows = state.people.map((p) => {
    const items = p.id === state.viewer
      ? '<button type="button">Leave trip</button>'
      : `<button type="button">View profile</button>${p.guest ? "" : '<button type="button">Add friend</button><button type="button">Make organiser</button>'}<button type="button" class="danger">Remove from trip</button>`;
    return `<li class="row">${avatar(p, 26)}<span class="name">${esc(label(p))}${p.guest ? '<em class="badge">Guest</em>' : ""}</span>` +
      (p.id === "aidan" ? '<span class="role">Organiser</span>' : "") + menu(k(p.id, "roster"), p.name, items) + `</li>`;
  }).join("");
  return `<section class="card"><header class="card-head"><h2>The group</h2><span class="nums count">${state.people.length}</span></header><ul class="rows">${rows}</ul></section>`;
}

const overview = () =>
  leftToSort() +
  `<div class="cols"><section class="card">${ideas()}<p class="ghost-block tall">The map, the route and its stops: unchanged</p></section>${roster()}</div>`;

function dates() {
  const finding = state.trip.moment === "finding";
  const v = me();
  const everyone = state.people;
  const answered = everyone.filter((p) => p.days !== null).length;
  const rows = everyone.map((p) => {
    const you = p.id === state.viewer;
    const end = p.days !== null
      ? `<span class="slot"><span class="nums quiet">${daysLabel(p.days)}</span></span>`
      : you || p.guest || !finding ? '<span class="slot"><span class="wait">Not yet</span></span>' : one(p, "days");
    return `<li class="row">${avatar(p, 26)}<span class="name">${esc(label(p))}${p.guest ? '<em class="badge">Guest</em>' : ""}</span>${end}</li>`;
  }).join("");
  const mine = finding && v.days === null ? `<button type="button" class="b b-pri" data-do="days">Mark my days</button>` : "";
  return `<div class="cols wide-left"><section class="card"><p class="ghost-block tall">The calendar, the best dates and the weather: unchanged${mine ? `<span class="ghost-act">${mine}</span>` : ""}</p></section>` +
    `<section class="card"><header class="card-head mono"><h2 class="typed">Who has answered</h2><span class="nums count">${answered} of ${everyone.length}</span></header><ul class="rows">${rows}</ul></section></div>`;
}

function money() {
  const v = state.viewer;
  const owe = state.debts.filter((d) => d.payer === v);
  const owed = state.debts.filter((d) => d.payee === v);
  const others = state.debts.filter((d) => d.payer !== v && d.payee !== v);
  const settle = (cls, attr = "") => `<button type="button" class="b ${cls}" ${attr}>Settle up</button>`;
  const row = (d, paying) => {
    const p = person(state, paying ? d.payee : d.payer);
    const under = !paying ? `<span class="under">${one(p, "money")}</span>` : "";
    const acts = paying ? settle("b-pri", 'data-do="money"') : settle("");
    return `<li class="pay">${avatar(p, 32)}<span class="pay-name"><span>${esc(p.name)}</span>${under}</span><span class="nums pay-sum">${d.amount}</span><span class="pay-acts">${acts}</span></li>`;
  };
  const column = (title, empty, note, list, paying) =>
    `<section class="card pad"><h2 class="col-title">${title}</h2>` +
    (list.length ? `<ul class="pays${paying ? "" : " order-b"}">${list.map((d) => row(d, paying)).join("")}</ul>` : `<p class="empty"><b>${empty}</b><span>${note}</span></p>`) + `</section>`;
  const between = others.length
    ? `<section class="card between"><h3>Between the others</h3><ul>${others.map((d) => `<li><span>${esc(person(state, d.payer).name)} owes ${esc(person(state, d.payee).name)}</span><span class="nums">${d.amount}</span></li>`).join("")}</ul></section>`
    : "";
  return `<div class="cols even">${column("You owe", "All square", "You have paid your share.", owe, true)}${column("You are owed", "Nothing to chase", "Everyone has paid you back.", owed, false)}</div>` +
    between + `<p class="ghost-block">Expenses and the activity list: unchanged</p>`;
}

const SCREENS = { overview, dates, money };

function protoBar() {
  const viewers = ["aidan", "priya", "sam"].filter((id) => person(state, id));
  return `<b>#705 Nudge in one press</b><span class="idea">${esc(NOTES[ui.scenario] ?? "")}</span>` +
    `<span class="knob"><span>View as</span>${viewers.map((id) => `<button type="button" data-as="${id}" aria-pressed="${state.viewer === id}">${person(state, id).name}</button>`).join("")}</span>` +
    `<label class="knob pick"><span>Case</span><select id="case">${SCENARIOS.map((s) => `<option value="${s.key}"${s.key === ui.scenario ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</select></label>` +
    `<span class="knob"><span>Clock</span><button type="button" data-clock="${DAY}">+ 24 hours</button><button type="button" data-clock="${HOUR}">+ 1 hour</button></span>` +
    `<span class="knob"><span>Left to sort</span><button type="button" data-lines="all" aria-pressed="${ui.lines === "all"}">All three nudges</button><button type="button" data-lines="days" aria-pressed="${ui.lines === "days"}">Days only</button></span>`;
}

function render() {
  document.getElementById("proto").innerHTML = protoBar();
  document.getElementById("stage").innerHTML =
    tripFrame(ui.tab, me()) + `<main class="page">${SCREENS[ui.tab]()}</main>` + receiver(state, { avatar, esc, ico, ago });
  document.getElementById("state").innerHTML = stateReadout(state, { CAP, usedToday, ago, person });
  const url = new URL(location.href);
  [["variant", ui.variant], ["tab", ui.tab], ["scenario", ui.scenario], ["as", state.viewer], ["ideas", ui.ideasOpen ? "1" : ""], ["open", ui.sortOpen ? "1" : ""], ["lines", ui.lines === "all" ? "" : ui.lines]]
    .forEach(([key, value]) => (value ? url.searchParams.set(key, value) : url.searchParams.delete(key)));
  history.replaceState(null, "", url);
  fitNames();
}

function report(r, task) {
  const called = (ids) => names(ids.map((id) => person(state, id).name));
  if (r.refused === "failed") return toast("Could not send the nudge. Try again.");
  if (r.refused === "cap") return toast(r.sent.length ? `Nudged ${called(r.sent)}. That is enough nudges for today.` : "That is enough nudges for today. Try again tomorrow.");
  if (r.done.length) toast(`${called(r.done)} ${r.done.length === 1 ? TASKS[task].done : TASKS[task].done.replace(/^has/, "have")}`);
}

function press(ids, task, busyKey) {
  ui.busy.add(busyKey);
  ui.menu = null;
  render();
  setTimeout(() => {
    ui.busy.delete(busyKey);
    report(send(state, state.viewer, ids, task), task);
    render();
  }, 500);
}

function go(tab) {
  if (tab === "ideas") { ui.tab = "overview"; ui.ideasOpen = true; } else if (LIVE.includes(tab)) ui.tab = tab;
  render();
  if (tab === "ideas") document.getElementById("ideas")?.scrollIntoView({ block: "center" });
}

document.addEventListener("click", (e) => {
  const hit = (sel) => e.target.closest(sel);
  const tabLink = hit(".tf-tabs a");
  if (tabLink) { e.preventDefault(); return go(TABS[[...tabLink.parentElement.children].indexOf(tabLink)]); }
  if (hit(".tf-bar a")) return e.preventDefault();
  const nudge = hit("[data-nudge]");
  if (nudge) return press([nudge.dataset.nudge], nudge.dataset.task, k(nudge.dataset.nudge, nudge.dataset.task));
  const every = hit("[data-all]");
  if (every) return press(waiting(state, every.dataset.all).map((p) => p.id), every.dataset.all, k("all", every.dataset.all));
  const opener = hit("[data-menu]");
  if (opener) { ui.menu = ui.menu === opener.dataset.menu ? null : opener.dataset.menu; return render(); }
  const own = hit("[data-do]");
  if (own) { complete(state, state.viewer, own.dataset.do); return render(); }
  const to = hit("[data-go]");
  if (to) return go(to.dataset.go);
  const as = hit("[data-as]");
  if (as) { state.viewer = as.dataset.as; ui.menu = null; return render(); }
  const clock = hit("[data-clock]");
  if (clock) { state.now += Number(clock.dataset.clock); return render(); }
  if (hit("[data-ideas]")) { ui.ideasOpen = !ui.ideasOpen; return render(); }
  if (hit("[data-sort]")) { ui.sortOpen = !ui.sortOpen; return render(); }
  if (hit("[data-done]")) { ui.doneOpen = !ui.doneOpen; return render(); }
  const lines = hit("[data-lines]");
  if (lines) { ui.lines = lines.dataset.lines; return render(); }
  if (hit("[data-strip]") && !hit("button, a, .menu-wrap")) { ui.sortOpen = !ui.sortOpen; return render(); }
  const note = hit("[data-inbox]");
  if (note) { const item = state.inbox[state.viewer][Number(note.dataset.inbox)]; item.read = true; return go(item.task === "ideas" ? "ideas" : TASKS[item.task].tab); }
  if (ui.menu && !hit(".menu-pop")) { ui.menu = null; render(); }
});

document.addEventListener("change", (e) => {
  if (e.target.id !== "case") return;
  ui.scenario = e.target.value;
  state = scenario().make();
  ui.menu = null;
  ui.busy.clear();
  render();
});

variants(
  [{ key: "C1", round: 2, name: "Name chips on the right, … for the rest", note: "Chosen. Each line: a chip per person, right-aligned, then Nudge all. Chips that do not fit go behind a … menu, one person per item." }],
  () => render(),
);
render();
