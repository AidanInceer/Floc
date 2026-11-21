import { ico, esc, avatar, dom, monthName, monthGrid, shortDate, formatRange, nights, plural } from "/_house/kit/trip-frame.mjs";

export const PEOPLE = [
  { id: "ai", name: "Aidan", initial: "Ai", tone: 1 },
  { id: "na", name: "Nadia", initial: "Na", tone: 2 },
  { id: "me", name: "Mei", initial: "Me", tone: 3 },
  { id: "ca", name: "Callum", initial: "Ca", tone: 4 },
  { id: "jo", name: "Jonas", initial: "Jo", tone: 6 },
  { id: "ru", name: "Ruth", initial: "Ru", tone: 7 },
];
export const ME = PEOPLE[0];
export const person = (id) => PEOPLE.find((p) => p.id === id);
export const nameOf = (id) => (id === ME.id ? "you" : person(id).name);
export const faces = (ids, size = 22) => (ids.length ? `<span class="faces">${ids.map((id) => avatar(person(id), size)).join("")}</span>` : "");
export function nameList(ids) {
  const sorted = [...ids].sort((a, b) => (a === ME.id) - (b === ME.id));
  const n = sorted.map(nameOf);
  return n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}
export const upper = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const waiting = (ids) => (ids.length ? `<p class="wait">Waiting on ${nameList(ids)}</p>` : "");

export const span = (a, b) => formatRange(a, b);
export const nightsOf = (a, b) => plural(nights(a, b), "night");
export const inRange = (iso, r) => Boolean(r && r.a) && (r.b ? iso >= r.a && iso <= r.b : iso === r.a);
export const rangeCls = (iso, r, name) => (inRange(iso, r) ? ` ${name}${iso === r.a || iso === r.b ? " edge" : ""}` : "");
export function pickRange(sel, iso) {
  if (!sel || !sel.a || sel.b || iso <= sel.a) return { a: iso, b: null };
  return { a: sel.a, b: iso };
}

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function cal(ym, cell) {
  const cells = monthGrid(ym).flat().map((iso) => (iso ? cell(iso) : "<span></span>")).join("");
  return `<div class="cal"><div class="cal-head">` +
    `<button type="button" class="iconbtn" data-act="month" data-step="-1" data-k="m-prev" aria-label="Previous month">${ico("chevL")}</button>` +
    `<span class="cal-month nums">${monthName(ym)}</span>` +
    `<button type="button" class="iconbtn" data-act="month" data-step="1" data-k="m-next" aria-label="Next month">${ico("chevR")}</button></div>` +
    `<div class="cal-grid">${WD.map((d) => `<span class="cal-wd">${d}</span>`).join("")}${cells}</div></div>`;
}
export function day(iso, o = {}) {
  const label = esc(shortDate(iso) + (o.label ? `, ${o.label}` : ""));
  const inner = `<span class="nums">${dom(iso)}</span>${o.extra ?? ""}`;
  if (o.still) return `<span class="cal-d ${o.cls ?? ""}" role="img" aria-label="${label}">${inner}</span>`;
  return `<button type="button" class="cal-d ${o.cls ?? ""}" data-act="${o.act}" data-iso="${iso}" data-k="d-${iso}"${o.paint ? " data-paint" : ""}${o.mode ? ` data-mode="${o.mode}"` : ""} aria-label="${label}"` +
    `${o.pressed === undefined ? "" : ` aria-pressed="${o.pressed}"`}>${inner}</button>`;
}
export const tripCls = (s, iso) => (inRange(iso, s.trip) ? " trip" : "");

export const sameTrip = (s, a, b) => Boolean(s.trip) && s.trip.a === a && s.trip.b === b;
export const setBtn = (s, a, b, o = {}) =>
  sameTrip(s, a, b)
    ? `<span class="badge green">Set</span>`
    : `<button type="button" class="btn${o.quiet ? "" : " btn-primary"}" data-act="set" data-a="${a}" data-b="${b}" data-k="set-${a}-${b}">${o.label ?? "Set the dates"}</button>`;

const BASE = ["Your days", "The group", "The trip", "Forecast"];
export function rail(on, extra, live = []) {
  const tabs = extra ? [extra, ...BASE] : BASE;
  return tabs.map((label) => {
    const act = label === on || live.includes(label) ? "tab" : "tab-off";
    return `<button type="button" data-act="${act}" data-tab="${esc(label)}" data-k="tab-${esc(label)}" aria-current="${label === on}">${esc(label)}</button>`;
  }).join("");
}

export const state = { variant: "A", group: "open", ym: "2027-02", trip: null };
