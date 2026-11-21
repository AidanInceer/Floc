import { variants } from "/_house/switcher.js";
import { tripFrame, toast, esc, ico, avatar, addMonths, monthGrid, monthName, dateRange, dom, nights, plural } from "/_house/kit/trip-frame.mjs";
import { ME, PEOPLE, LENGTHS, seedMine, markOf, answeredIds, group, tallies, fillKey, bestWindows, reasons, headline, span, forecast, SKY_WORD } from "./data.js";

const LIST = [
  { key: "A", name: "Soft ink", idea: "Can do is a thin grey ring. Prefer is a white disc with a dark ring and a bold number, so it lifts off any colour without going black. The group tab counts who prefers each day." },
];

const TOTAL = PEOPLE.length;
const state = {};

function start() {
  Object.assign(state, {
    tab: state.tab ?? "mine", ym: "2027-02", mode: "free", group: state.group ?? "some",
    saved: seedMine(), edits: new Map(), lengths: new Set(["short_break", "week"]),
    trip: null, pick: null, bestAt: 0, nudged: new Set(), day: null,
  });
}

const changed = () => [...state.edits].filter(([d, m]) => (state.saved.get(d) ?? "off") !== m).length;

function key(d, t) {
  if (state.trip && d >= state.trip.a && d <= state.trip.b) return "trip";
  const p = state.pick;
  if (state.tab === "trip" && p && d >= p.a && d <= (p.b ?? p.a)) return "pend";
  return fillKey(t[d]?.free ?? 0, TOTAL);
}

function snowNote() {
  const snow = dateRange(state.trip.a, state.trip.b).find((d) => forecast(d).sky === "rain");
  return snow ? `Snow showers on ${span(snow, snow).split(" ")[0]}` : "Dry all trip";
}

function stubs(t, wins) {
  const mine = [...state.saved.keys()].filter((d) => markOf(state, d) !== "off");
  const ids = answeredIds(state);
  const waiting = PEOPLE.filter((p) => !ids.includes(p.id));
  const best = wins[0];
  const list = [
    { k: "mine", g: "check", label: "Your days", value: mine.length ? plural(mine.length, "day") : "Not yet", note: changed() ? `${plural(changed(), "change")} not saved` : "Mon 1 – Sun 28 Feb", open: changed() > 0, corner: changed() ? `<span class="pill">Not saved</span>` : "" },
    { k: "group", g: "friends", label: "The group", value: `${ids.length} of ${TOTAL} answered`, short: `${ids.length} of ${TOTAL}`, note: waiting.length ? `Waiting on ${waiting.map((p) => p.name).join(", ")}` : "Everyone has answered", open: waiting.length > 0, corner: `<span class="faces">${PEOPLE.slice(0, 3).map((p) => avatar(p, 22)).join("")}</span>` },
    { k: "trip", g: "dates", label: "The trip", value: state.trip ? span(state.trip.a, state.trip.b) : "No dates yet", short: state.trip ? "Set" : "No dates", note: state.trip ? plural(nights(state.trip.a, state.trip.b), "night") : best ? `Best dates ${span(best.start, best.end)}` : "Pick the days", open: !state.trip },
    { k: "forecast", g: "part", label: "Forecast", value: state.trip ? `Selva, ${plural(dateRange(state.trip.a, state.trip.b).length, "day")}` : "No dates yet", short: "Weather", note: state.trip ? snowNote() : "Follows the trip's dates", open: false },
  ];
  return list.map((s) =>
    `<button type="button" class="stub" role="tab" aria-selected="${state.tab === s.k}" data-act="tab" data-v="${s.k}">` +
    `<span class="gl">${ico(s.g)}</span><b class="label">${s.label}</b><span class="corner">${s.corner ?? ""}</span>` +
    `<span class="value"><span class="wide">${esc(s.value)}</span><span class="narrow">${esc(s.short ?? s.value)}</span></span>` +
    `<small class="note${s.open ? " open" : ""}">${esc(s.note)}</small></button>`).join("");
}

function cell(d, k, joins, t) {
  if (!d) return `<span class="day empty"></span>`;
  const mark = markOf(state, d);
  const onTrip = k === "trip" || k === "pend";
  const showOwn = state.tab !== "group" && mark !== "off";
  const gp = state.tab === "group" ? t[d]?.prefer ?? 0 : 0;
  const hi = state.tab === "forecast" && state.trip && d >= state.trip.a && d <= state.trip.b ? forecast(d).hi : null;
  const cls = ["day", k && `k-${k}`, joins.l && "jl", joins.r && "jr", showOwn && `o-${mark}`, onTrip && "on-trip", state.day === d && "picked"].filter(Boolean).join(" ");
  const label = [`${d}`, showOwn && (mark === "prefer" ? "you prefer it" : "you can do it"), gp && `${gp} prefer`].filter(Boolean).join(", ");
  return `<button type="button" class="${cls}" data-day="${d}" aria-label="${label}">` +
    `<span class="fill"></span><span class="own"></span><span class="n">${dom(d)}</span>` +
    (gp ? `<span class="gp" data-n="${gp}">${gp}</span>` : "") +
    (hi !== null ? `<span class="hi">${hi}°</span>` : "") + `</button>`;
}

