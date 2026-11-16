import { variants } from "/_house/switcher.js";
import { tripFrame, ico, esc, formatRange, shortDate, nights, plural, openSheet, sheetHead, toast } from "/_house/kit/trip-frame.mjs";

const X = {
  out: '<path d="M4.8 9.2 9.4 4.6M5.4 4.6h4v4"/>',
  upload: '<path d="M7 9V2.8M4.6 5.2 7 2.8l2.4 2.4M2.6 9.2v2.2h8.8V9.2"/>',
  tune: '<path d="M2.2 4.4h1.4M6.4 4.4h5.4M2.2 9.6h5.4M10.4 9.6h1.4"/><circle cx="5" cy="4.4" r="1.4"/><circle cx="9" cy="9.6" r="1.4"/>',
};
const g = (n) => (X[n] ? `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${X[n]}</svg>` : ico(n));

const ME = { name: "Priya", tone: 1 };
const MAX = 2;
const CAT = {
  flights: ["Google Flights", "Skyscanner", "Kayak", "Kiwi.com"],
  stays: ["Booking.com", "Trip.com", "Airbnb", "Hotels.com", "Hostelworld"],
};
const USE = {
  "Google Flights": "Compare fares", Skyscanner: "Compare fares", Kayak: "Compare fares", "Kiwi.com": "Mix airlines",
  "Booking.com": "Hotels and flats", "Trip.com": "Hotels and flats", Airbnb: "Whole homes and rooms", "Hotels.com": "Hotels and flats", Hostelworld: "Hostels",
};
const FLIGHT = { id: "fly", place: "Into London, home from Amiens", a: "2027-05-28", b: "2027-05-31" };
const STOPS = [
  { id: "lon", place: "Greater London", a: "2027-05-28", b: "2027-05-29" },
  { id: "dov", place: "Dover", a: "2027-05-29", b: "2027-05-30" },
  { id: "ami", place: "Amiens", a: "2027-05-30", b: "2027-05-31", hotel: "Hôtel Le Prieuré" },
];

const state = {
  sites: { flights: ["Google Flights", "Skyscanner"], stays: ["Booking.com", "Trip.com"] },
  pop: null,
  fresh: null,
  booked: true,
};
let dlg = null;

const stays = () => STOPS.map((s) => ({ ...s, hotel: state.booked ? s.hotel : undefined }));
const when = (s) => `${formatRange(s.a, s.b)} · ${plural(nights(s.a, s.b), "night")}`;
const flightWhen = () => `Out ${shortDate(FLIGHT.a)}, back ${shortDate(FLIGHT.b)}`;
const mine = (kind) => state.sites[kind];
const isOn = (kind, site) => mine(kind).includes(site);
const can = (kind, site) => (isOn(kind, site) ? mine(kind).length > 1 : mine(kind).length < MAX);
const fresh = (site) => (state.fresh === site ? " fresh" : "");

function toggle(kind, site) {
  if (!can(kind, site)) return;
  const adding = !isOn(kind, site);
  state.sites[kind] = adding ? [...mine(kind), site] : mine(kind).filter((s) => s !== site);
  if (!adding) return;
  state.fresh = site;
  clearTimeout(toggle.t);
  toggle.t = setTimeout(() => { state.fresh = null; render(); }, 1400);
}

const goAttrs = (site, row) => `href="#" data-go="${esc(site)}" data-for="${esc(row.place)}"`;
const siteBtn = (site, row) => `<a class="btn site${fresh(site)}" ${goAttrs(site, row)}>${esc(site)}${g("out")}<span class="sr-only">(opens another site)</span></a>`;
const booked = (row) => `<a class="booked" href="#" data-toast="Opens Files" aria-label="Booked: ${esc(row.hotel)}">${ico("bed")}<b>Booked</b><span class="bk-name">${esc(row.hotel)}</span></a>`;
const who = (row, sub) => `<div class="who"><span class="name">${esc(row.place)}</span><span class="when nums">${sub}</span></div>`;
const partHead = (kind) => `<div class="part-head">${ico(kind === "flights" ? "flight" : "bed")}<h3>${kind === "flights" ? "Flights" : "Stays"}</h3></div>`;
const ghost = () => `<section class="ghost">Above: the Dates calendar and who can make it — unchanged</section>`;

