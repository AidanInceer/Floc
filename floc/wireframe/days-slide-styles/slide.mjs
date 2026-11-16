import { mount, run, play, done, say, RM } from "/_motion/real/shared.mjs";
import { TRIP_DAYS, daysPage, slot, placeWash, sideWidth } from "/_motion/real/days.mjs";

const EASES = {
  even: ["Even", "cubic-bezier(0.45, 0, 0.25, 1)"],
  out: ["Ease out", "cubic-bezier(0.2, 0.85, 0.3, 1)"],
  inout: ["Ease in-out", "cubic-bezier(0.65, 0, 0.35, 1)"],
  linear: ["Linear", "linear"],
};

const LIST = [
  { key: "Now", ms: 650, ease: "even", name: "Columns trade", spec: "The day you go to widens into the middle as the old one narrows to the side. A jump of more than one day trades the same way: the old day and its neighbours close up as the new day and its neighbours open, in one move." },
];

const page = mount({
  tab: "days",
  title: "Days: going to another day",
  extra: `<span class="tune">
    <label>Duration <input type="range" id="dur" min="80" max="1600" step="10"></label><output id="dur-out" class="nums"></output>
    <label>Ease <select id="ease">${Object.entries(EASES).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join("")}</select></label>
    <button type="button" id="tune-reset">Reset</button>
  </span>`,
});
const durEl = document.getElementById("dur");
const easeEl = document.getElementById("ease");
const base = LIST[0];
const tune = { ms: base.ms, ease: base.ease };
let focus = 1;
let busy = false;

function showTune() {
  durEl.value = tune.ms;
  easeEl.value = tune.ease;
  document.getElementById("dur-out").textContent = `${tune.ms}ms`;
}
durEl.addEventListener("input", () => { tune.ms = Number(durEl.value); showTune(); });
easeEl.addEventListener("change", () => { tune.ease = easeEl.value; showTune(); });
document.getElementById("tune-reset").addEventListener("click", () => { tune.ms = base.ms; tune.ease = base.ease; showTune(); });

const trio = (f) => [f - 1, f, f + 1].map((i) => slot(i, f)).join("");

function wire(root) {
  root.querySelectorAll("[data-go-to]").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.goTo))));
}

function draw() {
  page.innerHTML = daysPage(focus);
  page.className = "page real";
  const wash = page.querySelector(".day-wash");
  wash.style.transition = "none";
  placeWash(page, focus);
  requestAnimationFrame(() => { wash.style.transition = ""; });
  page.querySelectorAll("[data-step]").forEach((b) => {
    b.addEventListener("click", () => go(focus + Number(b.dataset.step)));
  });
  wire(page);
  markStrip();
}

function markStrip() {
  placeWash(page, focus);
  page.querySelectorAll(".day-cell").forEach((c, i) => { c.classList.toggle("on", i === focus); c.toggleAttribute("aria-current", i === focus); });
  page.querySelectorAll("[data-step]").forEach((b) => { b.disabled = TRIP_DAYS[focus + Number(b.dataset.step)] === undefined; });
}

function tradeSlots(from, to) {
  return [...new Set([from - 1, from, from + 1, to - 1, to, to + 1])].sort((a, b) => a - b);
}

async function trade(track, wrap, from, to) {
  const ids = tradeSlots(from, to);
  track.innerHTML = ids.map((i) => slot(i, to)).join("");
  const side = sideWidth();
  const mid = wrap.getBoundingClientRect().width - side * 2;
  const width = (i, f) => (i === f ? mid : Math.abs(i - f) === 1 ? side : 0);
  const slots = [...track.children];
  slots.forEach((s) => { s.style.flex = "none"; });
  await Promise.all(slots.map((s, n) => done(play(s,
    [{ width: `${width(ids[n], from)}px` }, { width: `${width(ids[n], to)}px` }],
    tune.ms, { easing: EASES[tune.ease][1] }))));
}

async function go(to) {
  if (busy || to === focus || TRIP_DAYS[to] === undefined) return;
  busy = true;
  const from = focus;
  const wrap = page.querySelector(".d-track-wrap");
  const track = wrap.querySelector(".d-track");
  focus = to;
  markStrip();
  say(`Now on ${TRIP_DAYS[focus].long}.`);
  if (!RM) await trade(track, wrap, from, to);
  track.innerHTML = trio(focus);
  track.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  wire(track);
  busy = false;
}

addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select")) return;
  if (e.key === "ArrowLeft") go(focus - 1);
  if (e.key === "ArrowRight") go(focus + 1);
});

run(LIST, () => { focus = 1; busy = false; showTune(); draw(); });
addEventListener("resize", () => placeWash(page, focus));
matchMedia("(max-width: 700px)").addEventListener("change", draw);
