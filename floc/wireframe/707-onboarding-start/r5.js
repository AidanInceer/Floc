import { S, INVITE, esc, face, firstName, gl, hello, live, tripFolk, whenText } from "./kit.js";
import { STYLE, VIBES, airportPicker, cap, finish, gShell, head, nav, og } from "./ob.js";
import { borrowed, current, dotsOf, stepBody, tShell, tripNav } from "./trip.js";

const tick = () => og("check", "tk");

const tileFor = (sel, { on, act, icon, label, pop }) => {
  const glyph = on && sel !== "ring" && sel !== "fade" ? tick() : og(icon);
  if (sel === "chips") return `<button type="button" class="vchip${pop ? " pop" : ""}" aria-pressed="${on}" data-act="${act}">${glyph}<span>${label}</span></button>`;
  return `<button type="button" class="vt${pop ? " pop" : ""}" aria-pressed="${on}" data-act="${act}"><span class="vt-ic">${glyph}</span><span>${label}</span></button>`;
};
const wrap = (sel, rowish, picked, inner) =>
  sel === "chips" ? `<div class="chips vchips${rowish ? " chip-row" : ""}">${inner}</div>` : `<div class="tiles${rowish ? " tiles-row" : ""}${picked ? " has-pick" : ""}">${inner}</div>`;

export const styleRows = (sel) =>
  `<div class="seg-rows">${STYLE.map((g) => {
    const picked = !!S.me.style[g.key];
    const inner = g.options.map(([v, label, icon]) => {
      const id = `style:${g.key}=${v}`;
      return tileFor(sel, { on: S.me.style[g.key] === v, act: id, icon, label, pop: S.pop === id });
    }).join("");
    return `<div class="seg-row"><span class="typed">${g.label}</span>${wrap(sel, true, picked, inner)}</div>`;
  }).join("")}</div>`;
export const vibeGrid = (sel) =>
  wrap(sel, false, S.me.tags.length > 0, VIBES.map(([tag, icon]) => tileFor(sel, { on: S.me.tags.includes(tag), act: `tag:${tag}`, icon, label: cap(tag), pop: S.pop === tag })).join(""));

const tip = (person, size, you) =>
  `<span class="tip" tabindex="0" data-tip="${esc(person.name)}${you ? " (you)" : ""}">${face(person, size)}</span>`;
export const facesTip = (size = 30) =>
  `<span class="avatar-row tips">${tripFolk().map((p, i) => tip(p, size, i === 0)).join("")}</span>`;

const copyBtn = (kind = "") =>
  `<button type="button" class="b copy5${kind ? ` b-${kind}` : ""}${S.copied ? " is-copied" : ""}" data-act="copy5">${S.copied ? og("check", "tk") : gl("copy")}Copy invite link</button>`;
const peopleChips = () =>
  S.arrive === "invite"
    ? `<div class="chips who-chips">${INVITE.people.map((p) => `<button type="button" class="vchip" aria-pressed="${S.trip.people.includes(p.name)}" data-act="person:${p.name}">${face(p, 20)}${esc(firstName(p.name))}</button>`).join("")}</div>`
    : "";
const peopleGrid = () =>
  `<div class="who-grid">${[S.me, ...(S.arrive === "invite" ? INVITE.people : [])].map((p, i) => {
    const on = i === 0 || S.trip.people.includes(p.name);
    const label = i === 0 ? "You" : esc(firstName(p.name));
    return i === 0
      ? `<span class="who-cell is-you">${face(p, 44)}<span>${label}</span></span>`
      : `<button type="button" class="who-cell" aria-pressed="${on}" data-act="person:${p.name}">${face(p, 44)}<span>${label}</span></button>`;
  }).join("")}</div>`;

export const WHO = {
  stack: () => `<div class="who5">${facesTip(40)}${peopleChips()}${copyBtn()}</div>`,
  link: () =>
    `<div class="who5">${facesTip(40)}${peopleChips()}<div class="linkbox"><span class="nums">floc.app/join/7KQ2M9</span>${copyBtn("primary").replace("Copy invite link", "Copy")}</div></div>`,
  grid: () => `<div class="who5">${peopleGrid()}${copyBtn()}</div>`,
  plain: () => `<div class="who5">${facesTip(40)}${peopleChips()}${copyBtn("primary")}</div>`,
};

const whereList = () => {
  const lst = borrowed();
  if (lst) return lst.stops.map(([p]) => p).join(", ");
  if (S.trip.places.length) return S.trip.places.join(", ");
  return S.trip.hasWhere === false ? "Not decided yet, the group pins ideas" : "Not decided yet";
};
const whenLine = () => (S.trip.start ? `<span class="nums">${whenText()}</span>` : "No dates decided yet");
const facts = (split) => [
  ["Where", esc(whereList())],
  ["When", split && S.trip.start ? whenText().split(" · ").map((p) => `<span class="nums">${p}</span>`).join("<br>") : whenLine()],
  ["Who", facesTip(26)],
];
export const nameInput = () =>
  `<label class="fld"><span class="typed">Name</span><input data-bind="trip.name" value="${esc(S.trip.name)}" autocomplete="off" maxlength="60"></label>`;

export const SUMMARY = {
  rows: () => `<div class="sum5 boxed">${facts().map(([k, v]) => `<div><span class="typed">${k}</span><span class="sum5-v">${v}</span></div>`).join("")}</div>`,
  cells: () => `<div class="sum5-cells">${facts(true).map(([k, v]) => `<div><span class="typed">${k}</span><span class="sum5-v">${v}</span></div>`).join("")}</div>`,
  ticket: () =>
    `<div class="ticket5"><p class="ticket5-name">${live("trip.name")}</p>${facts().map(([k, v]) => `<div><span class="typed">${k}</span><span class="sum5-v">${v}</span></div>`).join("")}</div>`,
  plain: () => `<div class="sum5">${facts().map(([k, v]) => `<div><span class="typed">${k}</span><span class="sum5-v">${v}</span></div>`).join("")}</div>`,
};
