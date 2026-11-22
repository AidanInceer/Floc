import { addDays, esc } from "/_house/kit/trip-frame.mjs";
import { variants } from "/_house/switcher.js";
import { createStore } from "./store.js";
import { days, dates, frame, overview } from "./pages.js";
import { dayLabel, placeModal } from "./shared.js";
import L from "./l-centre.js";

const LIST = [L];
const PAGES = { overview, days, dates };
const el = (id) => document.getElementById(id);

let current = L;
let store = createStore();
let ui = fresh();
const tiles = new Map();

function fresh() {
  return { view: "overview", cat: "all", catNew: false, menu: null, week: "2026-12-28", selDay: "2026-12-29", placing: null, placeId: null, when: { day: null, time: null } };
}

const ctx = {
  get s() { return store.s; },
  get store() { return store; },
  get ui() { return ui; },
  focus: null,
  set(patch) { Object.assign(ui, patch); render(); },
  go(view, patch = {}) {
    Object.assign(ui, { view, menu: null }, patch);
    render();
    window.scrollTo({ top: 0 });
  },
  added(ideaId, ev, { showDays = true } = {}) {
    const text = `Added to ${dayLabel(ev.day)}`;
    toast(text, [
      ...(showDays && ui.view !== "days" ? [["See it on Days", () => { showDay(ev.day); }]] : []),
      ["Undo", () => { store.unpromote(ideaId); render(); }],
    ]);
  },
  toast,
  showDay,
};

function showDay(day) {
  const monday = day >= "2027-01-04" ? "2027-01-04" : "2026-12-28";
  ctx.go("days", { selDay: day, week: monday });
}

function toast(text, actions = []) {
  const host = el("toasts");
  host.innerHTML = `<p class="tst"><span>${esc(text)}</span>${actions.map(([label], i) => `<button type="button" data-toast="${i}">${esc(label)}</button>`).join("")}</p>`;
  host.onclick = (e) => {
    const b = e.target.closest("[data-toast]");
    if (!b) return;
    host.innerHTML = "";
    actions[Number(b.dataset.toast)][1]();
  };
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { host.innerHTML = ""; }, 6000);
}

function capture() {
  const scroll = {};
  document.querySelectorAll("[data-scroll]").forEach((n) => { scroll[n.dataset.scroll] = [n.scrollLeft, n.scrollTop]; });
  const kept = {};
  document.querySelectorAll("[data-keep]").forEach((n) => { kept[n.dataset.keep] = n.value; });
  const active = document.activeElement?.dataset?.keep ?? null;
  return { scroll, kept, active };
}

function restore({ scroll, kept, active }) {
  document.querySelectorAll("[data-scroll]").forEach((n) => {
    const at = scroll[n.dataset.scroll];
    if (at) { n.scrollLeft = at[0]; n.scrollTop = at[1]; }
  });
  document.querySelectorAll("[data-keep]").forEach((n) => { if (kept[n.dataset.keep]) n.value = kept[n.dataset.keep]; });
  const wanted = ctx.focus ?? (active ? `[data-keep="${active}"]` : null);
  ctx.focus = null;
  if (wanted) document.querySelector(wanted)?.focus({ preventScroll: true });
}

function syncTracks() {
  document.querySelectorAll(".ct-track").forEach((t, i) => {
    const on = t.querySelector('[aria-pressed="true"]');
    const tile = t.querySelector(".ct-tile");
    if (!on || !tile || !on.offsetWidth) return;
    const box = { x: on.offsetLeft, w: on.offsetWidth, h: on.offsetHeight, y: on.offsetTop };
    const key = `${current.key}-${i}`;
    const was = tiles.get(key);
    const paint = (b) => { tile.style.transform = `translateX(${b.x}px)`; tile.style.width = `${b.w}px`; tile.style.height = `${b.h}px`; tile.style.top = `${b.y}px`; };
    tile.style.transition = "none";
    paint(was ?? box);
    tile.getBoundingClientRect();
    tile.style.transition = "";
    paint(box);
    tiles.set(key, box);
    const left = on.offsetLeft - (t.clientWidth - on.offsetWidth) / 2;
    if (t.scrollWidth > t.clientWidth) t.scrollTo({ left, behavior: was && was.x !== box.x ? "smooth" : "auto" });
  });
}

function proto() {
  return `<div class="pbar"><b>${current.key}. ${esc(current.name)}</b><span>${esc(current.how)}</span>${current.protoExtra ? current.protoExtra(ctx) : ""}<button type="button" data-a="reset">Start again</button></div>`;
}

