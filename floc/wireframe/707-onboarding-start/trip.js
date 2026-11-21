import { S, LISTING, LIVE, calendar, closeX, createBtn, esc, gl, listOf, modal, press, quiet, startPlace, tile, whenText, who, whoText } from "./kit.js";
import { cap, head, og } from "./ob.js";

const nightsOf = (stops) => stops.reduce((n, [, k]) => n + k, 0);
const listing = (id, title, country, stops, from, fits) => ({ id, title, country, stops, nights: nightsOf(stops), from, fits });
export const SUGGEST = [
  listing("naxos", "Two Cyclades, one ferry", "Greece", [["Paros", 3], ["Naxos", 3]], "€880", ["beaches", "food first"]),
  listing("puglia", "Trulli and the Puglia coast", "Italy", [["Alberobello", 3], ["Polignano a Mare", 2]], "€760", ["food first", "beaches"]),
  listing("albania", "The Albanian Riviera", "Albania", [["Himarë", 3], ["Gjirokastër", 2]], "€390", ["beaches", "museums"]),
  listing("algarve", "The Algarve without a car", "Portugal", [["Faro", 1], ["Tavira", 3]], "€420", ["beaches", "food first", "slow mornings"]),
  listing("slovenia", "Ljubljana, Bled and the caves", "Slovenia", [["Ljubljana", 2], ["Bled", 2], ["Piran", 1]], "€540", ["hiking", "food first"]),
  listing("italy", "Venice to the Amalfi coast", "Italy", [["Venice", 2], ["Florence", 3], ["Cinque Terre", 2], ["Rome", 3], ["Naples", 1], ["Positano", 3]], "€1,680", ["food first", "museums", "city breaks"]),
];
const PLACES = [
  ["Lisbon", "Portugal"], ["Sicily", "Italy"], ["Kraków", "Poland"], ["Naxos", "Greece"], ["Porto", "Portugal"], ["Seville", "Spain"],
  ["Barcelona", "Spain"], ["Sardinia", "Italy"], ["Rome", "Italy"], ["Crete", "Greece"], ["Tokyo", "Japan"], ["The Dolomites", "Italy"],
  ["Reykjavík", "Iceland"], ["Amsterdam", "Netherlands"], ["Berlin", "Germany"], ["Copenhagen", "Denmark"], ["Marrakech", "Morocco"], ["New York", "United States"],
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const fromExplore = () => S.door === "explore";
export const borrowed = () => S.trip.borrow ?? (fromExplore() ? LISTING : null);

export function plan() {
  const t = S.trip;
  const list = ["ask"];
  if (!fromExplore()) {
    if (t.hasWhere === true) list.push("where");
    if (t.hasWhere === false) list.push("ideas");
  }
  if (t.hasDates === true) list.push("dates");
  if (t.hasDates === false) list.push("free");
  list.push("who", "name");
  return list;
}
export const LABEL = { ask: "Start", where: "Where", ideas: "Ideas", dates: "Dates", free: "Find dates", who: "Who", name: "Name" };
export const ICON = { ask: "plus", where: "pin", ideas: "explore", dates: "dates", free: "clock", who: "people", name: "notes" };

const tickSvg = () => og("check");
export const yn = (key) => {
  const v = key === "dates" ? S.trip.hasDates : S.trip.hasWhere;
  const i = v === false ? 1 : 0;
  const pressed = (val) => (v === true && val === "yes") || (v === false && val === "no");
  return `<div class="seg2 yn" style="--n:2;--i:${i}" data-on="${v !== null}" role="group" aria-label="${key === "dates" ? "Dates" : "Where"}">${[["yes", "Yes"], ["no", "Not yet"]].map(([val, label]) => `<button type="button" aria-pressed="${pressed(val)}" data-act="ans:${key}=${val}" data-keep="later">${label}</button>`).join("")}</div>`;
};
const askRow = (icon, tone, q, key) =>
  `<div class="ask-row">${tile(icon, tone)}<span class="ask-q">${q}</span>${yn(key)}</div>`;
export const decidedWhere = () => {
  const lst = LISTING;
  return `<div class="ask-row is-set">${tile("pin", "blue")}<span class="ask-q"><span>${lst.title}</span><span class="row-hint">${lst.stops.map(([p]) => p).join(", ")}</span></span><span class="nums ask-set">${tickSvg()}From Explore</span></div>`;
};
export const askRows = () =>
  `<div class="ask">${fromExplore() ? decidedWhere() : askRow("pin", "blue", "Do you know where?", "where")}${askRow("dates", "yellow", "Do you have dates?", "dates")}</div>`;

export function placeHits() {
  const q = S.trip.q.trim().toLowerCase();
  const pool = q ? PLACES.filter((p) => p.join(" ").toLowerCase().includes(q)) : PLACES.slice(0, 4);
  const list = pool.filter(([p]) => !S.trip.places.includes(p)).slice(0, 4);
  return list.length
    ? list.map(([p, land]) => `<button type="button" class="ap-row" data-act="place:${p}">${gl("pin")}<span class="row-text"><span class="row-label">${p}</span><span class="row-hint">${land}</span></span><span class="ap-add">${gl("plus")}</span></button>`).join("")
    : `<p class="quiet ap-none">No place by that name yet</p>`;
}
LIVE.places = placeHits;
export const placePicker = () => {
  const chosen = S.trip.places.length
    ? `<ol class="stops">${S.trip.places.map((p, i) => `<li class="${S.pop === p ? "pop" : ""}"><span class="pinno nums">${i + 1}</span><span>${p}</span><button type="button" class="iconbtn" data-act="place:${p}" aria-label="Remove ${p}">${gl("cross")}</button></li>`).join("")}</ol>`
    : "";
  return `${chosen}<div class="ap"><label class="fld"><span class="typed">${S.trip.places.length ? "Add another place" : "Place"}</span><input data-bind="trip.q" value="${esc(S.trip.q)}" autocomplete="off" maxlength="40"></label><div class="ap-list" data-live="places">${placeHits()}</div></div>`;
};

const choice = (on, act, icon, tone, label, hint) =>
  `<button type="button" class="choice${on ? " is-on" : ""}" aria-pressed="${on}" data-act="${act}">${tile(icon, tone)}<span class="row-text"><span class="row-label">${label}</span>${hint ? `<span class="row-hint">${hint}</span>` : ""}</span><span class="radio">${on ? tickSvg() : ""}</span></button>`;
const ranked = () =>
  SUGGEST.map((s) => [s, s.fits.filter((f) => S.me.tags.includes(f)).length])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);