function grid(t) {
  const weeks = monthGrid(state.ym);
  const head = ["M", "T", "W", "T", "F", "S", "S"].map((w) => `<span>${w}</span>`).join("");
  return `<div class="dow">${head}</div><div class="weeks" role="grid">` + weeks.map((w) => {
    const keys = w.map((d) => (d ? key(d, t) : ""));
    return `<div class="week">${w.map((d, i) => cell(d, keys[i], { l: !!keys[i] && keys[i] === keys[i - 1], r: !!keys[i] && keys[i] === keys[i + 1] }, t)).join("")}</div>`;
  }).join("") + `</div>`;
}

const sw = (k) => `<span class="sw sw-${k}" aria-hidden="true"></span>`;
function legend() {
  const own = [[sw("free"), "Can do"], [sw("prefer"), "Prefer"]];
  const groupMarks = [[`<span class="ramp">${sw("s1")}${sw("s2")}${sw("s3")}</span>`, "Some free"], [sw("all"), "Everyone free"], [sw("trip"), "The trip"]];
  const items = {
    mine: [...own, ...groupMarks],
    group: [...groupMarks, [sw("gp"), "People who prefer it"]],
    trip: [...own, ...groupMarks],
    forecast: [...own, ...groupMarks],
  }[state.tab];
  return `<div class="key">${items.map(([s, l]) => `<span>${s}${l}</span>`).join("")}</div>`;
}

const pager = () =>
  `<span class="pager"><button type="button" class="sq" data-act="month" data-v="-1" aria-label="Earlier month">${ico("chev", "left")}</button>` +
  `<b>${monthName(state.ym)}</b><button type="button" class="sq" data-act="month" data-v="1" aria-label="Later month">${ico("chev")}</button></span>`;

const HINT = { group: "Marked days are the ones people prefer", trip: "Press the first day, then the last", forecast: "Press a trip day for its hours" };

function topRow() {
  const lead = state.tab === "mine"
    ? `<span class="track" role="tablist" aria-label="What a press marks">${[["free", "Can do"], ["prefer", "Prefer"]].map(([v, l]) =>
      `<button type="button" role="tab" aria-selected="${state.mode === v}" data-act="mode" data-v="${v}">${sw(v)}${l}</button>`).join("")}</span>`
    : `<span class="hint">${HINT[state.tab]}</span>`;
  return `<div class="top">${lead}${pager()}</div>`;
}

function bar() {
  if (state.tab === "mine") {
    const n = changed();
    return `<div class="bar"><button type="button" class="b" data-act="fill">Free all month</button>` +
      (n ? `<span class="end"><span class="soft">${plural(n, "change")} not saved</span><button type="button" class="b primary" data-act="save">Save ${plural(n, "day")}</button></span>` : "") + `</div>`;
  }
  if (state.tab === "trip" && state.pick) {
    const p = state.pick;
    return `<div class="bar"><span class="nums">${p.b ? span(p.a, p.b) : `${span(p.a, p.a)} to…`}</span><span class="end">` +
      `<button type="button" class="b ghost" data-act="discard">Discard</button><button type="button" class="b primary" data-act="commit"${p.b ? "" : " disabled"}>${state.trip ? "Change dates" : "Set the dates"}</button></span></div>`;
  }
  return "";
}

const head = (title, meta = "") => `<div class="ahead"><h3>${title}</h3>${meta}</div>`;

function howLong() {
  return `<section class="part">${head("How long")}<div class="lengths" role="group">` + LENGTHS.map((l) => {
    const on = state.lengths.has(l.key);
    return `<button type="button" class="len${on ? " on" : ""}" aria-pressed="${on}" data-act="len" data-v="${l.key}">` +
      `<span class="tick">${on ? ico("check") : ""}</span><span class="lname">${l.label}</span><span class="nums">${l.nights}</span></button>`;
  }).join("") + `</div><p class="soft">${state.group === "all" ? "A week suits 4 of 6." : "Short break suits 2 of 3."}</p></section>`;
}

