// The trip's chrome and the small helpers the Dates and Days mockups share. Drawn by eye from the app; never imported by it.

const G = {
  explore: '<circle cx="7" cy="7" r="5"/><path d="M9.2 4.8 8 8 4.8 9.2 6 6z"/>',
  trips: '<path d="M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4M1.6 8h10.8"/>',
  friends: '<circle cx="5" cy="5" r="1.9"/><path d="M1.6 11.4c.4-1.8 1.7-2.8 3.4-2.8s3 1 3.4 2.8"/><circle cx="10" cy="5.6" r="1.5"/><path d="M9.4 8.7c1.5 0 2.6.9 3 2.5"/>',
  overview: '<path d="M2 3h10v8H2zM2 9l3-2.6 2.4 2 2-1.5L12 9.4"/>',
  dates: '<path d="M2.2 3.4h9.6v8.4H2.2zM2.2 6h9.6M4.8 2v2.4M9.2 2v2.4"/>',
  days: '<circle cx="3.4" cy="3.6" r="1.2"/><circle cx="10.6" cy="10.4" r="1.2"/><path d="M4.6 3.6h4.6a1.7 1.7 0 0 1 0 3.4H4.8a1.7 1.7 0 0 0 0 3.4h4.6"/>',
  money: '<circle cx="7" cy="7" r="5"/><path d="M8.6 4.6a1.8 1.8 0 0 0-3.1 1.2v3.6H4.6M4.6 7.4h3M5.5 9.4h4"/>',
  packing: '<path d="M3.2 4.6h7.6l-.6 7.4H3.8zM5.2 4.6V3.4a1.8 1.8 0 0 1 3.6 0v1.2"/>',
  notes: '<path d="M3 1.8h5.4L11 4.4v7.8H3zM8.2 1.8v2.8H11M5 7h4M5 9.4h3"/>',
  files: '<path d="M1.8 3.2h3.6l1.2 1.4h5.6v7H1.8z"/>',
  more: '<circle cx="3" cy="7" r=".9"/><circle cx="7" cy="7" r=".9"/><circle cx="11" cy="7" r=".9"/>',
  chev: '<path d="M4.2 5.6 7 8.4l2.8-2.8"/>',
  chevL: '<path d="M8.4 4.2 5.6 7l2.8 2.8"/>',
  chevR: '<path d="M5.6 4.2 8.4 7l-2.8 2.8"/>',
  check: '<path d="M3.2 7.3 5.8 9.8l5-5.6"/>',
  plus: '<path d="M7 2.8v8.4M2.8 7h8.4"/>',
  cross: '<path d="M3.6 3.6l6.8 6.8M10.4 3.6l-6.8 6.8"/>',
  arrow: '<path d="M2.4 7h9.2M8 3.4 11.6 7 8 10.6"/>',
  pin: '<path d="M7 12.4s3.8-3.6 3.8-6.6a3.8 3.8 0 0 0-7.6 0c0 3 3.8 6.6 3.8 6.6Z"/><circle cx="7" cy="5.8" r="1.3"/>',
  bed: '<path d="M1.8 11.6V3.2M1.8 8.8h10.4v2.8M1.8 6.6h3.6v2.2M5.4 6.6h5a1.8 1.8 0 0 1 1.8 1.8v.4"/>',
  flight: '<path d="M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z"/>',
  train: '<rect x="3" y="1.8" width="8" height="8.4" rx="1.8"/><path d="M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"/>',
  car: '<path d="M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10"/><circle cx="4.4" cy="10.9" r="1"/><circle cx="9.6" cy="10.9" r="1"/>',
  ferry: '<path d="M2.2 8.2h9.6l-1.4 3H3.6ZM4.2 8.2V5.4h5.6v2.8M7 5.4V2.6"/>',
  food: '<path d="M4.2 1.8v4.2M2.8 1.8v2.6a1.4 1.4 0 0 0 2.8 0V1.8M4.2 6v6.2M10.2 12.2V1.8c-1.4.6-2.2 2-2.2 3.8v1.6h2.2"/>',
  activity: '<path d="M1.9 4.2h10.2v1.7a1.1 1.1 0 0 0 0 2.2v1.7H1.9V8.1a1.1 1.1 0 0 0 0-2.2ZM8.6 4.2v5.6"/>',
  note: '<path d="M2.6 3.6h8.8M2.6 7h8.8M2.6 10.4h5.2"/>',
  clip: '<path d="M10.8 6.4 6.6 10.6a2.4 2.4 0 0 1-3.4-3.4l4.6-4.6a1.6 1.6 0 0 1 2.3 2.3L5.6 9.4a.8.8 0 0 1-1.2-1.2l3.9-3.9"/>',
  chat: '<path d="M2 3h10v6.6H6.4L3.6 12V9.6H2Z"/>',
  clock: '<circle cx="7" cy="7" r="5.2"/><path d="M7 4v3.2l2 1.2"/>',
  star: '<path d="M7 1.9 8.6 5.2 12.2 5.7 9.6 8.2 10.2 11.8 7 10.1 3.8 11.8 4.4 8.2 1.8 5.7 5.4 5.2Z"/>',
  people: '<circle cx="5.2" cy="5" r="2"/><path d="M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3"/><path d="M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8"/>',
  sun: '<circle cx="7" cy="7" r="2.6"/><path d="M7 1.6V3M7 11v1.4M1.6 7H3M11 7h1.4M3.2 3.2l1 1M9.8 9.8l1 1M10.8 3.2l-1 1M4.2 9.8l-1 1"/>',
  part: '<circle cx="4.8" cy="4.6" r="1.9"/><path d="M4.8 1.3V2M1.5 4.6h.7M2.5 2.3l.5.5M7.1 2.3l-.5.5"/><path d="M5.6 12a2.2 2.2 0 0 1 .3-4.4 2.9 2.9 0 0 1 5.5 1 1.8 1.8 0 0 1-.4 3.4Z"/>',
  cloud: '<path d="M4.2 11a2.6 2.6 0 0 1 .3-5.2 3.4 3.4 0 0 1 6.5 1.1A2.1 2.1 0 0 1 10.4 11Z"/>',
  rain: '<path d="M4.2 8.6a2.4 2.4 0 0 1 .3-4.8 3.2 3.2 0 0 1 6.1 1A2 2 0 0 1 10.2 8.6Z"/><path d="M5 10.4l-.6 1.6M7.4 10.4l-.6 1.6M9.8 10.4l-.6 1.6"/>',
  fold: '<path d="M2.4 7h9.2M4.8 2.6 7 4.6l2.2-2M4.8 11.4 7 9.4l2.2 2"/>',
};

