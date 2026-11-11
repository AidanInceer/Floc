// #443 post-trip recap: where it sits and what it holds. Six structurally different answers, A–F.
import { variants } from "/_house/switcher.js";
import { tripFrame, ico, esc, openSheet, closeSheet, sheetHead, toast } from "/_house/kit/trip-frame.mjs";

const TRIP = { name: "Sicily", start: "2026-09-19", end: "2026-09-28", range: "Sat 19 – Mon 28 Sep", month: "September 2026", nights: 9, days: 10, expenses: 23 };
const STOPS = [
  { place: "Palermo", nights: 3, lon: 13.36, lat: 38.12 },
  { place: "Cefalù", nights: 2, lon: 14.02, lat: 38.04 },
  { place: "Taormina", nights: 2, lon: 15.29, lat: 37.85 },
  { place: "Syracuse", nights: 2, lon: 15.27, lat: 37.07 },
];
const ME = { id: "ai", name: "Aidan", initial: "Ai", tone: 1 };
const PEOPLE = [ME,
  { id: "pr", name: "Priya", initial: "Pr", tone: 2 },
  { id: "jo", name: "Jo", initial: "Jo", tone: 3 },
  { id: "al", name: "Alex", initial: "Al", tone: 4 },
  { id: "ma", name: "Maya", initial: "Ma", tone: 6 },
  { id: "ki", name: "Kit", initial: "Ki", tone: 7 },
];
// Minor units (rule 1). Total 243720 / 6 = 40620 each.

const state = { next: null, today: new URLSearchParams(location.search).get("today") || "2026-09-29", side: null };

const face = (p, size = 26) =>
  `<span class="avatar who-${p.tone}" title="${esc(p.name)}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px">${esc(p.initial)}</span>`;
const faces = (list = PEOPLE, size = 24) => `<span class="avatar-row">${list.map((p) => face(p, size)).join("")}</span>`;
const glyph = (d) => `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${d}</svg>`;
const SHARE = glyph('<circle cx="10.5" cy="2.9" r="1.75"/><circle cx="3.5" cy="7" r="1.75"/><circle cx="10.5" cy="11.1" r="1.75"/><path d="M5 7.9l4 2.3M9 3.8L5 6.1"/>');
const NEXT = glyph('<path d="M7 2.4v9.2M2.4 7h9.2"/>');
const MOON = glyph('<path d="M11.2 8.8A4.8 4.8 0 0 1 5.2 2.8a4.8 4.8 0 1 0 6 6Z"/>');

// Rough Sicily, lon/lat, drawn as a plain sheet of land.
const COAST = [[12.43, 37.8], [12.5, 38.02], [12.62, 38.12], [12.9, 38.08], [13.08, 38.2], [13.36, 38.22], [13.55, 38.1], [13.75, 37.98], [14.05, 38.05], [14.4, 38.02], [14.75, 38.15], [15.1, 38.15], [15.42, 38.24], [15.65, 38.27], [15.55, 38.02], [15.32, 37.85], [15.18, 37.6], [15.1, 37.42], [15.22, 37.25], [15.32, 37.02], [15.14, 36.8], [15.1, 36.66], [14.82, 36.72], [14.48, 36.78], [14.25, 37.02], [13.95, 37.1], [13.55, 37.25], [13.18, 37.47], [12.9, 37.57], [12.6, 37.64]];
const px = (lon) => (lon - 12.3) * 100;
const py = (lat) => (38.38 - lat) * 127;
function routeMap({ numbers = true, cls = "" } = {}) {
  const land = COAST.map(([a, b]) => `${px(a).toFixed(1)},${py(b).toFixed(1)}`).join(" ");
  const line = STOPS.map((s, i) => `${i ? "L" : "M"}${px(s.lon).toFixed(1)} ${py(s.lat).toFixed(1)}`).join(" ");
  const pins = STOPS.map((s, i) => {
    const x = px(s.lon), y = py(s.lat);
    return numbers
      ? `<g class="pin"><circle cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y + 3.6}">${i + 1}</text></g>`
      : `<circle class="dot" cx="${x}" cy="${y}" r="4"/>`;
  }).join("");
  return `<svg class="rmap ${cls}" viewBox="0 0 350 225" role="img" aria-label="Route: ${STOPS.map((s) => s.place).join(", ")}"><polygon class="land" points="${land}"/><path class="route" d="${line}"/>${pins}</svg>`;
}


// The share card: name, route, places, nights, month. No money, no names, no head count.
function shareCard(size = "") {
  return `<figure class="card ${size}" aria-label="Share card for ${TRIP.name}">` +
    `<div class="card-top"><span class="card-mark">floc<i>.</i></span><span class="nums">${TRIP.month}</span></div>` +
    `<h3 class="card-name">${TRIP.name}</h3>` +
    routeMap({ cls: "card-map" }) +
    `<ol class="card-stops">${STOPS.map((s, i) => `<li><b class="nums">${i + 1}</b>${esc(s.place)}<span class="nums">${s.nights}${MOON}</span></li>`).join("")}</ol>` +
    `<p class="card-foot nums">${TRIP.nights} nights · ${STOPS.length} places</p></figure>`;
}

const shareBtn = (cls = "btn") => `<button type="button" class="${cls}" data-act="share">${SHARE}Share</button>`;
const nextBtn = (cls = "btn") => state.next
  ? `<a href="#" class="next-made">${esc(state.next.name || "New trip")} · ${state.next.count} invited</a>`
  : `<button type="button" class="${cls}" data-act="next">${NEXT}Plan the next one</button>`;

