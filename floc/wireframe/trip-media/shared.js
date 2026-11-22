import { avatar, esc, ico, toast } from "/_house/kit/trip-frame.mjs";
import { paint, SCENE_KINDS } from "./scenes.js";

const DRAW = {
  upload: '<path d="M7 9.4V2.6M4.2 5.2 7 2.4l2.8 2.8M2.4 9.6v1.8h9.2V9.6"/>',
  photos: '<rect x="1.8" y="2.6" width="10.4" height="8.8" rx="1.4"/><circle cx="5" cy="5.6" r="1"/><path d="m2 10 3-2.6 2.2 1.8 2-1.6 2.6 2.2"/>',
  play: '<path d="M4.4 2.8v8.4L11 7Z"/>',
  pause: '<path d="M5 3v8M9 3v8"/>',
  trash: '<path d="M2.6 3.8h8.8M5.4 3.8V2.4h3.2v1.4M3.6 3.8l.6 8h5.6l.6-8"/>',
  pencil: '<path d="M2.4 11.6l.6-2.7 6.3-6.3 2.1 2.1-6.3 6.3Z"/>',
};
export const draw = (name) => `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${DRAW[name]}</svg>`;

export const PEOPLE = {
  dev: { name: "Dev", tone: 3, initial: "DU" },
  priya: { name: "Priya", tone: 1, initial: "PR" },
  sofia: { name: "Sofia", tone: 4, initial: "SA" },
  tom: { name: "Tom", tone: 6, initial: "TW" },
};
export const ME = PEOPLE.dev;
export const STOPS = [
  { id: "lisbon", no: 1, name: "Lisbon", when: "5–8 Sep", nights: 3, days: [["Sat", 5, "transport", "flight", "Flight to Lisbon"], ["Sun", 6, "activity", "activity", "Tram 28"], ["Mon", 7, "food", "food", "Time Out Market"]] },
  { id: "lagos", no: 2, name: "Lagos", when: "8–12 Sep", nights: 4, days: [["Tue", 8, "transport", "train", "Train to Lagos"], ["Wed", 9, "activity", "activity", "Ponta da Piedade boats"], ["Thu", 10, "none", "", "…"]] },
];
export const TRIP = { name: "Portugal, late summer", when: "Sat 5 – Sat 12 Sep", cap: 100 };

const seed = [
  ["tram", "lisbon", "priya", 1.5, null, 6], ["roofs", "lisbon", "dev", 1.33, null, 6], ["tiles", "lisbon", "sofia", 1, null, 6],
  ["alley", "lisbon", "tom", 0.8, "0:24", 6], ["table", "lisbon", "priya", 1.33, null, 7], ["river", "lisbon", "dev", 1.78, null, 7],
  ["sunset", "lisbon", "sofia", 1.5, "0:41", 7], ["friends", "lisbon", "tom", 1.33, null, 7],
  ["cliffs", "lagos", "dev", 1.5, null, 9], ["boat", "lagos", "priya", 1.33, "1:12", 9], ["beach", "lagos", "sofia", 1.78, null, 9],
  ["sunset", "lagos", "tom", 0.8, null, 9], ["table", "lagos", "dev", 1, null, 10], ["cliffs", "lagos", "sofia", 1.33, "0:18", 10],
  ["friends", null, "priya", 1.5, null, 12], ["roofs", null, "tom", 1.33, null, 12],
];

export const media = seed.map(([scene, stop, who, ratio, video, day], i) => ({ id: `m${i}`, scene, stop, who, ratio, video, day }));

const pics = new Map();
export const picOf = (m) => {
  if (!pics.has(m.scene)) pics.set(m.scene, paint(m.scene));
  return pics.get(m.scene);
};

export const inStop = (id) => media.filter((m) => m.stop === id);
export const inTrip = () => media.filter((m) => !m.stop);
export const routeOrder = () => [...STOPS.flatMap((s) => inStop(s.id)), ...inTrip()];
export const groups = () =>
  [...STOPS.map((s) => ({ id: s.id, no: s.no, name: s.name, list: inStop(s.id) })), { id: "trip", no: null, name: "Whole trip", list: inTrip() }];
