// #637 the account side: B4e, the chosen variant (picked 2026-11-13). Settings joins Profile in the build. State in memory.
import { variants } from "/_house/switcher.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const G = {
  explore: '<circle cx="7" cy="7" r="5"/><path d="M9.2 4.8 8 8 4.8 9.2 6 6z"/>',
  trips: '<path d="M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4M1.6 8h10.8"/>',
  friends: '<circle cx="5" cy="5" r="1.9"/><path d="M1.6 11.4c.4-1.8 1.7-2.8 3.4-2.8s3 1 3.4 2.8"/><circle cx="10" cy="5.6" r="1.5"/><path d="M9.4 8.7c1.5 0 2.6.9 3 2.5"/>',
  person: '<circle cx="7" cy="4.8" r="2.4"/><path d="M2.6 12.2c.5-2.4 2.2-3.8 4.4-3.8s3.9 1.4 4.4 3.8"/>',
  sliders: '<path d="M2 4h6M10.4 4H12M2 10h1.6M6 10h6"/><circle cx="9.2" cy="4" r="1.2"/><circle cx="4.8" cy="10" r="1.2"/>',
  heart: '<path d="M7 11.8S1.9 8.7 1.9 5.2A2.7 2.7 0 0 1 7 4a2.7 2.7 0 0 1 5.1 1.2c0 3.5-5.1 6.6-5.1 6.6Z"/>',
  wish: '<path d="M3.4 1.9h7.2v10.2L7 9.6l-3.6 2.5Z"/>',
  packing: '<path d="M3.2 4.6h7.6l-.6 7.4H3.8zM5.2 4.6V3.4a1.8 1.8 0 0 1 3.6 0v1.2"/>',
  ticket: '<path d="M3.2 1.8h7.6v10.4l-1.9-1.2-1.9 1.2-1.9-1.2-1.9 1.2Z"/><path d="M5.2 6.2l1.3 1.3 2.4-2.6"/>',
  bell: '<path d="M3.5 9.8V6.3a3.5 3.5 0 0 1 7 0v3.5l1 1.2h-9l1-1.2Z"/><path d="M5.8 12.3a1.3 1.3 0 0 0 2.4 0"/>',
  chev: '<path d="M4.2 5.6 7 8.4l2.8-2.8"/>',
  chevR: '<path d="M5.6 4.2 8.4 7l-2.8 2.8"/>',
  back: '<path d="M8.4 4.2 5.6 7l2.8 2.8"/>',
  more: '<circle cx="3" cy="7" r=".9"/><circle cx="7" cy="7" r=".9"/><circle cx="11" cy="7" r=".9"/>',
  sun: '<circle cx="7" cy="7" r="2.4"/><path d="M7 1.6v1.2M7 11.2v1.2M1.6 7h1.2M11.2 7h1.2M3.2 3.2l.8.8M10 10l.8.8M10.8 3.2l-.8.8M4 10l-.8.8"/>',
  moon: '<path d="M11.2 8.8A4.8 4.8 0 0 1 5.2 2.8a4.8 4.8 0 1 0 6 6Z"/>',
  screen: '<rect x="1.8" y="2.6" width="10.4" height="7" rx="1"/><path d="M5 12h4M7 9.6V12"/>',
  out: '<path d="M8.4 2.4H11a.8.8 0 0 1 .8.8v7.6a.8.8 0 0 1-.8.8H8.4M5.6 4.4 3 7l2.6 2.6M3 7h6"/>',
  plus: '<path d="M7 2.8v8.4M2.8 7h8.4"/>',
  cross: '<path d="M3.6 3.6l6.8 6.8M10.4 3.6l-6.8 6.8"/>',
  globe: '<circle cx="7" cy="7" r="5.2"/><path d="M1.8 7h10.4M7 1.8c1.6 1.5 2.4 3.2 2.4 5.2S8.6 10.7 7 12.2C5.4 10.7 4.6 9 4.6 7S5.4 3.3 7 1.8Z"/>',
  search: '<circle cx="6.2" cy="6.2" r="3.8"/><path d="m9 9 3 3"/>',
  arrow: '<path d="M2.4 7h9.2M8 3.4 11.6 7 8 10.6"/>',
  group: '<circle cx="4.4" cy="5.2" r="1.6"/><circle cx="9.6" cy="5.2" r="1.6"/><path d="M1.6 11c.3-1.6 1.4-2.5 2.8-2.5s2.5.9 2.6 2.5M7 11c.1-1.6 1.2-2.5 2.6-2.5s2.5.9 2.8 2.5"/>',
};
const g = (n, cls = "") => `<svg class="g ${cls}${n === "more" ? " fill" : ""}" viewBox="0 0 14 14" aria-hidden="true">${G[n]}</svg>`;