function inTrip() {
  if (!state.trip) return "";
  const days = dateRange(state.trip.a, state.trip.b);
  const missing = days.filter((d) => markOf(state, d) === "off");
  return `<section class="part">${head("In the trip")}<p class="big nums">${days.length - missing.length} of ${plural(days.length, "day")}</p>` +
    `<p class="soft">${missing.length ? `You can't do ${missing.map((d) => dom(d)).join(", ")} Feb` : "You can do every day of it"}</p></section>`;
}

function who() {
  const ids = answeredIds(state);
  const ppl = group(state);
  const count = (id) => ppl.find((p) => p.id === id)?.free.size ?? 0;
  return `<section class="part">${head("Who has answered", `<span class="meta nums">${ids.length} of ${TOTAL}</span>`)}<ul class="who">` + PEOPLE.map((p) => {
    const done = ids.includes(p.id);
    const end = done ? `<span class="meta nums">${count(p.id)} days</span>`
      : state.nudged.has(p.id) ? `<span class="meta">Nudged</span>`
      : `<button type="button" class="b small" data-act="nudge" data-v="${p.id}">Nudge</button>`;
    return `<li>${avatar(p, 26)}<span class="pname">${p.id === "me" ? "You" : esc(p.name)}</span>${end}</li>`;
  }).join("") + `</ul></section>`;
}

function bestCard(wins) {
  const w = wins[state.bestAt % Math.max(wins.length, 1)];
  if (!w) return `<section class="part">${head("Best dates")}<p class="soft">No days marked yet</p></section>`;
  const set = state.trip && state.trip.a === w.start && state.trip.b === w.end;
  const nav = wins.length > 1 ? `<span class="steps"><button type="button" class="ib" data-act="best" data-v="-1" aria-label="Previous option">${ico("chev", "left")}</button><span class="meta nums">${(state.bestAt % wins.length) + 1} of ${wins.length}</span><button type="button" class="ib" data-act="best" data-v="1" aria-label="Next option">${ico("chev")}</button></span>` : "";
  return `<section class="part">${head("Best dates", nav)}<p class="big nums">${span(w.start, w.end)}</p><p class="soft">${headline(w)}</p>` +
    reasons(w).map((r) => `<p class="soft">${esc(r)}</p>`).join("") +
    `<div class="act">${set ? `<span class="setword">Set</span>` : `<button type="button" class="b primary" data-act="use" data-a="${w.start}" data-b="${w.end}">${state.trip ? "Change dates" : "Set the dates"}</button>`}</div></section>`;
}

function tripPart() {
  return `<section class="part">${head("The trip")}` + (state.trip
    ? `<p class="big nums">${span(state.trip.a, state.trip.b)}</p><p class="soft">${plural(nights(state.trip.a, state.trip.b), "night")} · ${plural(dateRange(state.trip.a, state.trip.b).length, "day")}</p>`
    : `<p class="due">No dates yet</p>`) + `</section>`;
}

function weather(wins) {
  if (!state.trip) {
    const w = wins[0];
    return `<section class="part">${head("Forecast")}<p class="due">No dates yet</p><p class="soft">The forecast follows the trip's dates.</p>` +
      (w ? `<div class="act"><button type="button" class="b" data-act="use" data-a="${w.start}" data-b="${w.end}">Use ${span(w.start, w.end)}</button></div>` : "") + `</section>`;
  }
  const days = dateRange(state.trip.a, state.trip.b);
  return `<section class="part">${head("Selva di Val Gardena", `<span class="meta nums">To ${span(state.trip.b, state.trip.b)}</span>`)}<ul class="wx">` + days.map((d) => {
    const f = forecast(d);
    return `<li class="${state.day === d ? "on" : ""}"><button type="button" data-act="wx" data-v="${d}"><span class="nums">${span(d, d).replace(/ \w+$/, "")}</span>${ico(f.sky === "rain" ? "rain" : f.sky)}<span class="soft">${SKY_WORD[f.sky]}</span><span class="nums">${f.hi}° <i>${f.lo}°</i></span></button></li>`;
  }).join("") + `</ul></section>`;
}

