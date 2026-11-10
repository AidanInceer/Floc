// H2 — Everyone's way there. Three going from London, two from Barcelona, one line from each city to Sicily on the paper globe. Your seat in Manchester waits; Join draws your line.
import { calmHeadline, lede, ctas, clock, reduce, narrow, onView, face, people, you, ico, STOPS } from "./common.js";
import { painter, loadWorld, arc, flight, frames, span } from "./paper.js";

const P = people;
const TO = { lat: STOPS[0].lat, lng: STOPS[0].lng };
const FROM = [
  { who: [P.Priya, P.Sam, P.Jo], city: "London", lat: 51.507, lng: -0.128 },
  { who: [P.Alex, P.Maya], city: "Barcelona", lat: 41.385, lng: 2.173, left: true },
];
const ME = { who: [you], city: "Manchester", lat: 53.48, lng: -2.242, left: true };
const GAP = 900;
const FLY = 2200;

export function renderConverge(stage) {
  const t = clock();
  const h = calmHeadline("hn-centre");
  stage.innerHTML = `<section class="hn r2 hh p2"><div class="hh-head"></div>${lede()}${ctas()}
    <div class="p2-wrap"><div class="p2-scene">
      <canvas class="p2-globe" aria-hidden="true"></canvas>
      <div class="p2-flags">${[...FROM, ME].map((f, i) => `<span class="p2-flag${f.left ? " left" : ""}${f === ME ? " me" : ""}" style="--i:${i}">
          <span class="avatar-row">${f === ME ? '<span class="r3-empty"></span>' : f.who.map((p) => face(p, 26)).join("")}</span>
          <em><b>${f.city}</b><small>${f === ME ? "You" : f.who.map((p) => p.name).join(", ")}</small></em></span>`).join("")}
        <span class="p2-dest"><b>Sicily</b><span class="nums">12–19 June</span></span></div>
    </div>
      <aside class="p2-card">
        <p class="hh-from">${face(P.Priya, 22)}<span>Priya invited you</span></p>
        <b class="p2-title">Sicily</b>
        <p class="hh-when nums">Fri 12 – Fri 19 June, 7 nights</p>
        <ol class="p2-stops">${STOPS.map((s) => `<li class="tone-${s.tone}"><i></i>${s.name}<span class="nums">${s.nights}</span></li>`).join("")}</ol>
        <ul class="hh-done">${["Dates that suit all six", "A villa in Taormina"].map((d, i) => `<li style="--i:${i}">${ico("check")}<span>${d}</span></li>`).join("")}</ul>
        <button type="button" class="pill-btn ghost r3-join">Join from Manchester</button>
        <p class="hh-in">${ico("check")}You&rsquo;re in</p>
      </aside></div></section>`;
  stage.querySelector(".hh-head").append(h.el);
  const root = stage.querySelector(".p2");
  const scene = root.querySelector(".p2-scene");
  const canvas = scene.querySelector("canvas");
  const flags = [...scene.querySelectorAll(".p2-flag")];
  const dest = scene.querySelector(".p2-dest");
  const v = narrow();

  // The sphere sits low, so its top edge curves across the band and Europe lands on the dome; Sicily sits near the foot.
  const g = painter(canvas, (w, hh) => {
    const R = Math.max(w * (v ? 2.4 : 1.05), 560);
    return { R, cx: w / 2, cy: R + (v ? 18 : 26) };
  });
  const paths = [...FROM, ME].map((f) => arc(f, TO, 90));
  let joinedAt = null;
  let started = null;
  h.set(0, true);

  function place() {
    const [w, hh] = [canvas.clientWidth, canvas.clientHeight];
    const f = { R: Math.max(w * (v ? 2.4 : 1.05), 560) };
    f.cy = f.R + (v ? 18 : 26);
    // Sicily at 82% of the band's height, centred a little right of the middle on a wide screen.
    const dy = (f.cy - hh * (v ? 0.68 : 0.8)) / f.R;
    g.view = { lat: TO.lat - Math.asin(Math.min(0.99, dy)) * 180 / Math.PI, lng: v ? 6 : 3 };
  }

  function draw(now) {
    g.base();
    const t0 = started ?? Infinity;
    FROM.forEach((f, i) => flight(g, paths[i], span(now, t0 + i * GAP, FLY)));
    if (joinedAt !== null) flight(g, paths[FROM.length], span(now, joinedAt, FLY));
    g.pin(TO, 4.5, true);
    [...FROM, ME].forEach((f, i) => {
      const [x, y, z] = g.project(f);
      flags[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      flags[i].hidden = z < 0.05;
    });
    const [x, y] = g.project(TO);
    dest.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  let stopFrames = () => {};
  const animate = (until) => { stopFrames(); stopFrames = frames((now) => { draw(now); return now < until; }); };

  loadWorld().then(() => { place(); draw(0); });
  root.querySelector(".r3-join").addEventListener("click", () => {
    root.querySelector(".r3-empty").outerHTML = face(you, 26);
    root.classList.add("joined");
    joinedAt = performance.now();
    animate(joinedAt + FLY + 100);
  });

  const run = () => loadWorld().then(() => {
    place();
    started = performance.now() + 300;
    root.classList.add("seated");
    h.set(1);
    const end = 300 + (FROM.length - 1) * GAP + FLY;
    animate(started + end);
    t.at(1600, () => h.set(2));
    t.at(end - 300, () => { root.classList.add("landed"); h.set(3); });
    t.at(end + 600, () => root.classList.add("waiting"));
  });
  const off = onView(scene, run, 0.25);
  return { stop() { t.stop(); h.stop(); off(); stopFrames(); } };
}
