import { variants } from "/_house/switcher.js";

const svg = (d, cls = "ico") => `<svg class="${cls}" viewBox="0 0 14 14" aria-hidden="true">${d}</svg>`;
const ICON = {
  check: `<path d="M2.6 7.4 5.6 10.4 11.4 4"/>`,
  minus: `<path d="M3 7h8"/>`,
  plus: `<path d="M3 7h8M7 3v8"/>`,
  cross: `<path d="M3.6 3.6l6.8 6.8M10.4 3.6l-6.8 6.8"/>`,
  spark: `<path d="M7 1.8c.4 2.8 1.4 4 4.2 5.2-2.8 1.2-3.8 2.4-4.2 5.2-.4-2.8-1.4-4-4.2-5.2C5.6 5.8 6.6 4.6 7 1.8Z"/>`,
};
const spark = () => svg(ICON.spark, "ico s10");

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let nextId = 1;
const line = (label, quantity, sugg, packed = false) => ({ id: nextId++, label, quantity, sugg, packed });

const cubes = [
  {
    heading: "Essentials",
    lines: [
      line("passport", 1, true),
      line("wallet and cards", 1, true),
      line("phone", 1, true),
      line("phone charger", 1, true),
      line("sunglasses", 1, false),
      line("keys", 1, true),
      line("travel adapter for Portugal and Spain", 1, true),
    ],
  },
  {
    heading: "Clothes",
    lines: [
      line("linen shirts", 3, false, true),
      line("swim shorts", 2, false),
      line("socks", 5, true),
      line("light rain jacket", 1, true),
      line("sleepwear", 1, true, true),
      line("walking sandals", 1, false),
    ],
  },
  {
    heading: "Toiletries",
    lines: [
      line("sun cream SPF 50", 1, true),
      line("toothbrush", 1, true),
      line("contact lenses", 2, false),
    ],
  },
];

const LIST = [{ key: "A3", name: "Soft blue spark after the name, n suggested in the head" }];

function rowHtml(l) {
  const mark = l.sugg ? `<span class="spark-after" role="img" aria-label="Suggested" title="Suggested">${spark()}</span>` : "";
  return `<div class="row${l.packed ? " packed" : ""}" data-id="${l.id}">
    <button type="button" class="box" data-act="tick" aria-label="${esc(l.packed ? `Unpack ${l.label}` : `Mark ${l.label} packed`)}">${svg(ICON.check)}</button>
    <span class="name"><span class="qty">${l.quantity}</span><span class="sep"> — </span><span class="label">${esc(l.label)}</span>${mark}</span>
    <span class="steps">
      <button type="button" class="step" data-act="minus" aria-label="One fewer ${esc(l.label)}" ${l.quantity <= 1 ? "disabled" : ""}>${svg(ICON.minus)}</button>
      <button type="button" class="step" data-act="plus" aria-label="One more ${esc(l.label)}" ${l.quantity >= 99 ? "disabled" : ""}>${svg(ICON.plus)}</button>
    </span>
    <button type="button" class="remove" data-act="remove" aria-label="Remove ${esc(l.label)}" title="Remove ${esc(l.label)}">${svg(ICON.cross)}</button>
  </div>`;
}

function cubeHtml(cube) {
  const packed = cube.lines.filter((l) => l.packed).length;
  const suggN = cube.lines.filter((l) => l.sugg).length;
  const head = suggN > 0 ? `<span class="sugg-count">${spark()}${suggN} suggested</span>` : "";
  return `<section class="cube">
    <header class="cube-head"><h3>${esc(cube.heading)}</h3>${head}<span class="tally nums">${packed}/${cube.lines.length}</span></header>
    <ul class="rows">${cube.lines.map((l) => `<li>${rowHtml(l)}</li>`).join("")}</ul>
  </section>`;
}

function render() {
  document.getElementById("cubes").innerHTML = cubes.filter((c) => c.lines.length > 0).map(cubeHtml).join("");
  const all = cubes.flatMap((c) => c.lines);
  const done = all.filter((l) => l.packed).length;
  document.getElementById("bag-count").textContent = `${all.length} things${done ? ` · ${done} packed` : ""}`;
}

document.getElementById("cubes").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = Number(btn.closest(".row").dataset.id);
  for (const cube of cubes) {
    const i = cube.lines.findIndex((l) => l.id === id);
    if (i < 0) continue;
    const l = cube.lines[i];
    if (btn.dataset.act === "tick") l.packed = !l.packed;
    if (btn.dataset.act === "minus") l.quantity = Math.max(1, l.quantity - 1);
    if (btn.dataset.act === "plus") l.quantity = Math.min(99, l.quantity + 1);
    if (btn.dataset.act === "remove") cube.lines.splice(i, 1);
  }
  render();
});

variants(LIST, render);
