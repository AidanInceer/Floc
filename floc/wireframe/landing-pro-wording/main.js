import { variants } from "/_house/switcher.js";

const PATHS = {
  receipt: '<path d="M3 1.8h8v10.4l-1.3-.9-1.4.9-1.3-.9-1.3.9-1.4-.9-1.3.9ZM5 4.6h4M5 6.6h4"/>',
  weather: '<path d="M7 4.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z"/><path d="M7 1.4v1.4M7 11.2v1.4M1.4 7h1.4M11.2 7h1.4"/><path d="M3 3l1 1M10 10l1 1M11 3l-1 1M4 10l-1 1"/>',
  flight: '<path d="M11.03 2.97C11.42 3.36 11.35 3.99 10.85 4.49L8.66 6.68L9.93 11.49L9.09 12.34L6.96 8.38L5.27 10.08L5.48 11.7L4.84 12.34L3.68 10.32L1.66 9.16L2.3 8.52L3.92 8.73L5.62 7.04L1.66 4.91L2.51 4.07L7.32 5.34L9.51 3.15C10.01 2.65 10.64 2.58 11.03 2.97Z"/>',
  packing: '<path d="M3.8 4.4h6.4a1.4 1.4 0 0 1 1.4 1.4V10a1.4 1.4 0 0 1-1.4 1.4H3.8A1.4 1.4 0 0 1 2.4 10V5.8a1.4 1.4 0 0 1 1.4-1.4ZM5.2 4.4V3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.4M5 4.4v7M9 4.4v7"/>',
  files: '<path d="M1.8 4v7a1 1 0 0 0 1 1h8.4a1 1 0 0 0 1-1V5.6a1 1 0 0 0-1-1H6.6L5.4 3H2.8a1 1 0 0 0-1 1ZM1.8 6.6h10.4"/>',
  live: '<circle cx="7" cy="7" r="1.6"/><path d="M4.2 4.2a4 4 0 0 0 0 5.6M9.8 4.2a4 4 0 0 1 0 5.6M2.6 2.6a6.2 6.2 0 0 0 0 8.8M11.4 2.6a6.2 6.2 0 0 1 0 8.8"/>',
  ask: '<path d="M2.2 3.4a1.2 1.2 0 0 1 1.2-1.2h7.2a1.2 1.2 0 0 1 1.2 1.2v4.8a1.2 1.2 0 0 1-1.2 1.2H6l-2.6 2.2V9.4a1.2 1.2 0 0 1-1.2-1.2Z"/>',
  local: '<circle cx="7" cy="7" r="5.2"/><path d="M9.2 4.8 8 8 4.8 9.2 6 6Z"/>',
  camera: '<path d="M3.1 4h7.8a1.3 1.3 0 0 1 1.3 1.3v5a1.3 1.3 0 0 1-1.3 1.3H3.1a1.3 1.3 0 0 1-1.3-1.3v-5A1.3 1.3 0 0 1 3.1 4Z"/><path d="m5 4 .8-1.6h2.4L9 4"/><circle cx="7" cy="7.8" r="2"/>',
  tag: '<path d="M7.6 1.8h4.6v4.6L6.6 12 2 7.4Z"/><circle cx="9.8" cy="4.2" r=".9"/>',
  offline: '<path d="M5 5.2a3.4 3.4 0 0 1 5.6 1.5 2.3 2.3 0 0 1-.2 4.5"/><path d="M3.3 7.4a2 2 0 0 0 .9 3.8h4.2M2 2l10 10"/>',
};
const NOW_ICONS = [["receipt", "red"], ["weather", "yellow"], ["flight", "green"], ["packing", "blue"], ["files", "grey"]];
const SOON_ICONS = ["live", "ask", "local", "offline", "camera"];

const COPY = {
  C: {
    lede: "Everyone on the trip uses Floc free. Pro adds five tools that only you see.",
    now: [
      ["Estimate your cost", "See what the trip costs you and whether it fits your budget."],
      ["See the forecast", "Weather for every day you are away."],
      ["Search with details filled in", "Flight and hotel sites open with your dates, places and number of people."],
      ["Get a packing list", "Floc writes your list from where you go and the weather there."],
      ["Store your own files", "Increased file and photo storage limits."],
    ],
    soon: [
      ["Follow the trip live", "Share where you are with the group while the trip runs."],
      ["Plan with a travel partner", "It suggests days, compares options and adds them to the trip."],
      ["Find places nearby", "Picks near each night's stay, for the group and the weather."],
      ["Use it offline", "Open your trip on the plane."],
      ["Scan a receipt", "Take a photo and the cost goes into Money."],
    ],
  },
};

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const svg = (k) => `<svg viewBox="0 0 14 14" aria-hidden="true">${PATHS[k]}</svg>`;
const row = ([name, line], tile, icon) =>
  `<li class="row"><span class="tile ${tile}">${svg(icon)}</span><p><b>${esc(name)}</b><span class="eg">${esc(line)}</span></p></li>`;

function render(key) {
  const c = COPY[key] ?? COPY.C;
  document.getElementById("lede").textContent = c.lede;
  document.getElementById("now").innerHTML = c.now.map((item, i) => row(item, `tone-${NOW_ICONS[i][1]}`, NOW_ICONS[i][0])).join("");
  document.getElementById("soon").innerHTML = c.soon.map((item, i) => row(item, "tile-soon", SOON_ICONS[i])).join("");
}

variants(
  [
    { key: "C", name: "Verb first, says what you do" },
  ],
  render,
);
