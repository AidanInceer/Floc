import { ico } from "/_house/switcher.js";
import { placeWords, nightsWords } from "./data.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const last = (trip) => trip.stops.length - 1;
const kindOf = (trip, i) => (i === 0 ? "start" : i === last(trip) ? "end" : "night");

const seg = `<svg class="seg seg-v" aria-hidden="true"><line x1="50%" y1="0" x2="50%" y2="100%" stroke-width="1.5"/></svg>`;

const mark = (kind) => {
  if (kind === "night") return `<svg class="mk mk-night" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4.4"/></svg>`;
  const inner = kind === "start" ? `<path d="M5.6 4.4 9.8 7l-4.2 2.6Z"/>` : `<rect x="4.8" y="4.8" width="4.4" height="4.4"/>`;
  return `<svg class="mk mk-end" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6.5"/>${inner}</svg>`;
};
const odot = `<i class="odot" aria-hidden="true"></i>`;

const head = (trip) => `
  <header class="bp-head">
    <span class="bp-tag t-${trip.tone}" title="${esc(trip.countries.join(", "))}" aria-label="${esc(trip.countries.join(", "))}">${esc(placeWords(trip.countries))}</span>
    <h3 class="bp-title">${esc(trip.title)}</h3>
    <p class="bp-figs">${nightsWords(trip.nights)} · from ${trip.price}</p>
  </header>`;

const acts = () => `
  <div class="bp-acts">
    <a class="bp-start" href="#" onclick="return false">Start this trip ${ico("arrow")}</a>
    <a class="bp-full" href="#" onclick="return false">See the full trip</a>
  </div>`;

const pager = (trip) => `
  <div class="bp-pager">
    <span class="bp-count" data-count>Stop 1 of ${trip.stops.length}</span>
    <span class="bp-steps">
      <button type="button" class="bp-step" data-go="-1" aria-label="Previous stop"><svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.6 3.4 5 7l3.6 3.6"/></svg></button>
      <button type="button" class="bp-step" data-go="1" aria-label="Next stop"><svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M5.4 3.4 9 7l-3.6 3.6"/></svg></button>
    </span>
  </div>`;

function row(trip, s, i) {
  const out = s.out ? `<span class="bp-out">${odot}${esc(s.out.name)}</span>` : "";
  return `<li><button type="button" class="bp-row" data-stop="${i}">
    <span class="bp-mark">${i > 0 ? seg : ""}${mark(kindOf(trip, i))}</span>
    <span class="bp-name"><span class="bp-place">${esc(s.name)}</span>${out}</span>
    <span class="bp-n">${nightsWords(s.nights)}</span>
  </button></li>`;
}

function setNow(root, i, n) {
  root.querySelectorAll("[data-stop]").forEach((b) => {
    const on = Number(b.dataset.stop) === i;
    b.classList.toggle("is-now", on);
    if (on) b.setAttribute("aria-current", "step");
    else b.removeAttribute("aria-current");
  });
  const c = root.querySelector("[data-count]");
  if (c) c.textContent = `Stop ${i + 1} of ${n}`;
  root.querySelectorAll("[data-go]").forEach((b) => {
    const to = i + Number(b.dataset.go);
    b.disabled = to < 0 || to >= n;
  });
}

export const PANELS = {
  A2: {
    layout: "side",
    build: (trip) => `<aside class="bp" style="--n:${trip.stops.length}">${head(trip)}${pager(trip)}<ol class="bp-list">${trip.stops.map((s, i) => row(trip, s, i)).join("")}</ol>${acts()}</aside>`,
    update: (root, trip, i) => setNow(root, i, trip.stops.length),
  },
};