export const ico = (name, cls = "") =>
  `<svg class="g ${cls}${name === "more" ? " fill" : ""}" viewBox="0 0 14 14" aria-hidden="true">${G[name] ?? ""}</svg>`;

export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const avatar = (p, size = 26) =>
  `<span class="avatar who-${p.tone}" title="${esc(p.name)}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${esc(p.initial ?? p.name[0])}</span>`;

const TABS = [["overview", "Overview"], ["dates", "Dates"], ["days", "Days"], ["money", "Money"], ["packing", "Packing"], ["notes", "Notes"], ["files", "Files"]];
const PLACES = [["explore", "Explore"], ["trips", "Trips"], ["friends", "Friends"]];
const FLOCK = '<svg viewBox="0 0 28 22" aria-hidden="true"><path d="M3.4 16.5 7 12.9 10.6 16.5"/><path d="M10.4 10 14 6.4 17.6 10"/><path d="M17.4 16.5 21 12.9 24.6 16.5"/></svg>';

export function tripFrame(tab, me) {
  const places = PLACES.map(([key, label]) =>
    `<a href="#"${key === "trips" ? ' aria-current="page"' : ""}><span class="tf-gl">${ico(key)}</span><span>${label}</span>${key === "trips" ? '<span class="tf-count">2</span>' : ""}</a>`).join("");
  const tabs = TABS.map(([key, label]) =>
    `<a href="#"${key === tab ? ' aria-current="page"' : ""}><span class="tf-gl">${ico(key)}</span><span>${label}</span></a>`).join("");
  return `<header class="tf-bar"><div class="tf-beads"><span class="tf-bead"><span class="tf-word">${FLOCK}<span>floc<i>.</i></span></span></span>` +
    `<nav class="tf-bead tf-places" aria-label="Places">${places}</nav><span class="tf-bead"><span class="tf-you">${avatar(me, 32)}</span></span></div></header>` +
    `<nav class="tf-tabs" aria-label="Trip sections">${tabs}</nav>`;
}

// Dates are YYYY-MM-DD strings, read in UTC (rule 10).
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const at = (iso) => new Date(iso + "T00:00:00Z");
export const addDays = (iso, n) => { const d = at(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const dow = (iso) => (at(iso).getUTCDay() + 6) % 7;
export const dom = (iso) => Number(iso.slice(8, 10));
export const weekday = (iso) => WD[dow(iso)];
export const monthShort = (iso) => MO[Number(iso.slice(5, 7)) - 1];
export const monthName = (ym) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
export const shortDate = (iso) => `${weekday(iso)} ${dom(iso)} ${monthShort(iso)}`;
export const dateRange = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };
export const nights = (a, b) => Math.round((at(b) - at(a)) / 864e5);
export const formatRange = (a, b) =>
  a === b ? shortDate(a) : a.slice(0, 7) === b.slice(0, 7) ? `${weekday(a)} ${dom(a)} – ${shortDate(b)}` : `${shortDate(a)} – ${shortDate(b)}`;
export const addMonths = (ym, n) => { const d = at(ym + "-01"); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };
export function monthGrid(ym) {
  const first = ym + "-01";
  const cells = Array(dow(first)).fill(null);
  for (let d = first; d.slice(0, 7) === ym; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

let dialog;
export function openSheet(html, cls = "") {
  closeSheet();
  dialog = document.createElement("dialog");
  dialog.className = `sheet ${cls}`;
  dialog.innerHTML = html;
  document.body.appendChild(dialog);
  dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target.closest("[data-close]")) closeSheet(); });
  dialog.addEventListener("close", () => { dialog?.remove(); dialog = null; });
  dialog.showModal();
  return dialog;
}
export function closeSheet() { if (dialog) { const d = dialog; dialog = null; d.close(); d.remove(); } }
export const sheetHead = (title) =>
  `<div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="iconbtn" data-close aria-label="Close">${ico("cross")}</button></div>`;

let toastTimer;
export function toast(text) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("p");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2400);
}

export const isNarrow = () => matchMedia("(max-width: 700px)").matches;
