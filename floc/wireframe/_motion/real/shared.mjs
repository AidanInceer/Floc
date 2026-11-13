// Round 2 of the motion mockups: each page draws the live page it lives on, so the motion is judged where it would run. Throwaway; state lives in memory.
import { variants } from "/_house/switcher.js";
import { tripFrame, ico, esc, isNarrow } from "/_house/kit/trip-frame.mjs";

export { ico, esc, isNarrow };
export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const EASE = "cubic-bezier(0.2, 0.85, 0.3, 1)";
export const play = (el, frames, ms, more = {}) =>
  RM || !el ? null : el.animate(frames, { duration: ms, easing: EASE, fill: "both", ...more });
export const done = (anim) => (anim ? anim.finished.catch(() => {}) : Promise.resolve());
export const wait = (ms) => new Promise((r) => setTimeout(r, RM ? 0 : ms));

export const ME = { name: "Aidan", initial: "Ai", tone: 1 };
export const PEOPLE = [
  { name: "Aidan", initial: "Ai", tone: 1 },
  { name: "Priya Shah", initial: "PS", tone: 3 },
  { name: "Sofia Reyes", initial: "SR", tone: 5 },
  { name: "Tom Hale", initial: "TH", tone: 2 },
];

export const SKIN = {
  overview: ["--pastel-blue", "--pastel-blue-ink"],
  dates: ["--pastel-yellow", "--pastel-yellow-ink"],
  days: ["--pastel-green", "--pastel-green-ink"],
  money: ["--pastel-red", "--pastel-red-ink"],
  packing: ["--pastel-blue", "--pastel-blue-ink"],
  notes: ["--pastel-yellow", "--pastel-yellow-ink"],
  files: ["--pastel-green", "--pastel-green-ink"],
};

const MORE = {
  moon: '<path d="M10.8 8.6A4.4 4.4 0 0 1 5.4 3.2a4.4 4.4 0 1 0 5.4 5.4Z"/>',
  upload: '<path d="M7 9.6V2.6M4.2 5.2 7 2.4l2.8 2.8M2.4 9.4v2.2h9.2V9.4"/>',
  invite: '<circle cx="5.4" cy="5" r="2"/><path d="M1.8 11.4c.4-1.9 1.8-3 3.6-3s3.2 1.1 3.6 3M10.6 4.4v3.6M8.8 6.2h3.6"/>',
  pencil: '<path d="M9.4 2.6 11.4 4.6 5 11H3V9Z"/>',
  gear: '<circle cx="7" cy="7" r="1.9"/><path d="M7 1.6v1.6M7 10.8v1.6M1.6 7h1.6M10.8 7h1.6M3.2 3.2l1.1 1.1M9.7 9.7l1.1 1.1M10.8 3.2 9.7 4.3M4.3 9.7l-1.1 1.1"/>',
  mail: '<path d="M1.8 3.4h10.4v7.2H1.8zM1.8 3.8 7 7.8l5.2-4"/>',
  calendar: '<path d="M2.2 3.4h9.6v8.4H2.2zM2.2 6h9.6M4.8 2v2.4M9.2 2v2.4"/>',
};
export const glyph = (name, cls = "") =>
  MORE[name] ? `<svg class="g ${cls}" viewBox="0 0 14 14" aria-hidden="true">${MORE[name]}</svg>` : ico(name, cls);

/** The house's own button: 31px, rounded-sm, mono label. */
export const button = (label, { kind = "", icon = "", attrs = "" } = {}) =>
  `<button type="button" class="b ${kind}" ${attrs}>${icon ? glyph(icon) : ""}<span>${label}</span></button>`;

/**
 * Draws the trip chrome and a slim strip above it that is not part of the design.
 * Returns the page element under the chrome.
 */
export function mount({ tab, title, extra = "" }) {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="proto-bar"><b>${esc(title)}</b><span class="idea" id="spec"></span>${extra}<span class="said" id="said" aria-live="polite"></span></div>`,
  );
  const frame = document.getElementById("frame");
  frame.innerHTML = tripFrame(tab, ME);
  const tabs = frame.querySelector(".tf-tabs");
  const keys = Object.keys(SKIN);
  tabs.querySelectorAll("a").forEach((a, i) => {
    a.style.setProperty("--tab-bg", `var(${SKIN[keys[i]][0]})`);
    a.style.setProperty("--tab-ink", `var(${SKIN[keys[i]][1]})`);
  });
  tabs.insertAdjacentHTML("beforeend", `<a href="#" class="tf-gear" aria-label="Trip settings"><span class="tf-gl">${glyph("gear")}</span></a>`);
  return document.getElementById("page");
}

export const say = (text) => { const el = document.getElementById("said"); if (el) el.textContent = text; };

/** Registers the variants and rebuilds the page on each switch. */
export function run(list, build) {
  variants(list.map(({ key, name }) => ({ key, name })), (key) => {
    const v = list.find((x) => x.key === key) ?? list[0];
    document.getElementById("spec").textContent = `${v.name}: ${v.spec}`;
    say("");
    build(v.key);
  });
}