export const suggestions = () =>
  `<div class="sugs">${ranked().map((s) => {
    const on = S.trip.borrow?.id === s.id;
    return `<button type="button" class="sug${S.pop === s.id ? " pop" : ""}" aria-pressed="${on}" data-act="borrow:${s.id}"><span class="sug-t">${s.title}</span><span class="nums sug-m">${s.country} · ${s.nights} nights · from ${s.from}</span><span class="radio">${on ? tickSvg() : ""}</span></button>`;
  }).join("")}</div>`;
export const ideasHint = () =>
  S.me.tags.length ? `Ready-made trips that fit ${listOf(S.me.tags.slice(0, 2))}. Borrow one, or let the group pin ideas.` : "Borrow a ready-made trip, or let the group pin ideas.";
export const groupIdeas = () => choice(!S.trip.borrow, "borrow:", "pin", "blue", "Let the group pin ideas", "Everyone adds places and votes");

export const freeChoices = () =>
  `<div class="choices">${choice(S.trip.poll, "poll:yes", "people", "yellow", "Ask the group when they are free", "Everyone marks their free days on Dates")}${choice(!S.trip.poll, "poll:no", "clock", "plain", "Leave dates for later", "")}</div>`;
export const datesHint = () => {
  const lst = borrowed();
  return lst ? `Pick a start day. The ${lst.nights} nights follow.` : "Tap the first day, then the last.";
};
export const whoBody = () => `${who()}<div><button type="button" class="b" data-act="copy">${gl("copy")}Copy invite link</button></div>`;