const moreMenu = (row) => {
  const key = `more:${row.id}`;
  const open = state.pop === key;
  return `<div class="pop-wrap"><button type="button" class="iconbtn" data-pop="${key}" aria-expanded="${open}" aria-label="More for ${esc(row.place)}">${ico("more")}</button>` +
    (open ? `<div class="pop" role="menu"><button type="button" class="mi" role="menuitem" data-toast="Pick a booking file for ${esc(row.place)}">${g("upload")}<span>Add booking file</span></button>` +
      `<button type="button" class="mi" role="menuitem" data-toast="Opens Days">${ico("bed")}<span>Change where you sleep</span></button></div>` : "") + `</div>`;
};

function checks(kind) {
  return CAT[kind].map((site) => {
    const on = isOn(kind, site);
    const blocked = !can(kind, site);
    const why = blocked ? (on ? "Keep at least one" : "Up to 2") : "";
    return `<div class="ck-line"><button type="button" class="ck" role="checkbox" aria-checked="${on}" ${blocked ? "disabled" : ""} title="${why}" data-toggle="${kind}|${esc(site)}">` +
      `<span class="box">${ico("check")}</span><span class="ck-name">${esc(site)}</span><small>${USE[site]}</small></button></div>`;
  }).join("");
}

function sheet() {
  const sec = (kind) => `<section class="ds"><p class="mlabel"><span>${kind === "flights" ? "Flights" : "Stays"}</span><span class="nums">${mine(kind).length} of ${MAX}</span></p>${checks(kind)}</section>`;
  return `${sheetHead("Booking sites")}<div class="sheet-body">${sec("flights")}${sec("stays")}<div class="sheet-foot"><button type="button" class="btn btn-primary" data-close>Done</button></div></div>`;
}

function D() {
  const part = (kind, rows) => `<div class="part">${partHead(kind)}` +
    rows.map((r) => `<div class="row">${who(r, kind === "flights" ? flightWhen() : when(r))}<div class="acts">${r.hotel ? booked(r) : mine(kind).map((s) => siteBtn(s, r)).join("")}</div>${moreMenu(r)}</div>`).join("") + `</div>`;
  return `<section class="card" id="booking"><div class="card-head"><h2>Get booking</h2><button type="button" class="btn" data-sheet>${g("tune")}Booking sites</button></div>` +
    part("flights", [FLIGHT]) + part("stays", stays()) + `<p class="foot">Opens another site. Floc isn't paid for these links.</p></section>`;
}

function render() {
  document.getElementById("frame").innerHTML = tripFrame("dates", ME);
  document.getElementById("page").innerHTML = ghost() + D();
  document.getElementById("proto").innerHTML = `<span class="typed">Prototype</span><button type="button" data-proto="booked">${state.booked ? "Amiens booked" : "Nothing booked"}</button>`;
  if (dlg?.open) dlg.innerHTML = sheet();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go],[data-pop],[data-toggle],[data-sheet],[data-toast],[data-proto],.tf-tabs a,.tf-places a");
  if (state.pop && !e.target.closest(".pop-wrap")) { state.pop = null; if (!t) return render(); }
  if (!t) return;
  if (t.matches("a")) e.preventDefault();
  const d = t.dataset;
  if (d.go) { toast(`Opens ${d.go} for ${d.for}`); return render(); }
  if (d.pop) { state.pop = state.pop === d.pop ? null : d.pop; return render(); }
  if (d.toggle) { const [k, s] = d.toggle.split("|"); toggle(k, s); return render(); }
  if (d.sheet !== undefined) { dlg = openSheet(sheet()); return; }
  if (d.toast) { toast(d.toast); state.pop = null; return render(); }
  if (d.proto) { state.booked = !state.booked; return render(); }
  toast("Not in this prototype");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.pop) { state.pop = null; render(); }
});

variants([
  { key: "D", round: 1, name: "One settings dialog", note: "Chosen. Rows keep your sites as buttons, with no chevron; Add booking file sits in the … menu. Booking sites in the card head opens one dialog for flights and stays: tick up to two a kind, each with what it is for." },
], () => render());

render();
