import { variants } from "/_house/switcher.js";
import { buildCards, flight, runScene, playing, ORDER, DONE } from "./cards.js";

const stage = document.getElementById("stage");
let stop = null;

// Every take: the live hero's five cards, each drawn small enough that all five show at once, none over another.
// The cards stay where they are; the scene plays inside them, and the card playing lifts a little.
function lay(kind, route) {
  const cards = buildCards();
  const scene = document.createElement("div");
  scene.className = `dk-scene dk-mini dk-${kind}`;
  const slots = {};
  const at = (name) => {
    const s = slots[name];
    return { l: s.offsetLeft, r: s.offsetLeft + s.offsetWidth, t: s.offsetTop, b: s.offsetTop + s.offsetHeight };
  };
  const plane = flight((w, h) => route(w, h, at));
  scene.appendChild(plane.el);
  ORDER.forEach((name, i) => {
    const s = document.createElement("div");
    s.className = `mk-slot mk-${name}`;
    s.style.setProperty("--n", i);
    s.appendChild(cards[name].el);
    slots[name] = s;
    scene.appendChild(s);
  });
  stage.replaceChildren(scene);
  stop = runScene(scene, (step) => {
    Object.values(cards).forEach((c) => c.apply(step));
    const now = step >= DONE ? null : playing(step);
    scene.classList.toggle("in", step >= 1);
    Object.entries(slots).forEach(([name, s]) => s.classList.toggle("now", name === now));
  }, (t) => plane.at(t));
}

const mid = (a, b) => (a + b) / 2;

const ARC = (w, h, at) => `M -14 ${mid(at("ticket").t, at("ticket").b)} C ${w * 0.12} -60, ${w * 0.55} -20, ${w + 14} 2`;

const LAYOUTS = {
  /* O2 — O with the plane on one soft arc behind the cards, as on the web. */
  O2: () => lay("mid dk-arc", ARC),
};

function show(key) {
  stop?.();
  document.body.dataset.v = key;
  LAYOUTS[key]();
}

variants([
  { key: "O2", round: 5, name: "O with the plane on one soft arc behind the cards" },
], show);

document.getElementById("replay").addEventListener("click", () => show(document.body.dataset.v || "O2"));
