import { ico, isNarrow } from "/_house/kit/trip-frame.mjs";
import { addMedia, capLine, draw, groups, mountViewer, routeOrder, thumb } from "./shared.js";
import { arrows, shell } from "./viewers.js";

const addTo = (id) => addMedia(id === "trip" ? null : id);
const addButton = () => `<span class="nums win-cap">${capLine()}</span><button type="button" class="btn" data-gadd>${draw("upload")}<span>Add</span></button>`;
const closeButton = `<button type="button" class="ib" data-shut aria-label="Close">${ico("cross")}</button>`;
const tabs = (cur) =>
  `<div class="gal-tabs" role="group" aria-label="Stop">${groups().map((g) =>
    `<button type="button" data-tab="${g.id}" aria-pressed="${g.id === cur}">${g.no ? `<b class="nums">${g.no}</b>` : ""}${g.name}<span class="nums">${g.list.length}</span></button>`).join("")}</div>`;

function grow(target, tile) {
  if (!tile || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = tile.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!b.width || !b.height) return;
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  target.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${a.width / b.width})`, opacity: 0.5 }, { transform: "none", opacity: 1 }],
    { duration: 220, easing: "cubic-bezier(.2,.7,.2,1)" },
  );
}

const sumOf = (list) => list.reduce((n, m) => n + m.ratio, 0);

function fillRows(list, target) {
  if (!list.length) return [];
  const count = Math.max(1, Math.round(sumOf(list) / target));
  const ideal = sumOf(list) / count;
  const rows = Array.from({ length: count }, () => []);
  let run = 0;
  list.forEach((m) => {
    rows[Math.min(count - 1, Math.floor((run + m.ratio / 2) / ideal))].push(m);
    run += m.ratio;
  });
  const full = rows.filter((r) => r.length);
  if (full.length > 1 && full.at(-1).length === 1) full.at(-2).push(full.pop()[0]);
  return full;
}

const tessellated = (list) =>
  `<div class="tess">${fillRows(list, isNarrow() ? 2.4 : 4.6).map((r) =>
    `<div class="tess-row">${r.map((m) => thumb(m, "gal-tile", `flex:${m.ratio} 1 0;aspect-ratio:${m.ratio}`)).join("")}</div>`).join("")}</div>`;

export function tessGallery(start, after) {
  let cur = start;
  let viewer = null;
  let pinned = start;
  const shut = () => { viewer?.halt(); viewer = null; over.hidden = true; over.innerHTML = ""; };
  const close = () => {
    if (viewer) { shut(); return; }
    d.close();
    d.remove();
    after();
  };
  const d = shell("mv-gal mv-sheet mv-long", `<header class="gal-top"></header><div class="gal-body"></div><div class="win-over top" hidden></div>`, close);
  const top = d.querySelector(".gal-top");
  const body = d.querySelector(".gal-body");
  const over = d.querySelector(".win-over");
  const drawTop = () => { top.innerHTML = `${tabs(cur)}${addButton()}${closeButton}`; };
  const paint = (focus) => {
    const keep = body.scrollTop;
    drawTop();
    body.innerHTML = groups().map((g) =>
      `<section data-part="${g.id}"><h3 class="long-h">${g.no ? `<span class="book-no">${g.no}</span>` : ""}${g.name}<span class="nums">${g.list.length}</span></h3>${tessellated(g.list)}</section>`).join("");
    if (focus) body.querySelector(`[data-part="${focus}"]`)?.scrollIntoView({ block: "start" });
    else body.scrollTop = keep;
  };
  const spy = () => {
    if (pinned) return;
    const box = body.getBoundingClientRect();
    const parts = [...body.querySelectorAll("[data-part]")];
    const here = (parts.filter((p) => p.getBoundingClientRect().top - box.top <= 40).pop() ?? parts[0])?.dataset.part;
    if (here && here !== cur) { cur = here; drawTop(); }
  };
  body.addEventListener("scroll", spy, { passive: true });
  ["wheel", "touchmove"].forEach((kind) => body.addEventListener(kind, () => { pinned = null; }, { passive: true }));
  d.addEventListener("click", (e) => {
    if (e.target.closest("[data-shut]")) { close(); return; }
    const t = e.target.closest("[data-tab]");
    if (t) {
      cur = t.dataset.tab;
      pinned = cur;
      drawTop();
      body.querySelector(`[data-part="${cur}"]`)?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      return;
    }
    if (e.target.closest("[data-gadd]")) { addTo(cur); paint(); return; }
    const m = e.target.closest("[data-m]");
    if (!m || viewer) return;
    over.hidden = false;
    viewer = mountViewer(over, routeOrder().map((x) => x.id), m.dataset.m, {
      onClose: shut,
      onEmpty: () => { shut(); paint(); },
      onDelete: () => paint(),
      onChange: () => over.querySelector(".vw-pic svg")?.setAttribute("preserveAspectRatio", "xMidYMid meet"),
    });
    grow(over, m);
  });
  arrows(d, (by) => viewer?.go(by));
  d.showModal();
  paint(start);
}