const initials = (name) => {
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? p[0][0] + p[1][0] : p[0].slice(0, 2);
};
const face = (p, size = 26) =>
  `<span class="face who-${p.tone}" title="${esc(p.name)}" style="width:${size}px;height:${size}px;font-size:${Math.max(10, Math.round(size * 0.38))}px">${esc(initials(p.name))}</span>`;
const faces = (list, size = 22) => `<span class="faces">${list.map((p) => face(p, size)).join("")}</span>`;

const ME = { name: "Priya Raman", email: "priya@raman.travel", tone: 2, tag: "priya#R4QT", plan: "Free", tags: ["City breaks", "Food first"] };
const F = {
  so: { name: "Sofia Alves", tone: 1 }, tw: { name: "Tom Whitfield", tone: 4 }, cr: { name: "Callum Reid", tone: 3 },
  jb: { name: "Jonas Berg", tone: 6 }, mt: { name: "Mei Tanaka", tone: 5 }, no: { name: "Nadia Okafor", tone: 7 }, ev: { name: "Elliot Vance", tone: 8 },
};
const FRIENDS = [F.so, F.tw, F.cr, F.jb, F.mt, F.no];
const REQUESTS = [F.ev];
const GROUPS = [
  { name: "Uni lot", people: [F.so, F.tw, F.cr, F.jb] },
  { name: "Ski crew", people: [F.jb, F.mt, F.no, F.tw, F.cr] },
];
const SAVED = [
  { place: "Lisbon", where: "Portugal", tone: "red", fig: "4 nights", price: "£640" },
  { place: "Kyoto", where: "Japan", tone: "green", fig: "6 nights", price: "£1,820" },
  { place: "Dolomites", where: "Italy", tone: "blue", fig: "5 nights", price: "£980" },
  { place: "Oaxaca", where: "Mexico", tone: "yellow", fig: "7 nights", price: "£1,540" },
];
const WISH = [
  { name: "Japan, some spring", count: 5, mine: true, with: [F.mt] },
  { name: "Ski 2027", count: 3, mine: true, with: [F.jb, F.no] },
  { name: "Mei's food list", count: 9, mine: false, owner: F.mt },
  { name: "Sofia's beaches", count: 4, mine: false, owner: F.so },
];
const PACKING = [
  { name: "Beach week", count: 24 },
  { name: "Ski kit", count: 31 },
  { name: "Carry-on only", count: 12 },
];
const BOOKINGS = [
  { what: "TAP 1351 · LHR to LIS", when: "Fri 18 Sep 2026", kind: "Flight" },
  { what: "Casa do Bairro, Lisbon", when: "18 – 21 Sep 2026", kind: "Hotel" },
];
const INBOX = [
  { who: F.so, text: "Sofia added 2 expenses to Portugal, late summer", when: "2h", unread: true },
  { who: F.ev, text: "Elliot Vance wants to be friends", when: "5h", unread: true },
  { who: F.mt, text: "Mei shared Japan, some spring with you", when: "Tue", unread: false },
];
const unread = () => INBOX.filter((i) => i.unread).length + 0;

const state = {
  v: "A",
  page: "profile",
  menu: new URLSearchParams(location.search).get("menu") === "1",
  bell: false,
  theme: "light",
};

const narrow = () => matchMedia("(max-width: 640px)").matches;

/* ——— Top bar ——— */
function navBead(items, current) {
  return `<nav class="bead nav" aria-label="Main">${items
    .map(([key, label, icon, badge]) => `<button class="nav-i" data-go="${key}" ${current === key ? 'aria-current="page"' : ""}>
      <span class="nav-ico">${g(icon)}</span><span class="nav-l">${label}</span>${badge ? `<span class="dot-n nums">${badge}</span>` : ""}</button>`)
    .join("")}</nav>`;
}
function pill({ caret = true, badge = true, action = "menu" } = {}) {
  const n = unread();
  return `<button class="bead pill" data-act="${action}" aria-label="Account${badge && n ? `, ${n} new` : ""}" ${state.menu ? 'data-open="true"' : ""}>
    <span class="rel">${face(ME, 30)}${badge && n ? `<span class="badge nums">${n}</span>` : ""}</span>
    <span class="pill-l">Priya</span>${caret ? g("chev") : ""}</button>`;
}
function bellBead() {
  const n = unread();
  return `<button class="bead bell" data-act="bell" aria-label="Inbox, ${n} new" ${state.bell ? 'data-open="true"' : ""}>
    <span class="rel">${g("bell")}${n ? `<span class="badge nums">${n}</span>` : ""}</span></button>`;
}
function topbar({ nav, current, right }) {
  return `<header class="top"><div class="top-in">
    <button class="bead logo" data-go="trips" aria-label="Floc home"><span class="wordmark">floc<i>.</i></span></button>
    ${navBead(nav, current)}
    <div class="right">${right}</div>
  </div></header>`;
}