const stopsGhost = () =>
  `<section class="ghost ov-stops" aria-hidden="true">${STOPS.map((s, i) => `<div class="ov-stop"><b class="nums">${i + 1}</b><span>${s.place}</span><small class="nums">${s.nights} nights</small></div>`).join("")}</section>`;
const ghostLabel = (t) => `<p class="ghost-label">${t}</p>`;

// Round 2: three takes on B. Each shows the recap only once the end date has passed (rule 4: from the data, no status).
const ended = () => state.today > TRIP.end;
// The postcard while the trip is on, as it is today.
function frontCard() {
  return `<div class="pc"><p class="pc-dates nums">${TRIP.range} · ${TRIP.nights} nights</p><h2 class="pc-name">${TRIP.name}</h2>` +
    `<p class="pc-tags"><span>Beaches</span><span>Food</span><span>Old towns</span></p><p class="pc-stage nums">${state.today === TRIP.end ? "Last day" : "Underway"}</p></div>`;
}
const during = (map = routeMap()) =>
  `<section class="ov-hero b-hero"><div class="ov-map">${map}</div><div class="ov-card">${frontCard()}</div>` +
  `<div class="ov-group">${faces()}<span class="ov-files">${ico("files")}12 files</span></div></section>` + ghostLabel("Below: stops and Bookings — unchanged") + stopsGhost();
const heroWith = (map, card, cls) =>
  `<section class="ov-hero ${cls}"><div class="ov-map">${map}</div><div class="ov-card">${card}</div>` +
  `<div class="ov-group">${faces()}<span class="ov-files">${ico("files")}12 files</span></div></section>` + ghostLabel("Below: stops — unchanged") + stopsGhost();

// B3 — the postcard stays; the recap is a ruled foot under it: one line of figures, then two quiet actions.
function viewB3() {
  if (!ended()) return during();
  const card = `<div class="pc"><p class="pc-dates nums">${TRIP.range} · ${TRIP.nights} nights</p><h2 class="pc-name">${TRIP.name}</h2>` +
    `<p class="pc-tags"><span>Beaches</span><span>Food</span><span>Old towns</span></p></div>` +
    `<div class="b3-foot">` +
        `<div class="b3-acts">${shareBtn()}${nextBtn()}</div></div>`;
  return heroWith(routeMap(), card, "b-hero b3-hero");
}

const VIEWS = { B3: viewB3 };
const ROUND2 = ["B3"];
function todayBar() {
  const opt = (iso, label) => `<button type="button" data-today="${iso}" aria-pressed="${state.today === iso}">${label}</button>`;
  return `<div class="proto-bar"><b>Today</b><span class="idea">The recap shows from the day after the end date (Mon 28 Sep). No status column: it reads the date.</span>` +
    `<span class="knob"><span>Today</span>${opt("2026-09-27", "Sun 27")}${opt("2026-09-28", "Mon 28")}${opt("2026-09-29", "Tue 29")}</span></div>`;
}
let current = "B3";

function frame() {
  return tripFrame("overview", ME);
}

function render(key = current) {
  current = key;
  document.getElementById("frame").innerHTML = (ROUND2.includes(key) ? todayBar() : "") + frame(key);
  const page = document.getElementById("page");
  page.className = `page v-${key}`;
  page.innerHTML = VIEWS[key]();
}

// Share and next trip: what each button opens.
function shareSheet() {
  const d = openSheet(sheetHead("Share Sicily") + `<div class="sheet-body share-body">${shareCard()}` +
    `<p class="hint">The card holds the route, places, nights and month. No money and no names leave the trip.</p>` +
    `<div class="share-acts"><button class="btn" data-copy>Copy image</button><button class="btn btn-primary" data-save>Download</button></div></div>`);
  const done = (t) => { state.shared = true; closeSheet(); render(); toast(t); };
  d.querySelector("[data-copy]").addEventListener("click", () => done("Image copied"));
  d.querySelector("[data-save]").addEventListener("click", () => done("sicily-floc.png saved"));
}
function nextSheet() {
  const others = PEOPLE.filter((p) => p !== ME);
  const d = openSheet(sheetHead("Plan the next one") + `<div class="sheet-body">` +
    `<label class="field"><span>Trip name</span><input name="name" autocomplete="off"></label>` +
    `<div class="field"><span>Invite</span><ul class="invite">${others.map((p) => `<li><label>${face(p, 26)}<span>${p.name}</span><input type="checkbox" checked data-who="${p.id}"></label></li>`).join("")}</ul></div>` +
    `<p class="hint">Each person gets an invite in their inbox and joins when they say yes. No dates, no plan copied.</p>` +
    `<div class="sheet-foot"><button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-go>Start trip</button></div></div>`);
  d.querySelector("[data-go]").addEventListener("click", () => {
    const count = d.querySelectorAll("[data-who]:checked").length;
    state.next = { name: d.querySelector("[name=name]").value.trim(), count };
    closeSheet(); render(); toast(`Trip started · ${count} invited`);
  });
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-today], [data-side]");
  if (t) {
    if (t.dataset.today) state.today = t.dataset.today; else state.side = t.dataset.side;
    render();
    return;
  }
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!act) return;
  e.preventDefault();
  ({ share: shareSheet, next: nextSheet })[act]();
});

variants([{ key: "B3", name: "Postcard stays, recap foot", round: 2 }], render);
render(new URLSearchParams(location.search).get("variant") || "B3");
