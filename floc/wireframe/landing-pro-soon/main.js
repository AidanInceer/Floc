const PATHS = {
  money: '<circle cx="7" cy="7" r="5.2"/><path d="M8.6 5.2c-.4-.6-1-.9-1.7-.9-1 0-1.7.5-1.7 1.3 0 1.9 3.6.9 3.6 2.9 0 .8-.8 1.4-1.9 1.4-.8 0-1.5-.3-1.9-1M7 3.4v7.2"/>',
  weather: '<path d="M7 4.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z"/><path d="M7 1.4v1.4M7 11.2v1.4M1.4 7h1.4M11.2 7h1.4"/><path d="M3 3l1 1M10 10l1 1M11 3l-1 1M4 10l-1 1"/>',
  mail: '<rect x="1.8" y="3" width="10.4" height="8" rx="1.4"/><path d="m2.2 4 4.8 3.6L11.8 4"/>',
  packing: '<path d="M3.8 4.4h6.4a1.4 1.4 0 0 1 1.4 1.4V10a1.4 1.4 0 0 1-1.4 1.4H3.8A1.4 1.4 0 0 1 2.4 10V5.8a1.4 1.4 0 0 1 1.4-1.4ZM5.2 4.4V3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.4M5 4.4v7M9 4.4v7"/>',
  files: '<path d="M1.8 4v7a1 1 0 0 0 1 1h8.4a1 1 0 0 0 1-1V5.6a1 1 0 0 0-1-1H6.6L5.4 3H2.8a1 1 0 0 0-1 1ZM1.8 6.6h10.4"/>',
  flight: '<path d="M11.03 2.97C11.42 3.36 11.35 3.99 10.85 4.49L8.66 6.68L9.93 11.49L9.09 12.34L6.96 8.38L5.27 10.08L5.48 11.7L4.84 12.34L3.68 10.32L1.66 9.16L2.3 8.52L3.92 8.73L5.62 7.04L1.66 4.91L2.51 4.07L7.32 5.34L9.51 3.15C10.01 2.65 10.64 2.58 11.03 2.97Z"/>',
  live: '<circle cx="7" cy="7" r="1.6"/><path d="M4.2 4.2a4 4 0 0 0 0 5.6M9.8 4.2a4 4 0 0 1 0 5.6M2.6 2.6a6.2 6.2 0 0 0 0 8.8M11.4 2.6a6.2 6.2 0 0 1 0 8.8"/>',
  ask: '<path d="M2.2 3.4a1.2 1.2 0 0 1 1.2-1.2h7.2a1.2 1.2 0 0 1 1.2 1.2v4.8a1.2 1.2 0 0 1-1.2 1.2H6l-2.6 2.2V9.4a1.2 1.2 0 0 1-1.2-1.2Z"/>',
  local: '<circle cx="7" cy="7" r="5.2"/><path d="M9.2 4.8 8 8 4.8 9.2 6 6Z"/>',
  camera: '<path d="M3.1 4h7.8a1.3 1.3 0 0 1 1.3 1.3v5a1.3 1.3 0 0 1-1.3 1.3H3.1a1.3 1.3 0 0 1-1.3-1.3v-5A1.3 1.3 0 0 1 3.1 4Z"/><path d="m5 4 .8-1.6h2.4L9 4"/><circle cx="7" cy="7.8" r="2"/>',
  offline: '<path d="M5 5.2a3.4 3.4 0 0 1 5.6 1.5 2.3 2.3 0 0 1-.2 4.5"/><path d="M3.3 7.4a2 2 0 0 0 .9 3.8h4.2M2 2l10 10"/>',
};

const NOW = [
  { icon: "money", tone: "red", name: "Estimate your cost", line: "See what the trip costs you and whether it fits your budget." },
  { icon: "weather", tone: "yellow", name: "See the forecast", line: "Each stop's forecast, up to 9 days ahead." },
  { icon: "packing", tone: "blue", name: "Get a packing list", line: "Floc writes your list from where you go and the weather there." },
  { icon: "mail", tone: "green", name: "Bookings read for you", line: "Forward a booking. Floc finds the trip and fills in the details for you to save." },
  { icon: "files", tone: "grey", name: "More room for your files", line: "Your own space for tickets and photos on each trip." },
];

const SOON = [
  { icon: "camera", name: "Scan a receipt", line: "Take a photo and the cost goes into Money." },
  { icon: "flight", name: "Alerts for your flights", line: "Hear when your flight is late, cancelled or changes gate." },
  { icon: "ask", name: "Plan with a travel partner", line: "It suggests days, compares options and adds them to the trip." },
  { icon: "live", name: "Follow the trip live", line: "Share where you are with the group while the trip runs." },
  { icon: "packing", name: "A packing list that learns", line: "It starts from what you packed on your last trips." },
  { icon: "offline", name: "Use it offline", line: "Open your trip on the plane." },
  { icon: "local", name: "Find places nearby", line: "Picks near each night's stay, for the group and the weather." },
];

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const svg = (k) => `<svg viewBox="0 0 14 14" aria-hidden="true">${PATHS[k]}</svg>`;
const row = (item, tile) =>
  `<li class="row"><span class="tile ${tile}">${svg(item.icon)}</span><p><b>${esc(item.name)}</b><span class="eg">${esc(item.line)}</span></p></li>`;

document.getElementById("now").innerHTML = NOW.map((i) => row(i, `tone-${i.tone}`)).join("");
document.getElementById("soon").innerHTML = `<ul class="v-a">${SOON.map((i) => row(i, "tile-soon")).join("")}</ul>`;