/* ——— Shared page parts ——— */
const sr = (t) => `<h1 class="sr-only">${esc(t)}</h1>`;
function globe(size = 260) {
  const dots = [[92, 74], [104, 82], [118, 70], [86, 96], [110, 104], [180, 120], [196, 132]];
  return `<svg class="globe" viewBox="0 0 260 260" width="${size}" height="${size}" aria-label="Travel map, 7 countries">
    <circle cx="130" cy="130" r="122" class="g-sea"/>
    <path class="g-line" d="M8 130h244M130 8v244M30 70h200M30 190h200"/>
    <ellipse cx="130" cy="130" rx="60" ry="122" class="g-line"/>
    <path class="g-land" d="M70 60c20-10 46-8 60 4 8 8 2 20 10 28s24 2 28 14-14 20-26 18-18 10-30 6-12-18-24-22-26-4-28-18 0-22 10-30Z"/>
    <path class="g-land" d="M160 112c14-4 30 2 40 12s6 26-6 30-26-2-34-12-12-26 0-30Z"/>
    ${dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" class="g-been"/>`).join("")}
  </svg>`;
}
function stats() {
  return `<dl class="stats">${[["7", "countries"], ["4", "trips"], ["23", "nights away"]]
    .map(([n, l]) => `<div><dt class="nums">${n}</dt><dd>${l}</dd></div>`).join("")}</dl>`;
}
function profileHead(size = 56) {
  return `<div class="me-head">${face(ME, size)}<div><h2 class="me-name">${esc(ME.name)}</h2>
    <div class="chips">${ME.tags.map((t) => `<span class="chip">${t}</span>`).join("")}</div></div></div>`;
}
function profileBody() {
  return `${sr("Your profile")}<section class="card prof">${profileHead()}</section>
    <section class="card map"><div class="map-in">${globe(narrow() ? 240 : 300)}${stats()}</div></section>`;
}
function savedBody() {
  return `<div class="tiles">${SAVED.map((s) => `<article class="tile">
    <div class="tile-wash wash-${s.tone}"><span class="tile-place">${s.place}</span><button class="heart" aria-pressed="true" aria-label="Saved">${g("heart")}</button></div>
    <div class="tile-foot"><span>${s.where}</span><span class="nums tile-fig"><span>${s.fig}</span><span>${s.price}</span></span><button class="start" aria-label="Start trip"><span class="start-l">Start trip</span>${g("arrow")}</button></div>
  </article>`).join("")}</div>`;
}
function wishRows(list) {
  return `<ul class="rows">${list.map((w) => `<li class="row"><span class="row-ico">${g("wish")}</span>
    <span class="row-main"><span class="row-t">${esc(w.name)}</span><span class="row-s nums">${w.count} places</span></span>
    ${w.mine ? faces(w.with, 22) : `<span class="row-s owner">${face(w.owner, 22)}</span>`}
    <button class="ib" aria-label="More">${g("more")}</button></li>`).join("")}</ul>`;
}
function wishBody() {
  return `<div class="card"><div class="card-h">Yours</div>${wishRows(WISH.filter((w) => w.mine))}
    <div class="card-h ruled">Shared with you</div>${wishRows(WISH.filter((w) => !w.mine))}</div>`;
}
function packingBody() {
  return `<div class="card"><label class="add"><span class="typed">New list</span><input aria-label="New packing list"><button class="btn">Add</button></label>
    <ul class="rows">${PACKING.map((p) => `<li class="row"><span class="row-ico">${g("packing")}</span><span class="row-main"><span class="row-t">${p.name}</span><span class="row-s nums">${p.count} things</span></span><button class="ib" aria-label="More">${g("more")}</button></li>`).join("")}</ul></div>`;
}
function bookingsBody() {
  return `<div class="card"><div class="card-h">Waiting for a trip <span class="count nums">${BOOKINGS.length}</span></div>
    <ul class="rows">${BOOKINGS.map((b) => `<li class="row"><span class="row-ico">${g("ticket")}</span><span class="row-main"><span class="row-t">${b.what}</span><span class="row-s nums">${b.when}</span></span><button class="btn">Add to trip</button></li>`).join("")}</ul></div>`;
}
function friendRows(list = FRIENDS) {
  return `<ul class="rows">${list.map((p) => `<li class="row">${face(p, 30)}<span class="row-main"><span class="row-t">${esc(p.name)}</span></span><button class="ib" aria-label="More">${g("more")}</button></li>`).join("")}</ul>`;
}
function requestRows() {
  return `<ul class="rows">${REQUESTS.map((p) => `<li class="row">${face(p, 30)}<span class="row-main"><span class="row-t">${esc(p.name)}</span><span class="row-s">Wants to be friends</span></span><span class="two"><button class="btn btn-primary">Accept</button><button class="btn">Decline</button></span></li>`).join("")}</ul>`;
}
function groupRows() {
  return `<ul class="rows">${GROUPS.map((gr) => `<li class="row"><span class="row-ico">${g("group")}</span><span class="row-main"><span class="row-t">${gr.name}</span><span class="row-s nums">${gr.people.length} people</span></span>${faces(gr.people, 22)}<button class="ib" aria-label="More">${g("more")}</button></li>`).join("")}</ul>`;
}
function addFriend() {
  return `<label class="add"><span class="typed">Name or friend tag</span><input aria-label="Name or friend tag"><button class="btn">Find</button></label>`;
}
function friendsBody({ wish = false } = {}) {
  return `<div class="card"><div class="card-h">Requests <span class="count nums">${REQUESTS.length}</span></div>${requestRows()}
    <div class="ruled pad">${addFriend()}</div>
    <div class="card-h ruled">Friends <span class="count nums">${FRIENDS.length}</span></div>${friendRows()}
    <div class="card-h ruled">Groups <span class="count nums">${GROUPS.length}</span></div>${groupRows()}
    ${wish ? `<div class="card-h ruled">Wish lists</div>${wishRows(WISH)}` : ""}</div>`;
}
function settingsBody() {
  const r = (t, v, act = "Change") => `<li class="row"><span class="row-main"><span class="typed">${t}</span><span class="row-t">${v}</span></span><button class="btn">${act}</button></li>`;
  return `<div class="card"><div class="card-h">Account</div><ul class="rows">${r("Name", esc(ME.name))}${r("Email", ME.email)}${r("Friend tag", `<span class="nums">${ME.tag}</span>`, "Copy")}</ul>
    <div class="card-h ruled">Plan</div><ul class="rows">${r("Plan", "Free", "See Pro")}</ul>
    <div class="card-h ruled">Notifications</div><ul class="rows">${r("Email", "A digest each morning")}${r("Calendar feed", "Off", "Turn on")}</ul></div>`;
}
function inboxRows(list = INBOX) {
  return `<ul class="rows inbox">${list.map((i) => `<li class="row ${i.unread ? "new" : ""}">${face(i.who, 26)}<span class="row-main"><span class="row-t">${esc(i.text)}</span></span><span class="row-s nums">${i.when}</span></li>`).join("")}</ul>`;
}
function themeSwitch() {
  return `<div class="seg theme" role="group" aria-label="Theme">${[["light", "sun", "Light"], ["dark", "moon", "Dark"], ["system", "screen", "System"]]
    .map(([k, i, l]) => `<button data-theme-pick="${k}" aria-label="${l}" aria-pressed="${state.theme === k}">${g(i)}</button>`).join("")}</div>`;
}
const signOut = () => `<button class="quiet">${g("out")}Sign out</button>`;
function pass() {
  return `<div class="pass">${face(ME, 36)}<div class="pass-m"><span class="row-t">${esc(ME.name)}</span><span class="row-s nums">${ME.email}</span></div>
    <div class="pass-p"><span class="typed">Plan</span><span class="pass-plan">${ME.plan}</span></div></div>`;
}
const BODY = { profile: profileBody, saved: savedBody, wish: wishBody, packing: packingBody, bookings: bookingsBody, friends: friendsBody, settings: settingsBody };
const TITLE = { profile: "Profile", settings: "Settings", saved: "Saved", wish: "Wish lists", packing: "Packing", bookings: "Bookings", friends: "Friends", inbox: "Inbox" };

function popover(inner, cls = "") {
  return `<div class="scrim clear" data-act="close"></div><div class="pop ${cls}" role="menu">${inner}</div>`;
}
function bellPop() {
  return state.bell ? popover(`<div class="pop-h big"><span class="row-t">Inbox</span><button class="link">Mark all read</button></div>${inboxRows()}<div class="pop-foot c"><button class="link">See all</button></div>`, "pop-bell") : "";
}
const MAIN_NAV = [["explore", "Explore", "explore"], ["trips", "Trips", "trips", 1]];

/* ——— Top bar: logo, Explore + Trips, the bell, and your name, a link to Profile (no menu) ——— */
function accountTop() {
  const you = `<button class="bead pill" data-go="profile" aria-label="Your profile">${face(ME, 30)}<span class="pill-l">Priya</span></button>`;
  return topbar({ nav: MAIN_NAV, current: "", right: bellBead() + bellPop() + you });
}

/* ——— Pages ——— */
const friendsOnly = () => `<div class="card"><div class="card-h">Requests <span class="count nums">${REQUESTS.length}</span></div>${requestRows()}<div class="ruled pad">${addFriend()}</div>
  <div class="card-h ruled">Friends <span class="count nums">${FRIENDS.length}</span></div>${friendRows()}</div>`;
const groupsBody = () => `<div class="card">${groupRows()}<div class="ruled pad"><button class="btn">${g("plus")}New group</button></div></div>`;
const PAGES = { profile: () => BODY.profile(), friends: friendsOnly, groups: groupsBody, wish: wishBody, saved: savedBody, packing: packingBody, bookings: bookingsBody, settings: settingsBody };
const NAME = { ...TITLE, groups: "Groups" };
const pageKey = (p) => (PAGES[p] ? p : "friends");
const CLUSTERS = [
  [["profile", "Profile", "person"], ["settings", "Settings", "sliders"]],
  [["friends", "Friends", "friends", 1], ["groups", "Groups", "group"], ["wish", "Wish lists", "wish"]],
  [["saved", "Saved", "heart"], ["packing", "Packing", "packing"], ["bookings", "Bookings", "ticket", 2]],
];
const COUNT = { profile: 7, friends: FRIENDS.length, groups: GROUPS.length, wish: WISH.length, saved: SAVED.length, packing: PACKING.length, bookings: BOOKINGS.length };

/* B4e · one bar, eight pages, three clusters split by hairlines */
function B4() {
  const p = pageKey(state.page);
  const bar = `<div class="abar"><nav class="abar-in flat7" aria-label="Your account">${CLUSTERS.map((items, i) => `${i ? '<span class="abar-sep" aria-hidden="true"></span>' : ""}${items
    .map(([k, l, ic, n]) => `<button class="atab k-${k}" data-go="${k}" aria-label="${l}" ${p === k ? 'aria-current="page"' : ""}><span class="atab-ico rel">${g(ic)}${n ? `<span class="pip nums">${n}</span>` : ""}</span><span class="atab-l">${l}</span></button>`).join("")}`).join("")}</nav>
    <div class="abar-now only-n" aria-hidden="true">${NAME[p]}</div></div>`;
  return `${accountTop()}${bar}<main class="wrap">${sr(NAME[p]) + (p === "settings" ? settingsBody() + `<div class="card"><div class="pop-foot">${themeSwitch()}${signOut()}</div></div>` : PAGES[p]())}</main>`;
}

/* Chosen: B4e. Packing takes the Trips suitcase; Bookings is the envelope of the confirmation email. */
G.ticket = '<rect x="1.6" y="3" width="10.8" height="8" rx="1.2"/><path d="M1.9 3.6 7 7.6l5.1-4"/>';
G.packing = G.trips;

const RENDER = { B4e: B4 };

function render() {
  document.getElementById("app").innerHTML = `<div class="v v-${state.v}">${RENDER[state.v]()}</div>`;
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go],[data-act],[data-theme-pick]");
  if (!t) return;
  if (t.dataset.go) {
    const go = t.dataset.go;
    if (go === "explore" || go === "trips") return;
    state.page = go;
    state.menu = false; state.bell = false; state.adding = false;
  } else if (t.dataset.themePick) {
    state.theme = t.dataset.themePick;
  } else {
    const a = t.dataset.act;
    if (a === "menu") { state.menu = !state.menu; state.bell = false; }
    if (a === "bell") { state.bell = !state.bell; state.menu = false; }
    if (a === "close") { state.menu = false; state.bell = false; }
    if (a === "action") state.adding = !state.adding;
  }
  render();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { state.menu = state.bell = false; render(); } });
matchMedia("(max-width: 640px)").addEventListener("change", render);

function start(key) {
  const params = new URLSearchParams(location.search);
  state.v = "B4e";
  state.page = params.get("page") || "friends";
  state.menu = params.get("menu") === "1";
  state.bell = params.get("bell") === "1";
  state.adding = false;
  render();
}
variants(
  [
    { key: "B4e", code: "B4e", name: "One bar, eight pages, three clusters; your name is a link to Profile", round: 5 },
  ],
  start,
);
if (!document.getElementById("app").innerHTML) start(new URLSearchParams(location.search).get("variant") || "B4");