function render() {
  const t = tallies(state);
  const wins = bestWindows(state);
  const v = LIST.find((x) => x.key === state.variant);
  const knob = (val, label) => `<button type="button" data-act="group" data-v="${val}" aria-pressed="${state.group === val}">${label}</button>`;
  document.getElementById("proto").innerHTML = `<div class="proto-bar"><b>${v.key}: ${esc(v.name)}</b><span class="idea">The Dolomites, February. ${esc(v.idea)}</span>` +
    `<div class="knob"><span>Group</span>${knob("some", "3 of 6 answered")}${knob("all", "Everyone answered")}</div><div class="knob"><button type="button" data-act="restart">Start over</button></div></div>`;
  const aside = {
    mine: howLong() + inTrip(),
    group: who(),
    trip: tripPart() + bestCard(wins),
    forecast: weather(wins),
  }[state.tab];
  document.getElementById("page").innerHTML =
    `<h1 class="sr-only">Dates</h1><p class="lead">${state.trip ? `${span(state.trip.a, state.trip.b)} · ${plural(nights(state.trip.a, state.trip.b), "night")}` : "No dates yet"}</p>` +
    `<section class="board v-${state.variant} tab-${state.tab}"><div class="rail" role="tablist" aria-label="Dates">${stubs(t, wins)}</div>` +
    `<div class="main">${topRow()}${grid(t)}${legend()}${bar()}</div><aside class="aside">${aside}</aside></section>` +
    `<div class="below"><button type="button" class="b" data-act="clear">Clear availability</button><button type="button" class="b danger" data-act="reset"${state.trip ? "" : " disabled"}>Reset dates</button></div>`;
}

const pressTarget = (mark, mode) => (mode === "free" ? (mark === "off" ? "free" : "off") : mark === "prefer" ? "free" : "prefer");
let drag = null;

function paint(d) {
  const [a, b] = d < drag.anchor ? [d, drag.anchor] : [drag.anchor, d];
  for (const [day, m] of drag.before) state.edits.set(day, m);
  drag.before = new Map();
  for (const day of dateRange(a, b)) {
    drag.before.set(day, state.edits.has(day) ? state.edits.get(day) : state.saved.get(day) ?? "off");
    state.edits.set(day, drag.target);
  }
}

function pressDay(d) {
  if (state.tab === "trip") {
    const p = state.pick;
    state.pick = !p || p.b ? { a: d, b: null } : d < p.a ? { a: d, b: p.a } : { a: p.a, b: d };
  } else if (state.tab === "forecast") state.day = state.trip && d >= state.trip.a && d <= state.trip.b ? d : null;
  else if (state.tab === "group") toast(`${dom(d)} Feb: tap a face on the right to nudge`);
}

document.addEventListener("pointerdown", (e) => {
  const c = e.target.closest?.("[data-day]");
  if (!c || state.tab !== "mine" || e.button !== 0) return;
  e.preventDefault();
  const d = c.dataset.day;
  drag = { anchor: d, target: pressTarget(markOf(state, d), state.mode), before: new Map() };
  paint(d);
  render();
});
document.addEventListener("pointerover", (e) => {
  const c = e.target.closest?.("[data-day]");
  if (!drag || !c) return;
  paint(c.dataset.day);
  render();
});
document.addEventListener("pointerup", () => { drag = null; });

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act],[data-day],.tf-tabs a,.tf-places a");
  if (!t) return;
  if (t.matches("a")) { e.preventDefault(); toast("Not in this prototype"); return; }
  const d = t.dataset;
  if (d.day) {
    if (state.tab === "mine") { if (e.detail === 0) state.edits.set(d.day, pressTarget(markOf(state, d.day), state.mode)); }
    else pressDay(d.day);
  } else if (d.act === "tab") { state.tab = d.v; state.day = null; }
  else if (d.act === "month") state.ym = addMonths(state.ym, Number(d.v));
  else if (d.act === "mode") state.mode = d.v;
  else if (d.act === "fill") for (const day of dateRange(`${state.ym}-01`, `${state.ym}-28`)) { if (markOf(state, day) === "off") state.edits.set(day, "free"); }
  else if (d.act === "save") { for (const [day, m] of state.edits) state.saved.set(day, m); state.edits.clear(); toast("Your days are saved"); }
  else if (d.act === "len") state.lengths.has(d.v) ? state.lengths.delete(d.v) : state.lengths.add(d.v);
  else if (d.act === "nudge") { state.nudged.add(d.v); toast(`Nudged ${PEOPLE.find((p) => p.id === d.v).name}`); }
  else if (d.act === "best") state.bestAt = Math.max(0, state.bestAt + Number(d.v) + 3) % 3;
  else if (d.act === "use") { state.trip = { a: d.a, b: d.b }; state.pick = null; toast(`Dates set: ${span(d.a, d.b)}`); }
  else if (d.act === "commit") { state.trip = { ...state.pick }; state.pick = null; toast(`Dates set: ${span(state.trip.a, state.trip.b)}`); }
  else if (d.act === "discard") state.pick = null;
  else if (d.act === "wx") state.day = d.v;
  else if (d.act === "reset") state.trip = null;
  else if (d.act === "clear") { for (const day of state.saved.keys()) state.edits.set(day, "off"); }
  else if (d.act === "group") state.group = d.v;
  else if (d.act === "restart") start();
  render();
});

start();
document.getElementById("frame").innerHTML = tripFrame("dates", ME);
variants(LIST, (k) => { state.variant = k; render(); });
