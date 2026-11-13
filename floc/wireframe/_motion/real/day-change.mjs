// Motion 1, chosen B2: going to the day before or after on the live Days page. The columns trade places, slow and even.
import { mount, run, play, done, say } from "./shared.mjs";
import { TRIP_DAYS, daysPage, slot, placeWash, sideWidth } from "./days.mjs";

const LIST = [
  { key: "B2", name: "Columns trade places, slower and even", spec: "The day you go to widens into the middle as the old day narrows to the side; the far side slides away. 0.45s on an even ease. A jump of more than one day changes plainly; the build moves the strip's wash in place." },
];

// Why: an even ease starts as gently as it ends, which is what read as calm.
const CALM = "cubic-bezier(0.45, 0, 0.25, 1)";
const page = mount({ tab: "days", title: "Days: going to the day before or after" });
let focus = 1;
let busy = false;

function draw() {
  page.innerHTML = daysPage(focus);
  page.className = "page real";
  const wash = page.querySelector(".day-wash");
  wash.style.transition = "none";
  placeWash(page, focus);
  requestAnimationFrame(() => { wash.style.transition = ""; });
  page.querySelectorAll("[data-step]").forEach((b) => {
    b.disabled = TRIP_DAYS[focus + Number(b.dataset.step)] === undefined;
    b.addEventListener("click", () => go(focus + Number(b.dataset.step)));
  });
  page.querySelectorAll("[data-go-to]").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.goTo))));
}

async function go(to) {
  if (busy || to === focus || TRIP_DAYS[to] === undefined) return;
  busy = true;
  const dir = Math.sign(to - focus);
  const from = focus;
  const track = page.querySelector(".d-track");
  const wrap = page.querySelector(".d-track-wrap");
  focus = to;
  placeWash(page, focus);
  page.querySelectorAll(".day-cell").forEach((c, i) => { c.classList.toggle("on", i === focus); c.toggleAttribute("aria-current", i === focus); });
  page.querySelectorAll("[data-step]").forEach((b) => { b.disabled = TRIP_DAYS[focus + Number(b.dataset.step)] === undefined; });
  say(`Now on ${TRIP_DAYS[focus].long}.`);

  const trio = (f) => [f - 1, f, f + 1].map((i) => slot(i, f)).join("");

  if (Math.abs(to - from) === 1) {
    // Four slots for the length of the move: the one leaving, the two trading places, the one arriving.
    const ids = dir > 0 ? [from - 1, from, from + 1, from + 2] : [from - 2, from - 1, from, from + 1];
    track.innerHTML = ids.map((i) => slot(i, focus)).join("");
    const side = sideWidth();
    const mid = wrap.getBoundingClientRect().width - side * 2;
    const before = dir > 0 ? [side, mid, side, 0] : [0, side, mid, side];
    const after = dir > 0 ? [0, side, mid, side] : [side, mid, side, 0];
    const slots = [...track.children];
    slots.forEach((s) => { s.style.flex = "none"; });
    await Promise.all(slots.map((s, i) => done(play(s, [{ width: `${before[i]}px` }, { width: `${after[i]}px` }], 450, { easing: CALM }))));
    track.innerHTML = trio(focus);
  } else {
    track.innerHTML = trio(focus);
  }
  track.getAnimations().forEach((a) => a.cancel());
  track.querySelectorAll("[data-go-to]").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.goTo))));
  busy = false;
}

run(LIST, () => { focus = 1; draw(); });
addEventListener("resize", () => placeWash(page, focus));
// Why: the narrow layout swaps the side slots to slivers, so a resize across the line redraws.
matchMedia("(max-width: 700px)").addEventListener("change", draw);
