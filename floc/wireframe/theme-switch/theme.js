// Theme switch: B chosen (2026-11-14) — your face opens a card with the theme. State in memory.
import { variants } from "/_house/switcher.js";

const G = {
  explore: '<circle cx="7" cy="7" r="5"/><path d="M9.2 4.8 8 8 4.8 9.2 6 6z"/>',
  trips: '<path d="M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4M1.6 8h10.8"/>',
  bell: '<path d="M3.5 9.8V6.3a3.5 3.5 0 0 1 7 0v3.5l1 1.2h-9l1-1.2Z"/><path d="M5.8 12.3a1.3 1.3 0 0 0 2.4 0"/>',
  sun: '<circle cx="7" cy="7" r="2.4"/><path d="M7 1.6v1.2M7 11.2v1.2M1.6 7h1.2M11.2 7h1.2M3.2 3.2l.8.8M10 10l.8.8M10.8 3.2l-.8.8M4 10l-.8.8"/>',
  moon: '<path d="M11.2 8.8A4.8 4.8 0 0 1 5.2 2.8a4.8 4.8 0 1 0 6 6Z"/>',
  screen: '<rect x="1.8" y="2.6" width="10.4" height="7" rx="1"/><path d="M5 12h4M7 9.6V12"/>',
  person: '<circle cx="7" cy="4.8" r="2.4"/><path d="M2.6 12.2c.5-2.4 2.2-3.8 4.4-3.8s3.9 1.4 4.4 3.8"/>',
  friends: '<circle cx="5" cy="5" r="1.9"/><path d="M1.6 11.4c.4-1.8 1.7-2.8 3.4-2.8s3 1 3.4 2.8"/><circle cx="10" cy="5.6" r="1.5"/><path d="M9.4 8.7c1.5 0 2.6.9 3 2.5"/>',
  group: '<circle cx="4.4" cy="5.2" r="1.6"/><circle cx="9.6" cy="5.2" r="1.6"/><path d="M1.6 11c.3-1.6 1.4-2.5 2.8-2.5s2.5.9 2.6 2.5M7 11c.1-1.6 1.2-2.5 2.6-2.5s2.5.9 2.8 2.5"/>',
  wish: '<path d="M3.4 1.9h7.2v10.2L7 9.6l-3.6 2.5Z"/>',
  heart: '<path d="M7 11.8S1.9 8.7 1.9 5.2A2.7 2.7 0 0 1 7 4a2.7 2.7 0 0 1 5.1 1.2c0 3.5-5.1 6.6-5.1 6.6Z"/>',
  mail: '<rect x="1.6" y="3" width="10.8" height="8" rx="1.2"/><path d="M1.9 3.6 7 7.6l5.1-4"/>',
  chev: '<path d="M4.2 5.6 7 8.4l2.8-2.8"/>',
  arrow: '<path d="M2.4 7h9.2M8 3.4 11.6 7 8 10.6"/>',
  out: '<path d="M8.4 2.4H11a.8.8 0 0 1 .8.8v7.6a.8.8 0 0 1-.8.8H8.4M5.6 4.4 3 7l2.6 2.6M3 7h6"/>',
};
const g = (n) => `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${G[n]}</svg>`;
const ME = { name: "Priya Raman", first: "Priya", initials: "PR", email: "priya@raman.travel", tags: ["City breaks", "Food first"] };
const face = (size) => `<span class="face who-2" style="width:${size}px;height:${size}px;font-size:${Math.round(size / 2.6)}px">${ME.initials}</span>`;

const CHOICES = [["light", "Light", "sun"], ["dark", "Dark", "moon"], ["system", "Auto", "screen"]];
const state = { v: "B", choice: "light", open: false };
const dark = matchMedia("(prefers-color-scheme: dark)");
const resolved = () => (state.choice === "system" ? (dark.matches ? "dark" : "light") : state.choice);

function choose(next) {
  state.choice = next;
  window.WFTheme?.(resolved());
  render();
}

/* ——— Shared chrome ——— */
const item = (inner, attrs = "", cls = "") => `<button class="it ${cls}" ${attrs}>${inner}</button>`;
const bell = () => item(`<span class="tile">${g("bell")}<span class="count">2</span></span>`, 'aria-label="Inbox, 2 new"', "only");
const you = (attrs = "") => item(`${face(26)}<span class="label">${ME.first}</span>`, attrs);