export const stopName = (id) => STOPS.find((s) => s.id === id)?.name ?? "The whole trip";
export const counted = (list = media) => {
  const v = list.filter((m) => m.video).length;
  const p = list.length - v;
  return [p ? `${p} photo${p === 1 ? "" : "s"}` : "", v ? `${v} video${v === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
};
export const capLine = () => `${media.filter((m) => !m.video).length} of ${TRIP.cap} photos`;

export const thumb = (m, cls = "", style = "") =>
  `<button type="button" class="th ${cls}" data-m="${m.id}" style="${style}" aria-label="${m.video ? "Play video" : "Open photo"} from ${esc(PEOPLE[m.who].name)}, ${esc(stopName(m.stop))}">${picOf(m)}${m.video ? `<span class="th-v nums">${draw("play")}${m.video}</span>` : ""}</button>`;

let adds = 0;
export function addMedia(stop) {
  adds += 1;
  const video = adds % 3 === 0;
  const m = { id: `n${adds}`, scene: SCENE_KINDS[(adds * 3) % SCENE_KINDS.length], stop, who: "dev", ratio: 1.33, video: video ? "0:09" : null };
  media.push(m);
  toast(video ? `Video added to ${stopName(stop)}. Its location data stays in the file.` : `Photo added to ${stopName(stop)}`);
  return m;
}

export const seconds = (text) => {
  const [a, b] = text.split(":").map(Number);
  return a * 60 + b;
};
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function mountViewer(el, ids, first, opts = {}) {
  let list = [...ids];
  let at = Math.max(0, list.indexOf(first));
  let timer = null;
  let t = 0;
  const halt = () => { clearInterval(timer); timer = null; };
  const item = () => media.find((m) => m.id === list[at]);

  const paintBar = () => {
    const m = item();
    if (!m) return;
    const fill = el.querySelector(".vw-fill");
    const time = el.querySelector(".vw-time");
    const play = el.querySelector("[data-vw=play]");
    if (fill) fill.style.width = `${(t / seconds(m.video)) * 100}%`;
    if (time) time.textContent = `${clock(t)} / ${m.video}`;
    if (play) { play.innerHTML = draw(timer ? "pause" : "play"); play.setAttribute("aria-label", timer ? "Pause" : "Play"); }
    el.querySelector(".vw-pic")?.classList.toggle("is-playing", !!timer);
  };

  const render = () => {
    const m = item();
    if (!m) { opts.onEmpty?.(); return; }
    const who = PEOPLE[m.who];
    el.innerHTML =
      `<div class="vw"><figure class="vw-pic" style="--r:${m.ratio}">${picOf(m)}</figure>` +
      (m.video ? `<div class="vw-track" aria-hidden="true"><i class="vw-fill"></i></div>` : "") +
      `<div class="vw-bar">` +
      `<span class="vw-nav"><button type="button" class="ib" data-vw="prev" aria-label="Previous" ${list.length < 2 ? "disabled" : ""}>${ico("chevL")}</button><span class="nums vw-at">${at + 1}/${list.length}</span><button type="button" class="ib" data-vw="next" aria-label="Next" ${list.length < 2 ? "disabled" : ""}>${ico("chevR")}</button></span>` +
      (m.video ? `<span class="vw-play"><button type="button" class="frame small" data-vw="play" aria-label="Play">${draw("play")}</button><span class="nums vw-time">0:00 / ${m.video}</span></span>` : "") +
      `<span class="vw-who">${avatar(who, 22)}<span>${esc(who.name)}</span><span class="vw-place">${esc(stopName(m.stop))}</span></span>` +
      `<span class="vw-end">${m.who === "dev" ? `<button type="button" class="ib" data-vw="del" aria-label="Delete">${draw("trash")}</button>` : ""}${opts.onClose ? `<button type="button" class="ib" data-vw="close" aria-label="Close">${ico("cross")}</button>` : ""}</span>` +
      `</div></div>`;
    opts.onChange?.(m);
  };

  const go = (by) => {
    halt();
    t = 0;
    at = (at + by + list.length) % list.length;
    render();
  };

  el.onclick = (e) => {
    const b = e.target.closest("[data-vw]");
    if (!b) return;
    e.stopPropagation();
    const verb = b.dataset.vw;
    if (verb === "prev") go(-1);
    if (verb === "next") go(1);
    if (verb === "close") { halt(); opts.onClose(); }
    if (verb === "del") {
      halt();
      const i = media.findIndex((m) => m.id === list[at]);
      media.splice(i, 1);
      list.splice(at, 1);
      toast("Deleted");
      at = Math.min(at, list.length - 1);
      t = 0;
      if (list.length) render(); else opts.onEmpty?.();
      opts.onDelete?.();
    }
    if (verb === "play") {
      if (timer) { halt(); paintBar(); return; }
      const end = seconds(item().video);
      if (t >= end) t = 0;
      timer = setInterval(() => {
        t += 1;
        if (t >= end) { t = end; halt(); }
        paintBar();
      }, 1000);
      paintBar();
    }
  };

  render();
  return { go, halt: () => { halt(); paintBar(); }, jump: (id) => { halt(); t = 0; at = Math.max(0, list.indexOf(id)); render(); }, current: () => item()?.id };
}
