import { variants } from "/_house/switcher.js";

import * as T1v4 from "./t1v4.js";
import { SUGGEST } from "./trip.js";
import { S, LISTING, addDays, addMonths, closedPage, get, liveHtml, put, reset, skippedPage, stateLine, toast, tripOpened } from "./kit.js";

const VARS = { T1v4 };
const LIST = Object.values(VARS).map((v) => ({ key: v.meta.key, name: v.meta.name, round: v.meta.round }));
const KNOBS = [
  ["flow", "Flow", [["welcome", "Welcome"], ["start", "Start a trip"]]],
  ["arrive", "Person", [["cold", "Brand new"], ["invite", "Joined on an invite"]]],
  ["door", "Door", [["new", "New trip"], ["explore", "From Explore"]]],
];

const stage = document.getElementById("stage");
const filled = (path) => String(get(path)).trim() !== "";
const toggle = (list, value) => {
  const i = list.indexOf(value);
  if (i < 0) list.push(value);
  else list.splice(i, 1);
};
const scenario = () => ({ variant: S.variant, flow: S.flow, arrive: S.arrive, door: S.door });

function startFlow(door) {
  Object.assign(S, { flow: "start", door, step: 0, open: null });
  if (door === "explore") {
    S.trip.name = LISTING.title;
    toast(`On Explore you pick a trip. Here it is ${LISTING.title}.`);
  }
}

function pickDay(day) {
  const t = S.trip;
  const lst = t.borrow ?? (S.door === "explore" ? LISTING : null);
  if (lst) Object.assign(t, { start: day, end: addDays(day, lst.nights) });
  else if (!t.start || t.end || day <= t.start) Object.assign(t, { start: day, end: null });
  else t.end = day;
}

const ACT = {
  tag: (v) => {
    toggle(S.me.tags, v);
    S.pop = S.me.tags.includes(v) ? v : null;
  },
  style: (v) => {
    const [g, value] = v.split("=");
    S.me.style[g] = S.me.style[g] === value ? null : value;
    S.pop = S.me.style[g] ? v : null;
  },
  air: (v) => {
    Object.assign(S.me, { airport: v || null, q: "" });
    S.pop = v ? "air" : null;
    if (!v) S.focus = ".m .fld input";
  },
  ans: (v) => {
    const [k, value] = v.split("=");
    const key = k === "dates" ? "hasDates" : "hasWhere";
    const next = value === "yes";
    S.trip[key] = S.trip[key] === next ? null : next;
    if (key === "hasDates" && S.trip.hasDates !== true) Object.assign(S.trip, { start: null, end: null });
    if (key === "hasWhere" && S.trip.hasWhere !== true) S.trip.places = [];
    if (key === "hasWhere" && S.trip.hasWhere !== false) S.trip.borrow = null;
    S.fresh = S.trip[key] === null ? null : k;
  },
  sit: (v) => {
    const [d, w] = v.split("-");
    S.trip.hasDates = d === "yes";
    if (S.door !== "explore") S.trip.hasWhere = w === "yes";
    Object.assign(S, { step: 1, dir: "fwd" });
  },
  place: (v) => {
    toggle(S.trip.places, v);
    S.trip.q = "";
    S.pop = S.trip.places.includes(v) ? v : null;
    S.focus = ".m [data-bind='trip.q']";
  },
  poll: (v) => { S.trip.poll = v === "yes"; },
  borrow: (v) => {
    const pick = SUGGEST.find((s) => s.id === v) ?? null;
    S.trip.borrow = !pick || S.trip.borrow?.id === v ? null : pick;
    if (S.trip.borrow && S.trip.start) S.trip.end = addDays(S.trip.start, S.trip.borrow.nights);
    S.pop = S.trip.borrow ? v : null;
  },
  sug: (v) => { S.trip.name = v; },
  copy5: () => {
    S.copied = true;
    setTimeout(() => { S.copied = false; render(); }, 1200);
  },
  person: (v) => toggle(S.trip.people, v),
  bring: (v) => { S.trip[v] = !S.trip[v]; },
  open: (v) => { S.open = S.open === v ? null : v; },
  step: (v) => Object.assign(S, { dir: Number(v) > S.step ? "fwd" : "back", step: Number(v), open: null }),
  fold: () => { S.folded = !S.folded; },
  skip: () => { S.skipped = true; },
  close: () => { S.closed = true; },
  day: pickDay,
  month: (v) => { S.cal = addMonths(S.cal, Number(v)); },
  nodates: () => Object.assign(S.trip, { start: null, end: null }),
  copy: () => toast("Invite link copied"),
  restart: () => reset(scenario()),
  create: () => { if (filled("trip.name")) Object.assign(S, { created: true, open: null }); },
  focus: (v) => { S.focus = v; },
  door: (v) => {
    if (v === "link") return toast("Paste the link and you are on the trip");
    if (v === "trip") return Object.assign(S, { created: true, joined: true, open: null });
    startFlow(v);
  },
  quick: (v) => {
    if (v === "explore") Object.assign(S.trip, { name: S.trip.name.trim() || LISTING.title });
    if (v === "explore") S.door = "explore";
    if (filled("trip.name")) Object.assign(S, { created: true, open: null });
    else S.focus = ".ntf input";
  },
};

let lastKey = "";
function animate() {
  const key = [S.variant, S.flow, S.step, S.view, S.card, S.created, S.skipped, S.closed, S.joined].join("|");
  if (key === lastKey) delete stage.dataset.anim;
  else {
    const a = lastKey.split("|");
    const b = key.split("|");
    const same = lastKey && a[0] === b[0] && a[1] === b[1] && a[3] === b[3] && a.slice(5).join() === b.slice(5).join();
    stage.dataset.anim = !same ? "open" : a[2] !== b[2] ? S.dir || "fwd" : "deck";
  }
  lastKey = key;
}