function topbar(youBead) {
  return `<header class="top"><div class="top-in">
    <span class="bead logo"><span class="wordmark">floc<i>.</i></span></span>
    <nav class="bead">${item(`<span class="tile">${g("explore")}</span><span class="label">Explore</span>`)}${item(`<span class="tile">${g("trips")}<span class="count">1</span></span><span class="label">Trips</span>`)}</nav>
    <div class="bead">${youBead}</div>
  </div></header>`;
}

const TABS = [[["Profile", "person", true]], [["Friends", "friends"], ["Groups", "group"], ["Wish lists", "wish"]], [["Saved", "heart"], ["Packing", "trips"], ["Bookings", "mail"]]];
const accountBar = () => `<div class="abar"><nav class="abar-in" aria-label="Your account">${TABS.map((c, i) => `${i ? '<span class="sep"></span>' : ""}${c
  .map(([l, ic, on]) => `<span class="atab" ${on ? 'aria-current="page"' : ""}><span class="tile">${g(ic)}</span><span class="l">${l}</span></span>`).join("")}`).join("")}</nav><span class="now">Profile</span></div>`;

const segments = (words = true) => `<div class="seg" role="group" aria-label="Theme">${CHOICES.map(([k, l, ic]) =>
  `<button data-pick="${k}" aria-pressed="${state.choice === k}" title="${l}">${g(ic)}${words ? `<span>${l}</span>` : ""}</button>`).join("")}</div>`;

const faceCard = (extra = "") => `<section class="card me">${face(52)}<span class="me-name">${ME.name.split(" ")[0]}</span><div class="chips">${ME.tags.map((t) => `<span class="chip">${t}</span>`).join("")}</div>${extra}</section>`;
const ROWS = [["Privacy", "Friends see 4 of 4"], ["Your travel style", "City breaks and food first"], ["Trips", "Balanced packing, GBP"]];
const ROWS2 = [["Notifications", "Push, Email, Reminders"], ["Account", ME.email], ["Your data", "No analytics, no marketing email"]];
const sheet = (rows) => `<section class="card">${rows.map(([t, s]) => `<div class="row"><span class="m"><span class="t">${t}</span><span class="s">${s}</span></span>${g("chev")}</div>`).join("")}</section>`;
const footSheet = (withTheme) => `<section class="card"><div class="foot">${withTheme ? segments(false) : "<span></span>"}<button class="it">${g("out")}<span>Sign out</span></button></div></section>`;

/* B · your face opens a small card: you (to Profile), the theme, sign out. Two clicks. */
function B() {
  const pop = state.open
    ? `<div class="scrim" data-close></div><div class="pop" role="dialog" aria-label="You">
        <button class="pop-who">${face(36)}<span class="m"><span class="t">${ME.name}</span><span class="s">${ME.email}</span></span>${g("arrow")}</button>
        <div class="pop-sec">${segments(true)}</div>
        <button class="pop-out">${g("out")}<span>Sign out</span></button></div>`
    : "";
  return `${topbar(bell() + you(`data-open-card ${state.open ? "data-open" : ""} aria-expanded="${state.open}" aria-label="You"`) + pop)}${accountBar()}<main class="wrap">${faceCard()}${sheet(ROWS)}${sheet(ROWS2)}${footSheet(false)}</main>`;
}

const RENDER = { B };
function render() {
  document.getElementById("app").innerHTML = RENDER[state.v]();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-pick],[data-open-card],[data-close]");
  if (!t) return;
  if (t.dataset.pick) return choose(t.dataset.pick);
  if (t.hasAttribute("data-open-card")) state.open = !state.open;
  if (t.hasAttribute("data-close")) state.open = false;
  render();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.open) {
    state.open = false;
    render();
  }
});
dark.addEventListener("change", () => state.choice === "system" && choose("system"));
// The house Light/Dark switch on the right moves the page too; follow it so the controls never disagree.
new MutationObserver(() => {
  const now = document.documentElement.dataset.theme;
  if (now !== resolved()) {
    state.choice = now;
    render();
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

variants(
  [
    { key: "B", name: "Your face opens a card" },
  ],
  (key) => {
    state.v = "B";
    state.open = false;
    render();
  },
);
render();
