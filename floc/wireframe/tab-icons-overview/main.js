import { variants } from "/_house/switcher.js";

// The live tab glyphs, copied from components/system/icons/nav.tsx and the CogIcon.
const LIVE = {
  overview: '<path d="M3.6 2h6.8A1.6 1.6 0 0 1 12 3.6v6.8a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 10.4V3.6A1.6 1.6 0 0 1 3.6 2ZM7 2v10M7 7h5"/>',
  dates: '<path d="M3.4 3h7.2A1.4 1.4 0 0 1 12 4.4v6.4a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 10.8V4.4A1.4 1.4 0 0 1 3.4 3ZM4.8 1.8v2.4M9.2 1.8v2.4M2 6h10"/>',
  days: '<circle cx="2.8" cy="3.6" r=".9"/><circle cx="2.8" cy="7" r=".9"/><circle cx="2.8" cy="10.4" r=".9"/><path d="M6 3.6h6M6 7h6M6 10.4h4"/>',
  money: '<path d="M3 1.8h8v10.4l-1.3-.9-1.4.9-1.3-.9-1.3.9-1.4-.9-1.3.9ZM5 4.6h4M5 6.6h4"/>',
  packing: '<path d="M3.8 4.4h6.4a1.4 1.4 0 0 1 1.4 1.4V10a1.4 1.4 0 0 1-1.4 1.4H3.8A1.4 1.4 0 0 1 2.4 10V5.8a1.4 1.4 0 0 1 1.4-1.4ZM5.2 4.4V3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.4M5 4.4v7M9 4.4v7"/>',
  notes: '<path d="M3 2h5.6L11 4.4V12H3ZM5 7h4M5 9.4h4"/>',
  files: '<path d="M1.8 4v7a1 1 0 0 0 1 1h8.4a1 1 0 0 0 1-1V5.6a1 1 0 0 0-1-1H6.6L5.4 3H2.8a1 1 0 0 0-1 1ZM1.8 6.6h10.4"/>',
  settings: '<circle cx="7" cy="7" r="1.9"/><path d="M6.1 1.6h1.8l.3 1.5 1.1.6 1.4-.5.9 1.6-1.1 1v1.4l1.1 1-.9 1.6-1.4-.5-1.1.6-.3 1.5H6.1l-.3-1.5-1.1-.6-1.4.5-.9-1.6 1.1-1V6.3l-1.1-1 .9-1.6 1.4.5 1.1-.6Z"/>',
};

const OVERVIEW = {
  D: { round: 3, name: "Home", why: "the trip's front page", d: '<path d="M2.4 6.4 7 2.4l4.6 4V12H8.4V9H5.6v3H2.4Z"/>' },
};

const SETTINGS = {
  S7: { round: 3, name: "Today's gear, centred", why: "the same gear, its teeth even all round, so it sits in the middle of its tile", d: '<circle cx="7" cy="7" r="1.9"/><path d="M5.67 3.12L6.06 1.68L7.94 1.68L8.33 3.12L9.69 3.91L11.14 3.53L12.07 5.15L11.02 6.22L11.02 7.78L12.07 8.85L11.14 10.47L9.69 10.09L8.33 10.88L7.94 12.32L6.06 12.32L5.67 10.88L4.31 10.09L2.86 10.47L1.93 8.85L2.98 7.78L2.98 6.22L1.93 5.15L2.86 3.53L4.31 3.91Z"/>' },
};

const TABS = [
  ["overview", "Overview", "blue"], ["dates", "Dates", "yellow"], ["days", "Days", "green"], ["money", "Money", "red"],
  ["packing", "Packing", "blue"], ["notes", "Notes", "yellow"], ["files", "Files", "green"],
];

const svg = (d, cls = "g") => `<svg class="${cls}" viewBox="0 0 14 14" aria-hidden="true">${d}</svg>`;
const stage = document.getElementById("stage");
const pick = { overview: null, settings: null };
let open = "overview";

function bar() {
  const glyph = (key) => (key === "overview" && pick.overview ? OVERVIEW[pick.overview].d : LIVE[key]);
  const cog = pick.settings ? SETTINGS[pick.settings].d : LIVE.settings;
  return `<nav class="tabs" aria-label="Trip sections">${TABS.map(([k, label, tone]) =>
    `<button type="button" class="tab" data-tab="${k}" style="--wash:var(--pastel-${tone});--ink-s:var(--pastel-${tone}-ink)" ${open === k ? 'aria-current="page"' : ""}>
      <span class="tile">${svg(glyph(k))}</span><span class="lbl">${label}</span></button>`).join("")}
    <button type="button" class="cog ${open === "settings" ? "on" : ""}" data-tab="settings" aria-label="Trip settings">${svg(cog)}</button></nav>`;
}

function board(title, set, live, chosen, kind) {
  return `<section class="board"><h2 class="typed">${title}</h2><ul class="opts">
    <li class="opt live"><span class="big">${svg(live, "g big-g")}</span><span class="small">${svg(live)}</span><b>Today</b><span>${kind === "overview" ? "Split square" : "Gear"}</span></li>
    ${Object.entries(set).map(([k, o]) => `<li class="opt ${chosen === k ? "on" : ""}"><button type="button" data-pick="${k}"><span class="big">${svg(o.d, "g big-g")}</span><span class="small">${svg(o.d)}</span><b>${k} ${o.name}</b><span>${o.why[0].toUpperCase() + o.why.slice(1)}</span></button></li>`).join("")}
  </ul></section>`;
}

function render() {
  stage.innerHTML = `
    <header class="top">
      <span class="trip">Portugal, late summer</span>
      ${bar()}
    </header>
    <div class="page">
      <div class="ghost">${open === "settings" ? "Trip settings menu — unchanged" : `${TABS.find((t) => t[0] === open)[1]} — unchanged`}</div>
      ${board("Overview", OVERVIEW, LIVE.overview, pick.overview, "overview")}
      ${board("Settings", SETTINGS, LIVE.settings, pick.settings, "settings")}
    </div>`;
  stage.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { open = b.dataset.tab; render(); }));
  stage.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.pick;
    if (k in OVERVIEW) { pick.overview = k; open = "overview"; } else { pick.settings = k; open = "settings"; }
    render();
  }));
}

function show(key) {
  if (key in OVERVIEW) { pick.overview = key; open = "overview"; } else { pick.settings = key; open = "settings"; }
  render();
}

variants([
  ...Object.entries(OVERVIEW).map(([key, o]) => ({ key, round: o.round ?? 1, name: `Overview: ${o.name} — ${o.why}` })),
  ...Object.entries(SETTINGS).map(([key, o]) => ({ key, round: o.round ?? 1, name: `Settings: ${o.name} — ${o.why}` })),
], show);