function slide(btn) {
  const seg = btn.closest(".seg2");
  const buttons = [...seg.querySelectorAll("button")];
  const on = btn.getAttribute("aria-pressed") !== "true";
  buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn && on)));
  seg.style.setProperty("--i", String(buttons.indexOf(btn)));
  seg.dataset.on = String(on);
}

function glide(h0) {
  const m = stage.querySelector(".m.glide");
  if (!m || !h0 || stage.dataset.anim === "open" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const h1 = m.getBoundingClientRect().height;
  if (Math.abs(h1 - h0) < 2) return;
  m.style.height = `${h0}px`;
  m.getBoundingClientRect();
  m.style.transition = "height 0.28s var(--ease)";
  m.style.height = `${h1}px`;
  const settle = () => Object.assign(m.style, { height: "", transition: "" });
  m.addEventListener("transitionend", settle, { once: true });
  setTimeout(settle, 360);
}

function render() {
  animate();
  const V = VARS[S.variant];
  const h0 = stage.querySelector(".m.glide")?.getBoundingClientRect().height ?? 0;
  stage.innerHTML = S.created ? tripOpened() : S.skipped ? skippedPage() : S.closed ? closedPage() : V[S.flow]();
  glide(h0);
  document.getElementById("idea").textContent = V.meta.idea;
  document.getElementById("state").innerHTML = stateLine();
  document.getElementById("knobs").innerHTML = KNOBS.filter(([key]) => key !== "door" || S.flow === "start")
    .map(([key, label, options]) => `<div class="knob"><span>${label}</span>${options.map(([value, text]) => `<button type="button" data-knob="${key}:${value}" aria-pressed="${S[key] === value}">${text}</button>`).join("")}</div>`).join("");
  if (S.focus) stage.querySelector(S.focus)?.focus();
  Object.assign(S, { focus: null, pop: null, leave: null, fresh: null });
}

function refresh() {
  document.querySelectorAll("[data-live]").forEach((el) => { el.innerHTML = liveHtml(el.dataset.live); });
  document.querySelectorAll("[data-needs]").forEach((el) => { el.disabled = !filled(el.dataset.needs); });
  document.querySelectorAll("[data-pen]").forEach((el) => el.classList.toggle("b-primary", filled(el.dataset.pen)));
  document.getElementById("state").innerHTML = stateLine();
}

function run(spec) {
  const cut = spec.indexOf(":");
  ACT[cut < 0 ? spec : spec.slice(0, cut)]?.(cut < 0 ? "" : spec.slice(cut + 1));
  render();
}

document.addEventListener("click", (event) => {
  const knob = event.target.closest("[data-knob]");
  if (knob) {
    const [key, value] = knob.dataset.knob.split(":");
    reset({ ...scenario(), [key]: value });
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    history.replaceState(null, "", url);
    return render();
  }
  const el = event.target.closest("[data-act]");
  if (!el || el.disabled) return;
  if (el.dataset.keep !== undefined) {
    const spec = el.dataset.act;
    const cut = spec.indexOf(":");
    ACT[spec.slice(0, cut)](spec.slice(cut + 1));
    S.pop = null;
    slide(el);
    refresh();
    if (el.dataset.keep === "later") setTimeout(render, 240);
    return;
  }
  run(el.dataset.act);
});

document.addEventListener("input", (event) => {
  const el = event.target.closest("[data-bind]");
  if (!el) return;
  put(el.dataset.bind, el.value);
  if (el.tagName === "SELECT") return render();
  refresh();
});

document.addEventListener("keydown", (event) => {
  const dialog = event.key === "Escape" ? stage.querySelector(".m") : null;
  if (dialog) return run(dialog.dataset.close);
  const el = event.target.closest?.("[data-enter]");
  if (el && event.key === "Enter") return run(el.dataset.enter);
  const word = event.target.closest?.("span[role=button][data-act]");
  if (word && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    S.focus = `[data-act="${word.dataset.act}"]`;
    run(word.dataset.act);
  }
});

const asked = new URLSearchParams(location.search);
const pick = (key, allowed) => (allowed.includes(asked.get(key)) ? { [key]: asked.get(key) } : {});
reset({ ...pick("flow", ["welcome", "start"]), ...pick("arrive", ["cold", "invite"]), ...pick("door", ["new", "explore"]) });
let seeded = false;
function seed() {
  seeded = true;
  if (asked.has("step")) S.step = Number(asked.get("step")) || 0;
  if (asked.has("w")) S.trip.hasWhere = asked.get("w") === "yes";
  if (asked.has("d")) S.trip.hasDates = asked.get("d") === "yes";
  if (asked.has("b")) S.trip.borrow = SUGGEST.find((s) => s.id === asked.get("b")) ?? null;
  if (!asked.has("demo")) return;
  if (S.trip.hasWhere && S.door !== "explore") S.trip.places = ["Lisbon", "Porto"];
  const lst = S.trip.borrow ?? (S.door === "explore" ? LISTING : null);
  if (S.trip.hasDates) Object.assign(S.trip, lst ? { start: "2027-05-08", end: addDays("2027-05-08", lst.nights) } : { start: "2027-05-14", end: "2027-05-21" });
  Object.assign(S.me, { airport: "DUB", tags: ["beaches", "food first", "slow mornings"] });
  Object.assign(S.me.style, { plan: "rough", spend: "comfortable", sleep: "apartments" });
}
variants(LIST, (key) => {
  reset({ ...scenario(), variant: key });
  if (!seeded) seed();
  render();
});
