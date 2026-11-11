import { variants, ico } from "/_house/switcher.js";
import { TRIPS, placeWords } from "./data.js";
import { PANELS } from "./panels.js";
import { createMap } from "./map.js";

const stage = document.getElementById("stage");
const params = new URLSearchParams(location.search);
let tripKey = TRIPS.some((t) => t.key === params.get("trip")) ? params.get("trip") : "japan";
let current = "A2";
let map = null;

const REPLAY = `<svg class="ico" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.6 7a4.4 4.4 0 1 0 1.3-3.1M2.4 1.8v2.6H5"/></svg>`;

const picker = () => `
  <div class="mock-pick" role="group" aria-label="Mock-up only: pick a trip">
    <span>Mock-up only</span>
    ${TRIPS.map((t) => `<button type="button" data-trip="${t.key}" aria-pressed="${t.key === tripKey}">${t.title}</button>`).join("")}
  </div>`;

function render(key) {
  current = key;
  map?.destroy();
  const trip = TRIPS.find((t) => t.key === tripKey);
  const P = PANELS[key];
  const word = placeWords(trip.countries);
  stage.innerHTML = `
    <section class="band">
      <h2 class="band-title">Borrow a trip to <span class="word t-${trip.tone}" title="${trip.countries.join(", ")}">${word}</span></h2>
      <p class="lede">A finished route to start from. Change anything.</p>
      ${picker()}
      ${P.head ? P.head(trip) : ""}
      <div class="deep deep-${key.toLowerCase()} is-${P.layout}">
        <div class="map-box">
          <canvas aria-label="Route map: ${trip.stops.map((s) => s.name).join(", then ")}" role="img"></canvas>
          <button type="button" class="map-btn map-back">${ico("back")}Back to the globe</button>
          <button type="button" class="map-btn map-replay" aria-label="Replay the route" title="Replay the route">${REPLAY}</button>
        </div>
        ${P.build(trip)}
      </div>
    </section>`;
  const deep = stage.querySelector(".deep");
  const box = deep.querySelector(".map-box");
  let now = 0;
  const side = () => P.layout === "side" && innerWidth > 900;
  const show = (i) => {
    now = i;
    P.update(deep, trip, i);
  };
  map = createMap({
    box,
    canvas: box.querySelector("canvas"),
    trip,
    inset: () => ({ l: 0, t: 40, r: side() ? 352 : 0, b: 0 }),
    onStep: show,
    onPick: (i) => {
      map.focus(i);
      show(i);
    },
  });
  show(0);
  deep.addEventListener("click", (e) => {
    const stop = e.target.closest("[data-stop]");
    const go = e.target.closest("[data-go]");
    if (stop) {
      const i = Number(stop.dataset.stop);
      map.focus(i);
      show(i);
    } else if (go) {
      const i = Math.max(0, Math.min(trip.stops.length - 1, now + Number(go.dataset.go)));
      map.focus(i);
      show(i);
    } else if (e.target.closest(".map-replay")) map.play();
  });
  stage.querySelectorAll("[data-trip]").forEach((b) =>
    b.addEventListener("click", () => {
      tripKey = b.dataset.trip;
      const url = new URL(location.href);
      url.searchParams.set("trip", tripKey);
      history.replaceState(null, "", url);
      render(current);
    }),
  );
}

variants(
  [{ key: "A2", round: 2, tag: "Chosen", name: "Quiet rail: one plain line joins the stops, the map says how you travel" }],
  render,
);

let lastW = innerWidth;
let rt;
addEventListener("resize", () => {
  if (innerWidth === lastW) return;
  lastW = innerWidth;
  clearTimeout(rt);
  rt = setTimeout(() => render(current), 200);
});
