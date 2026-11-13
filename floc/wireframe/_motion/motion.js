// The chosen round 1 motions: a stop that opens, ticking a thing off, copying an address (A each). Days, menus, the map and tabs moved to real/ in round 2. The screen ends the same in every variant; only the motion differs. Throwaway: state lives in memory.
import { variants } from "/_house/switcher.js";
import { tripFrame, ico, esc } from "/_house/kit/trip-frame.mjs";

const me = { name: "Aidan", initial: "Ai", tone: 1 };
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.2, 0.85, 0.3, 1)";
const page = document.getElementById("page");
const frame = document.getElementById("frame");
const play = (el, frames, ms, more = {}) => (RM ? null : el.animate(frames, { duration: ms, easing: EASE, fill: "both", ...more }));
const wait = (ms) => new Promise((r) => setTimeout(r, RM ? 0 : ms));

const IDEAS = {
  2: { tab: "overview", title: "Overview: a stop that opens" },
  4: { tab: "packing", title: "Packing: ticking a thing off" },
  7: { tab: "files", title: "Files: copying the inbox address" },
};

const LIST = [
  { key: "2A", name: "Row opens · height", spec: "The row grows to its height and the chevron turns. 0.22s." },
  { key: "4A", name: "Tick · draws", spec: "The tick draws itself as the box turns green and the words go quiet. 0.22s." },
  { key: "7A", name: "Copy · button washes pen", spec: "The button washes pen for a second: 0.22s in, hold, 0.22s out. Its words stay; a tick stands in for its icon while it holds." },
];
const specOf = (key) => LIST.find((v) => v.key === key);

let variant = "2A";
const say = (text) => { const el = page.querySelector(".last"); if (el) el.textContent = text; };

function shell(key, stage) {
  const v = specOf(key);
  const idea = IDEAS[key[0]];
  frame.innerHTML = tripFrame(idea.tab, me);
  page.innerHTML =
    `<header class="brief"><h1>${esc(idea.title)}</h1><p>${esc(v.name.split(" · ")[1])} — ${esc(v.spec)}</p><p class="last" aria-live="polite"></p></header>` +
    `<section class="stage m-${key}">${stage}</section>`;
}

/* 2 — Rows that open */
const STOPS = [
  { name: "Lisbon", sub: "3 nights · 21–24 Dec", lines: [["Mon 21", "Land at Lisbon · Tram 28 to Alfama"], ["Tue 22", "Belém Tower · Dinner in Alfama"], ["Wed 23", "Nothing planned"]] },
  { name: "Lagos", sub: "4 nights · 24–28 Dec", lines: [["Thu 24", "Train to Lagos · Ponta da Piedade walk"], ["Fri 25", "Praia do Camilo · Christmas lunch"], ["Sat 26", "Nothing planned"], ["Sun 27", "Kayak to the grottoes"]] },
  { name: "Home", sub: "Mon 28 Dec", lines: [["Mon 28", "Flight from Faro, 14:20"]] },
];
function idea2(key) {
  shell(key, `<h2>Stops</h2>` + STOPS.map((s, i) =>
    `<div class="stop" data-open="false"><button aria-expanded="false"><b>${i + 1}. ${s.name}</b><small>${s.sub}</small>${ico("chev")}</button>` +
    `<div class="stop-body"><div><div class="pad">${s.lines.map(([d, t]) => `<div class="ln"><time>${d}</time><span>${esc(t)}</span></div>`).join("")}</div></div></div></div>`).join(""));
  page.querySelectorAll(".stop").forEach((stop) => stop.querySelector("button").addEventListener("click", () => {
    const open = stop.dataset.open !== "true";
    stop.dataset.open = String(open);
    stop.querySelector("button").setAttribute("aria-expanded", String(open));
    const lines = [...stop.querySelectorAll(".ln")];
    say(`${stop.querySelector("b").textContent} is ${open ? "open" : "closed"}.`);
  }));
}

/* 4 — Ticked items */
const BAG = ["Passport", "Phone charger", "Swim shorts", "Suncream", "Travel adapter"];
const TICK = `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.2 7.3 5.8 9.8l5-5.6"/></svg>`;
function idea4(key) {
  const row = (label) => `<div class="row-line item" data-done="false"><button class="tick" aria-pressed="false" aria-label="Packed: ${label}">${TICK}</button><span class="grow"><span class="label">${label}</span></span></div>`;
  shell(key,
    `<div class="tools"><h2>Your bag</h2><span class="count" id="count">0 of ${BAG.length} packed</span><button class="btn btn-quiet" id="reset">Start again</button></div>` +
    `<div id="todo">${BAG.map(row).join("")}</div>` +
    "");
  let packed = 0;
  const count = () => { page.querySelector("#count").textContent = `${packed} of ${BAG.length} packed`; };
  page.querySelector("#reset").addEventListener("click", () => idea4(key));
  page.querySelectorAll(".item").forEach((item) => item.querySelector(".tick").addEventListener("click", () => {
    if (item.dataset.done === "true") return;
    item.dataset.done = "true";
    item.querySelector(".tick").setAttribute("aria-pressed", "true");
    packed += 1;
    count();
    const label = item.querySelector(".label").textContent;
    say(`${label} packed.`);
  }));
}

/* 7 — Copy */
const ADDRESS = "trip-1-b35577ee6df3@in.floc.app";
const COPY_GLYPH = `<svg class="g" viewBox="0 0 14 14" aria-hidden="true"><rect x="4.4" y="4.4" width="7.8" height="7.8" rx="1.4"/><path d="M9.6 4.4V3a1.2 1.2 0 0 0-1.2-1.2H3A1.2 1.2 0 0 0 1.8 3v5.4A1.2 1.2 0 0 0 3 9.6h1.4"/></svg>`;
function idea7(key) {
  const block = (hint, value, verb) =>
    `<div class="inbox"><div class="grow"><p>${hint}</p><span class="addr">${value}</span></div>` +
    `<button class="btn copy" data-value="${value}"><span>${COPY_GLYPH}${verb}</span></button></div>`;
  shell(key, block("Forward a booking email here. Its attachments land in Yours.", ADDRESS, "Copy address") +
    `<div class="split">${block("Your friend tag", "Aidan#B864", "Copy friend tag")}</div>`);
  page.querySelectorAll(".copy").forEach((btn) => {
    let busy = false;
    btn.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      say(`Copied ${btn.dataset.value}.`);
      if (key === "7A") {
        const glyph = btn.querySelector(".g");
        const was = glyph.outerHTML;
        glyph.outerHTML = '<svg class="g" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5 5.5 10.5 11.5 3.5"/></svg>';
        btn.classList.add("washed");
        await wait(1220);
        btn.classList.remove("washed");
        btn.querySelector(".g").outerHTML = was;
      }
      busy = false;
    });
  });
}

const BUILD = { 2: idea2, 4: idea4, 7: idea7 };

// Why: one page per idea, so each is judged alone; the page's motion-idea meta says which, and its variants are A, B and C.
const IDEA = document.querySelector('meta[name="motion-idea"]').content;
const MINE = LIST.filter((v) => v.key[0] === IDEA);
variants(MINE.map((v) => ({ key: v.key[1], name: v.name.split(" · ")[1] })), (letter) => {
  variant = IDEA + (MINE.some((v) => v.key[1] === letter) ? letter : "A");
  BUILD[IDEA](variant);
});