function render() {
  const kept = capture();
  el("frame").innerHTML = proto() + frame(ui.view);
  el("page").innerHTML = PAGES[ui.view](ctx, current);
  el("layer").innerHTML = (current.layer ? current.layer(ctx) : "") + placeModal(ctx);
  document.body.classList.toggle("has-layer", Boolean(el("layer").querySelector("[data-lock]")));
  document.body.dataset.variant = current.key;
  restore(kept);
  syncTracks();
  current.after?.(ctx);
}

function common(a, d, node) {
  if (a === "nav") return ctx.go(d.view);
  if (a === "noop") return toast("Not part of this mock-up");
  if (a === "reset") return pick(current.key);
  if (a === "vote") { store.vote(Number(d.id)); return render(); }
  if (a === "menu") return ctx.set({ menu: ui.menu === Number(d.id) ? null : Number(d.id) });
  if (a === "remove") {
    const id = Number(d.id);
    const title = store.idea(id).title;
    store.remove(id);
    ui.menu = null;
    render();
    return toast(`Removed ${title}`, [["Undo", () => { store.restore(id); render(); }]]);
  }
  if (a === "cat") return ctx.set({ cat: d.id, menu: null });
  if (a === "cat-step") {
    const all = ["all", ...store.s.cats.map((c) => c.id)];
    const next = (all.indexOf(ui.cat) + Number(d.by) + all.length) % all.length;
    return ctx.set({ cat: all[next], menu: null });
  }
  if (a === "cat-new") { ctx.focus = ui.catNew ? null : '[data-keep="cat-new"]'; return ctx.set({ catNew: !ui.catNew }); }
  if (a === "week") return ctx.set({ week: addDays(ui.week, Number(d.by)) });
  if (a === "day-sel") return ctx.set({ selDay: d.day, week: d.day >= "2027-01-04" ? "2027-01-04" : "2026-12-28" });
  if (a === "stop-day") return showDay(d.day);
  if (a === "place-open") {
    const i = store.idea(Number(d.id));
    return ctx.set({ placeId: i.id, when: { day: i.day, time: i.time }, menu: null });
  }
  if (a === "place-cancel") {
    if ("self" in d && node !== d.__target) return undefined;
    return ctx.set({ placeId: null });
  }
  if (a === "when-day") return ctx.set({ when: { ...ui.when, day: d.day } });
  if (a === "when-time") return ctx.set({ when: { ...ui.when, time: d.time || null } });
  if (a === "place-confirm") {
    const id = ui.placeId;
    const ev = store.promote(id, ui.when.day, ui.when.time);
    ui.placeId = null;
    render();
    return ctx.added(id, ev);
  }
  return undefined;
}

document.addEventListener("click", (e) => {
  const node = e.target.closest("[data-a]");
  if (!node) {
    if (ui.menu) ctx.set({ menu: null });
    return;
  }
  if ("self" in node.dataset && e.target !== node) {
    const inner = e.target.closest("[data-a]:not([data-self])");
    if (!inner) return;
  }
  if (node.tagName === "A") e.preventDefault();
  const { a, ...d } = node.dataset;
  d.__target = e.target;
  if (a !== "menu" && a !== "remove" && ui.menu) ui.menu = null;
  if (current.act?.(a, d, ctx, node) === true) return;
  common(a, d, node);
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-f]");
  if (!form) return;
  e.preventDefault();
  const data = new FormData(form);
  if (form.dataset.f === "cat") {
    const label = String(data.get("label") ?? "").trim();
    if (!label) return;
    form.reset();
    document.querySelectorAll('[data-keep="cat-new"]').forEach((n) => { n.value = ""; });
    const id = store.addCat(label);
    ctx.set({ cat: id, catNew: false });
    return;
  }
  if (form.dataset.f === "idea") {
    const title = String(data.get("title") ?? "").trim();
    if (!title) return;
    const key = form.querySelector("[data-keep]")?.dataset.keep;
    form.querySelector("[name=title]").value = "";
    store.add(title, String(data.get("cat")));
    ctx.focus = key ? `[data-keep="${key}"]` : null;
    render();
    current.ideaAdded?.(title, ctx);
    return;
  }
  current.submit?.(form, data, ctx);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (ui.placeId) ctx.set({ placeId: null });
  else if (ui.menu) ctx.set({ menu: null });
  else current.escape?.(ctx);
});

window.addEventListener("resize", () => syncTracks());

function pick(key) {
  current = LIST.find((v) => v.key === key) ?? L;
  store = createStore();
  ui = { ...fresh(), ...(current.initial ? current.initial() : {}) };
  tiles.clear();
  el("toasts").innerHTML = "";
  render();
  window.scrollTo({ top: 0 });
}

variants(LIST.map((v) => ({ key: v.key, name: v.name, round: v.round ?? 1 })), pick);
