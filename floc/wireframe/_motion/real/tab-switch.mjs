// Motion 6, chosen B: going to another trip tab; one tile slides to the new tab. Each tab draws its live page, so the switch is judged between real pages.
import { mount, run, say, glyph, button, SKIN } from "./shared.mjs";
import { avatar } from "/_house/kit/trip-frame.mjs";
import { daysPage, placeWash } from "./days.mjs";
import { filesData, filesPage } from "./files.mjs";
import { overviewPage, placeArrows } from "./overview.mjs";

const LIST = [
  { key: "B", name: "Tile slides", spec: "One tile slides from the old tab to the new and turns the new tab's colour on the way. 0.26s. The page changes at once." },
];

const KEYS = Object.keys(SKIN);

const datesPage = () => {
  const stay = (name, when) =>
    `<div class="bk-row"><span><b>${name}</b><small class="nums">${when}</small></span><span class="flex"></span>${button("Booking.com", { icon: "arrow" })}${button("Airbnb", { icon: "arrow" })}<button type="button" class="ib framed" aria-label="Upload a booking">${glyph("upload")}</button></div>`;
  return `<div class="dates-head"><p class="nums">Mon 21 Dec – Sun 27 Dec 2026 <small>6 nights</small></p><button type="button" class="ib" aria-label="Dates actions">${glyph("more")}</button></div>${button("Change the dates")}` +
    `<section class="card book"><h3 class="typed">Get booking</h3><div class="bk-group"><div class="bk-row head">${glyph("flight")}<b>Flights</b><span class="flex"></span>${button("Google Flights", { icon: "arrow" })}${button("Skyscanner", { icon: "arrow" })}</div></div>` +
    `<div class="bk-group"><div class="bk-row head">${glyph("bed")}<b>Stays</b></div>${stay("Lisbon", "Mon 21 Dec – Thu 24 Dec · 3 nights")}${stay("Lagos", "Thu 24 Dec – Sun 27 Dec · 3 nights")}</div></section>`;
};

const moneyPage = () => {
  const owe = (p, amount) => `<div class="m-row">${avatar(p, 26)}<span>${p.name}</span><span class="flex"></span><b class="nums">${amount}</b>${button("Settle up")}</div>`;
  const act = (what, who, amount) => `<div class="m-row act"><span class="act-g">${glyph("food")}</span><span><b>${what}</b><small>${who}</small></span><span class="flex"></span><b class="nums sm">${amount}</b><button type="button" class="ib" aria-label="More">${glyph("more")}</button></div>`;
  return `<div class="page-top">${button("Add expense", { kind: "primary" })}</div><div class="money-grid">` +
    `<section class="card m-card"><h2>You owe</h2>${owe({ name: "Priya Shah", initial: "PS", tone: 3 }, "£36.57")}</section>` +
    `<section class="card m-card"><h2>You are owed</h2>${owe({ name: "Tom Hale", initial: "TH", tone: 2 }, "£24.10")}${owe({ name: "Sofia Reyes", initial: "SR", tone: 5 }, "£12.40")}</section></div>` +
    `<section class="card m-card"><h2>Activity</h2>${act("Dinner at Cervejaria Ramiro", "Priya paid · split 4 ways", "€163.50")}${act("Train to Lagos", "You paid · split 4 ways", "€124.00")}${act("Pastéis de Belém", "Tom paid · split 4 ways", "€14.80")}</section>`;
};

const packingPage = () => {
  const list = (title, items, done) =>
    `<section class="card pk-card"><header><b>${title}</b><small class="nums">${done}/${items.length}</small></header>${items.map((t, i) => `<div class="pk-row"><span class="tickbox${i < done ? " on" : ""}">${i < done ? glyph("check") : ""}</span><span class="${i < done ? "quiet" : ""}">${t}</span></div>`).join("")}</section>`;
  return `<div class="pk-head"><h2>Your bag</h2><small class="typed">12 things</small><span class="flex"></span>${button("Fill your bag", { icon: "chev" })}</div>` +
    `<div class="pk-grid">${list("Essentials", ["1 — passport", "1 — phone charger", "1 — travel adapter", "1 — EHIC card"], 2)}${list("Clothes", ["4 — t-shirt", "1 — jumper", "1 — swim shorts", "1 — rain jacket"], 1)}${list("Toiletries", ["1 — toothbrush", "1 — suncream", "1 — any medication", "1 — deodorant"], 0)}</div>`;
};

const notesPage = () =>
  `<section class="card notes"><aside><span class="typed">Pages</span><a class="on">Where to eat</a><a>Lagos beaches</a><a>Getting around</a><span class="flex"></span><a class="new">${glyph("plus")}New page</a></aside>` +
  `<article><h1>Where to eat</h1><p>Book Cervejaria Ramiro for Wednesday; it does not take tables after nine.</p><p>Priya says the custard tarts at Manteigaria beat Belém. Settle it on Tuesday.</p></article></section>`;

const BODY = {
  overview: overviewPage,
  dates: datesPage,
  days: () => daysPage(1),
  money: moneyPage,
  packing: packingPage,
  notes: notesPage,
  files: () => filesPage(filesData()),
};

const page = mount({ tab: "overview", title: "Trip tabs: going to another tab" });
const nav = document.querySelector(".tf-tabs");
const tabs = [...nav.querySelectorAll("a:not(.tf-gear)")];
let tile = null;

function fill(key) {
  page.className = `page real tab-${key}${key === "files" ? " files-page" : ""}${key === "overview" ? " overview-page" : ""}`;
  page.innerHTML = BODY[key]();
  if (key === "days") placeWash(page, 1);
  if (key === "overview") placeArrows(page.querySelector(".map-svg"));
}

function placeTile(i, now = false) {
  const gl = tabs[i].querySelector(".tf-gl").getBoundingClientRect();
  const box = nav.getBoundingClientRect();
  if (now) tile.style.transition = "none";
  tile.style.transform = `translate(${gl.left - box.left}px, ${gl.top - box.top}px)`;
  tile.style.background = `var(${SKIN[KEYS[i]][0]})`;
  if (now) requestAnimationFrame(() => { tile.style.transition = ""; });
}

function build() {
  nav.className = "tf-tabs live slide";
  tabs.forEach((a, i) => {
    a.style.setProperty("--tab-bg", `var(${SKIN[KEYS[i]][0]})`);
    a.style.setProperty("--tab-ink", `var(${SKIN[KEYS[i]][1]})`);
    a.toggleAttribute("aria-current", i === 0);
    if (i === 0) a.setAttribute("aria-current", "page");
    a.onclick = (e) => {
      e.preventDefault();
      const from = tabs.findIndex((t) => t.hasAttribute("aria-current"));
      if (from === i) return;
      tabs.forEach((t) => t.removeAttribute("aria-current"));
      a.setAttribute("aria-current", "page");
      fill(KEYS[i]);
      placeTile(i);
      say(`Now on ${a.textContent.trim()}.`);
    };
  });
  tile?.remove();
  tile = null;
  tile = document.createElement("span");
  tile.className = "tab-tile";
  nav.prepend(tile);
  placeTile(0, true);
  fill("overview");
}

addEventListener("resize", () => {
  if (tile) placeTile(tabs.findIndex((t) => t.hasAttribute("aria-current")), true);
  if (page.classList.contains("tab-days")) placeWash(page, 1);
});
run(LIST, build);
