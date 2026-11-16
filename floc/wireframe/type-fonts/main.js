import { variants } from "/_house/switcher.js";
import { SHORTLIST, ALL_SETS, loadFonts, vars } from "./sets.js";

const stage = document.getElementById("stage");

import { wordmark, spec, logo, hero, trip, days, money, band, scale } from "./parts.js";
import { renderRank } from "./rank.js";

function single(s) {
  return `
  <div class="tf" style='${vars(s)}'>
    ${spec(s)}
    ${logo()}
    ${hero()}
    <section class="tf-sec">
      <h2 class="tf-sec-head typed">In the app</h2>
      <div class="tf-grid">${trip()}${days()}${money()}${band()}</div>
    </section>
    ${scale()}
  </div>`;
}

function allRow(s) {
  return `
      <button type="button" class="tf-all-row lift" data-pick="${s.key}" style='${vars(s)}'>
        <span class="tf-all-code nums">${s.code || s.key}</span>
        <span class="tf-all-logo">${wordmark("is-lg")}</span>
        <span class="tf-all-body">
          <span class="tf-all-h">Trip planning, sorted.</span>
          <span class="tf-all-p">Keep the destination, dates, route and costs in one place.</span>
          <span class="tf-all-m nums">Thu 3 Sep · £480.00 · ${s.display} ${s.d} / ${s.sans} / ${s.mono}</span>
        </span>
      </button>`;
}

const FAMILIES = ["H", "J", "W"].map((k) => {
  const sets = ALL_SETS.filter((s) => s.key[0] === k).sort((a, b) => a.d - b.d);
  return { name: sets[0].display, sets };
});
const ORDERED = [...FAMILIES.flatMap((f) => f.sets), SHORTLIST[0]];

function all() {
  return `
  <div class="tf-all">
    ${FAMILIES.map((f, i) => `
      <h2 class="tf-sec-head typed${i ? " tf-all-round" : ""}">${f.name}, 700 and 800</h2>
      ${f.sets.map(allRow).join("")}`).join("")}
    <h2 class="tf-sec-head typed tf-all-round">Before W4</h2>
    ${allRow(SHORTLIST[0])}
  </div>`;
}

let picker;
function show(key) {
  stage.onclick = null;
  if (key === "rank") {
    renderRank(stage);
  } else if (key === "all") {
    ALL_SETS.forEach(loadFonts);
    stage.innerHTML = all();
    stage.querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => picker?.show(b.dataset.pick)));
  } else {
    const s = ALL_SETS.find((x) => x.key === key) || SHORTLIST[0];
    loadFonts(s);
    stage.innerHTML = single(s);
  }
  document.body.dataset.v = key;
}

const item = (s) => ({ key: s.key, code: s.code || s.key, name: s.name, round: 4, tag: s.key === "W4" ? "Live" : s.key === "was" ? "Before" : undefined });
const list = [
  { key: "all", code: "All", name: "The shortlist side by side: H, J and W at 700 and 800, and the set before it. Press one to open it.", round: 4 },
  { key: "rank", code: "Rank", name: "Rank number and label fonts against W4's headings and text: drag to order; the mock-up shows the font under your pointer.", round: 4 },
  ...ORDERED.map(item),
];
variants(list, (key) => { show(key); scrollTo(0, 0); });
picker = { show: (key) => {
  const url = new URL(location.href);
  url.searchParams.set("variant", key);
  location.href = url.toString();
} };
