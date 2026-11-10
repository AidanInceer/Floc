import { variants } from "/_house/switcher.js";
import { renderHorizon } from "/landing-hero-flock/globes.js";
import { renderFan } from "./fan.js";

// The stops of each Explore listing, from @floc/core preset trips.
const STOPS = {
  Japan: ["Tokyo", "Hakone", "Kyoto", "Osaka"],
  Spain: ["Seville", "Córdoba", "Granada"],
  Iceland: ["Reykjavík", "Vík", "Höfn", "Mývatn", "Snæfellsnes"],
  Morocco: ["Marrakech", "Imlil", "Dades gorge", "Erg Chebbi camp"],
  Vietnam: ["Hanoi", "Lan Ha bay", "Hội An", "Ho Chi Minh City", "Mekong delta"],
  "New Zealand": ["Christchurch", "Franz Josef", "Wanaka", "Queenstown", "Te Anau", "Aoraki / Mount Cook"],
};
const HEAD = `<section class="c-hero bw-head">
  <h2>Borrow a trip to <span class="bw-word" id="bw" aria-live="polite"></span></h2>
  <p class="lede">A finished route to start from. Change anything.</p>
</section>`;
const EVERY = `<a class="pill-btn ghost big" href="#">See every trip</a>`;
const onShow = (t, root) => {
  const word = root.querySelector("#bw");
  if (word.dataset.at === t.country) return;
  word.dataset.at = t.country;
  word.className = `bw-word c-${t.tone}`;
  word.innerHTML = `<span class="roll">${t.country}</span>`;
};

const RENDER = {
  A: (stage) => renderHorizon(stage, { head: HEAD, onShow, extra: (t) => `<span class="bw-stops">${STOPS[t.country].map((n) => `<span>${n}</span>`).join(" · ")}</span>`, after: `<div class="bw-more">${EVERY}</div>` }),
  C: renderFan,
};
const stage = document.getElementById("stage");
let live = null;
let current = "C";

function show(key) {
  live?.stop();
  current = key;
  live = RENDER[key](stage);
}

variants([
  { key: "C", round: 2, tag: "Experiment", name: "The fan: the band the homepage had before the globe, kept as the control" },
  { key: "A", round: 1, tag: "Experiment", name: "The horizon: the globe rises under the title; each trip turns onto the top and the plane flies in" },
], show);

document.getElementById("replay").addEventListener("click", () => show(current));

let lastW = innerWidth;
let rt;
addEventListener("resize", () => {
  if (innerWidth === lastW) return;
  lastW = innerWidth;
  clearTimeout(rt);
  rt = setTimeout(() => show(current), 200);
});