export function nameIdeas() {
  const out = [];
  const lst = borrowed();
  if (lst) out.push(lst.title);
  const p = S.trip.places[0];
  const m = S.trip.start ? MONTHS[Number(S.trip.start.slice(5, 7)) - 1] : null;
  if (p && m) out.push(`${p} in ${m}`);
  if (p) out.push(S.trip.places.length > 1 ? `${p} and ${S.trip.places[1]}` : `${p} with the group`);
  if (m && !p && !lst) out.push(`${m} away`);
  if (!out.length) out.push("Summer away", "The big birthday trip", "A long weekend");
  return [...new Set(out)].slice(0, 3);
}
export const nameField = () =>
  `<label class="fld"><span class="typed">Name</span><input data-bind="trip.name" value="${esc(S.trip.name)}" autocomplete="off" maxlength="60"></label><div class="chips name-sugs">${nameIdeas().map((n) => `<button type="button" class="vchip" data-act="sug:${n}">${n}</button>`).join("")}</div>`;
const whereText = () => {
  const lst = borrowed();
  if (lst) return lst.title;
  if (S.trip.places.length) return listOf(S.trip.places);
  return S.trip.hasWhere === false ? "The group pins ideas" : "Not yet";
};
const whenWords = () => (S.trip.start ? whenText() : S.trip.hasDates === false && S.trip.poll ? "The group marks free days" : "Not yet");
export const summaryRows = () =>
  `<div class="sum"><div><span class="typed">Where</span><span>${whereText()}</span></div><div><span class="typed">When</span><span class="${S.trip.start ? "nums" : ""}">${whenWords()}</span></div><div><span class="typed">Who</span><span>${whoText()}</span></div></div>`;

export const HEAD = {
  ask: () => (fromExplore() ? head("", "", `Start ${LISTING.title}`, `${LISTING.nights} nights, ${LISTING.stops.length} stops, from ${LISTING.from}.`) : head("", "", "Start a trip", "Two quick questions. The rest follows from them.")),
  where: () => head("pin", "blue", "Where to?", "One place, or a few in order."),
  ideas: () => head("explore", "", "Need some ideas?", ideasHint()),
  dates: () => head("dates", "yellow", "When do you go?", datesHint()),
  free: () => head("people", "yellow", "Find a time together", "No dates yet is fine."),
  who: () => head("people", "", "Who is coming?", ""),
  name: () => head("", "", "Name it", ""),
};
export const BODY = {
  ask: askRows,
  where: placePicker,
  ideas: () => `${suggestions()}${groupIdeas()}`,
  dates: () => `<div class="g-cal">${calendar()}</div>`,
  free: freeChoices,
  who: whoBody,
  name: () => nameField() + summaryRows(),
};
export const stepBody = (kind) => HEAD[kind]() + BODY[kind]();

export const current = () => {
  const steps = plan();
  return { steps, i: Math.min(S.step, steps.length - 1) };
};
export const tripNav = (steps, i) => ({
  left: i === 0 ? press("close", "Cancel", "ghost") : press(`step:${i - 1}`, "Back", "ghost"),
  right: i === steps.length - 1 ? createBtn() : press(`step:${i + 1}`, "Next", "primary"),
});
export const dotsOf = (n, i) =>
  `<span class="dots" role="img" aria-label="Step ${i + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<i${k === i ? ' class="is-on"' : k < i ? ' class="is-done"' : ""}></i>`).join("")}</span>`;
export const tShell = ({ body, left, right, mid = "", top = "", size = "sm", cls = "" }) =>
  modal({
    size,
    label: "Start a trip",
    close: "close",
    place: startPlace(),
    body: `${closeX("close")}${top}<div class="g-body step-in ${cls}">${body}</div><footer class="m-foot g-foot"><span class="g-side">${left}</span>${mid}<span class="g-side g-right">${right}</span></footer>`,
  });

export { cap, gl, og, quiet, tickSvg };
