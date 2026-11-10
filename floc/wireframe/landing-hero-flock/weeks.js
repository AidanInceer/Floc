// Round 4, on J: J1 the big date, J2 your days, J3 the calendar.
import { ico, group, face, head, scene, reduced, clamp, ease } from "./kit.js";
import { LEDE, CTA, ok, DAY, NIGHTS } from "./round3.js";

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
// Only 12–19 is free for all six.
const BUSY = { Priya: [[1, 4], [22, 26]], Sam: [[8, 10], [21, 23]], Jo: [[3, 7], [20, 21], [28, 30]], Alex: [[9, 11], [24, 27]], Maya: [[1, 2], [6, 8], [20, 24]], Kit: [[5, 6], [10, 11], [26, 30]] };
const away = (table, name, d) => (table[name] || []).find(([a, b]) => d >= a && d <= b);
const week = (start) => DAYS.slice(start - 1, start + 7);
const clash = (table, people, start) => people.filter((p) => week(start).some((d) => away(table, p.name, d)));
const span = (start) => `${DAY[start % 7]} ${start} – ${DAY[(start + 7) % 7]} ${start + 7} Sep`;
const WORD = `<span class="hl">Trip planning,</span> <span class="hl" id="word"></span>`;
const nights = `<div class="b-nights">${NIGHTS.map(([n, k]) => `<span style="flex:${k}"><i></i><b>${n}</b><small class="nums">${k}n</small></span>`).join("")}</div>`;

function sayer(root) {
  let said = "";
  return (found) => {
    const now = found ? "sorted." : "taking shape.";
    if (now !== said) { said = now; root.querySelector("#word").innerHTML = `<span class="roll">${now}</span>`; }
  };
}

// ── J1: the big date ───────────────────────────────────────────────────────
export function renderDate(stage) {
  const free = DAYS.map((d) => group.filter((p) => !away(BUSY, p.name, d)).length);
  stage.innerHTML = `<div class="hero hero-j1">
    ${head(WORD)}
    <div class="dial-wrap"><div class="dial">
      <div class="dial-top">
        <button type="button" class="dial-step" data-go="-1" aria-label="A day earlier">${ico("back")}</button>
        <div class="dial-date"><span class="k">September · 7 nights</span><b id="date"></b><span class="dial-sum" id="sum"></span></div>
        <button type="button" class="dial-step" data-go="1" aria-label="A day later">${ico("arrow")}</button>
      </div>
      <ul class="dial-who">${group.map((p) => `<li data-who="${p.name}">${face(p, 44)}<b>${p.name}</b><small></small></li>`).join("")}</ul>
      <div class="dial-rule">
        <div class="b-row dial-bars">${free.map((n, i) => `<span data-d="${i + 1}"><i style="height:${n * 5}px"></i></span>`).join("")}</div>
        <div class="b-row b-head">${DAYS.map((d) => `<span class="${d % 7 === 5 || d === 1 ? "sun" : ""}">${d}</span>`).join("")}</div>
        <div class="b-frame"></div>
        ${nights}
        <input type="range" min="1" max="23" value="1" aria-label="Move the week">
      </div>
    </div></div>
  </div>`;
  const root = stage.firstElementChild;
  const dial = root.querySelector(".dial");
  const input = root.querySelector("input");
  const say = sayer(root);
  const s = scene();
  let shown = 0;

  function apply(pos) {
    dial.style.setProperty("--at", pos.toFixed(3));
    const start = Math.round(pos);
    if (start === shown) return;
    shown = start;
    const out = clash(BUSY, group, start);
    const all = out.length === 0;
    dial.classList.toggle("found", all);
    root.querySelector("#date").innerHTML = `<span class="dn"><small>${DAY[start % 7]}</small><em class="dtick">${start}</em></span><i>–</i><span class="dn"><small>${DAY[(start + 7) % 7]}</small><em class="dtick">${start + 7}</em></span>`;
    root.querySelector("#sum").innerHTML = all ? ok("All 6 free") : `${6 - out.length} of 6 free`;
    root.querySelectorAll("[data-who]").forEach((li) => {
      const gone = week(start).map((d) => away(BUSY, li.dataset.who, d)).find(Boolean);
      li.classList.toggle("clash", Boolean(gone));
      li.querySelector("small").innerHTML = gone ? `Away <span class="nums">${gone[0] === gone[1] ? gone[0] : `${gone[0]}–${gone[1]}`}</span>` : ok("Free");
    });
    root.querySelectorAll(".dial-bars span").forEach((el) => el.classList.toggle("in", Number(el.dataset.d) >= start && Number(el.dataset.d) <= start + 7));
    input.setAttribute("aria-valuetext", `${span(start)}, ${6 - out.length} of 6 free`);
    say(all);
  }
  const stopAuto = () => s.clear();
  input.addEventListener("pointerdown", stopAuto);
  input.addEventListener("keydown", (e) => { stopAuto(); e.stopPropagation(); });
  input.addEventListener("input", () => apply(Number(input.value)));
  root.querySelector(".dial-top").addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    stopAuto();
    input.value = clamp(shown + Number(b.dataset.go), 1, 23);
    apply(Number(input.value));
  });

  input.value = reduced ? 12 : 1;
  apply(Number(input.value));
  if (!reduced) s.loop((t) => {
    const u = clamp((t - 0.8) / 3.6);
    const pos = 1 + 11 * ease(u);
    input.value = Math.round(pos);
    apply(u < 1 ? pos : 12);
    return u < 1;
  });
  return { stop() { s.clear(); } };
}

// ── J2: your days ──────────────────────────────────────────────────────────
// Two weeks are free for all six, 10–17 and 21–28, so one busy day of yours moves the week and it still fits.
const BUSY2 = { Priya: [[1, 4], [18, 19]], Sam: [[6, 9], [29, 30]], Jo: [[1, 2], [8, 9], [19, 20]], Alex: [[4, 6], [18, 18], [29, 30]], Maya: [[7, 9], [20, 20], [30, 30]], Kit: [[2, 3], [18, 20], [29, 29]] };
const YOU = { name: "You" };

export function renderYours(stage) {
  const everyone = [...group, YOU];
  const table = { ...BUSY2, You: [] };
  const mine = new Set();
  stage.innerHTML = `<div class="hero hero-j2">
    ${head(WORD)}
    <div class="board-wrap"><div class="board yours wait" style="--rows:7">
      <div class="b-names"><span class="k">Sept</span>${group.map((p) => `<span class="b-name" data-who="${p.name}">${face(p, 24)}<b>${p.name}</b></span>`).join("")}<span class="b-name me" data-who="You"><span class="avatar v-me">You</span><b>You</b></span></div>
      <div class="b-days">
        <div class="b-row b-head">${DAYS.map((d) => `<span class="${d % 7 === 5 || d === 1 ? "sun" : ""}"><i>${DAY[d % 7][0]}</i>${d}</span>`).join("")}</div>
        ${group.map((p, r) => `<div class="b-row" style="--r:${r}">${DAYS.map((d) => `<span class="cell${away(BUSY2, p.name, d) ? ` busy who-${p.tone}` : ""}"></span>`).join("")}</div>`).join("")}
        <div class="b-row mine">${DAYS.map((d) => `<button type="button" class="cell" data-d="${d}" aria-pressed="false" aria-label="${d} September, busy"></button>`).join("")}</div>
        <div class="b-frame"><span class="b-label" id="label"></span></div>
        ${nights}
      </div>
      <p class="b-hint">Tap the days you can&rsquo;t do. The week moves.</p>
    </div></div>
  </div>`;
  const root = stage.firstElementChild;
  const board = root.querySelector(".board");
  const you = root.querySelector(".b-row.mine");
  const say = sayer(root);
  const s = scene();
  let mode = null;

  function find() {
    table.You = [...mine].map((d) => [d, d]);
    let top = { start: 1, out: everyone };
    for (let start = 1; start <= 23; start++) {
      const out = clash(table, everyone, start);
      if (out.length < top.out.length) top = { start, out };
    }
    const all = top.out.length === 0;
    board.style.setProperty("--at", top.start);
    board.classList.toggle("found", all);
    root.querySelectorAll(".b-name").forEach((el) => el.classList.toggle("clash", top.out.some((p) => p.name === el.dataset.who)));
    root.querySelector("#label").innerHTML = `<b class="nums">${span(top.start)}</b>${all ? ok("All 7 free") : `<em>${7 - top.out.length} of 7 free</em>`}`;
    say(all && !board.classList.contains("wait"));
  }
  function set(d, busy) {
    if (mine.has(d) === busy) return;
    if (busy) mine.add(d); else mine.delete(d);
    const cell = you.children[d - 1];
    cell.classList.toggle("busy", busy);
    cell.setAttribute("aria-pressed", String(busy));
    find();
  }
  const land = () => { board.classList.remove("wait"); find(); };
  const take = () => { s.clear(); land(); };
  const dayAt = (e) => { const box = you.getBoundingClientRect(); return clamp(Math.floor(((e.clientX - box.left) / box.width) * 30) + 1, 1, 30); };
  you.addEventListener("pointerdown", (e) => { take(); const d = dayAt(e); mode = !mine.has(d); set(d, mode); you.setPointerCapture(e.pointerId); });
  you.addEventListener("pointermove", (e) => { if (mode !== null) set(dayAt(e), mode); });
  you.addEventListener("pointerup", () => { mode = null; });
  you.addEventListener("pointercancel", () => { mode = null; });
  you.addEventListener("click", (e) => { if (e.detail !== 0) return; take(); const d = Number(e.target.dataset.d); if (d) set(d, !mine.has(d)); });

  // One clock: the six answer, the week lands on the first one that fits, then two of your days push it to the next.
  find();
  s.at(1500, land);
  s.at(3100, () => set(13, true));
  s.at(3360, () => set(14, true));
  return { stop() { s.clear(); } };
}

// ── J3: the calendar ───────────────────────────────────────────────────────
const STOPS = [["Palermo", "yellow"], ["Palermo", "yellow"], ["Cefalù", "blue"], ["Taormina", "red"], ["Taormina", "red"], ["Syracuse", "green"], ["Syracuse", "green"], ["Home", "sheet"]];

export function renderCalendar(stage) {
  stage.innerHTML = `<div class="hero hero-i hero-j3">
    <div class="i-words">
      <h1>Trip planning, <span id="word"></span></h1>
      <p class="lede">${LEDE}</p>
      ${CTA}
    </div>
    <div class="mcal">
      <div class="cal-top">
        <b>September</b>
        <span class="cal-state" id="label" aria-live="polite"></span>
        <span class="cal-steps"><button type="button" data-go="-1" aria-label="A day earlier">${ico("back")}</button><button type="button" data-go="1" aria-label="A day later">${ico("arrow")}</button></span>
      </div>
      <div class="cal-grid">
        ${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<span class="cal-dow k">${d}</span>`).join("")}
        <span></span><span></span>
        ${DAYS.map((d) => `<button type="button" class="cal-day" data-d="${d}" aria-label="Start the week on ${d} September"><span class="nums">${d}</span><span class="cal-dots">${group.filter((p) => away(BUSY, p.name, d)).map((p) => `<i class="who-${p.tone}"></i>`).join("")}</span><span class="cal-stop"></span></button>`).join("")}
      </div>
      <ul class="cal-who">${group.map((p) => `<li data-who="${p.name}">${face(p, 22)}<b>${p.name}</b></li>`).join("")}<li class="cal-key"><i></i>Busy</li></ul>
    </div>
  </div>`;
  const root = stage.firstElementChild;
  const cal = root.querySelector(".mcal");
  const grid = root.querySelector(".cal-grid");
  const cells = [...root.querySelectorAll(".cal-day")];
  const say = sayer(root);
  const s = scene();
  let at = 0;
  let grab = null;

  function apply(start) {
    start = clamp(start, 1, 23);
    if (start === at) return;
    at = start;
    const out = clash(BUSY, group, start);
    const all = out.length === 0;
    cal.classList.toggle("found", all);
    cells.forEach((c, i) => {
      const k = i + 1 - start;
      const inside = k >= 0 && k <= 7;
      c.className = `cal-day${inside ? " in" : ""}${k === 0 ? " begin" : ""}${k === 7 ? " end" : ""}${inside && all ? ` c-${STOPS[k][1]}` : ""}`;
      c.style.setProperty("--k", inside ? k : 0);
      c.querySelector(".cal-stop").textContent = inside && all && (k === 0 || STOPS[k][0] !== STOPS[k - 1][0]) ? STOPS[k][0] : "";
    });
    root.querySelectorAll("[data-who]").forEach((li) => li.classList.toggle("clash", out.some((p) => p.name === li.dataset.who)));
    root.querySelector("#label").innerHTML = `<b class="nums">${span(start)}</b>${all ? ok("All 6 free") : `<em>${6 - out.length} of 6 free</em>`}`;
    say(all);
  }
  const dayAt = (e) => Number(document.elementFromPoint(e.clientX, e.clientY)?.closest(".cal-day")?.dataset.d || 0);
  grid.addEventListener("pointerdown", (e) => {
    const d = dayAt(e);
    if (!d) return;
    s.clear();
    if (d < at || d > at + 7) apply(d);
    grab = d - at;
    grid.setPointerCapture(e.pointerId);
  });
  grid.addEventListener("pointermove", (e) => { const d = grab === null ? 0 : dayAt(e); if (d) apply(d - grab); });
  grid.addEventListener("pointerup", () => { grab = null; });
  grid.addEventListener("pointercancel", () => { grab = null; });
  grid.addEventListener("click", (e) => { if (e.detail !== 0) return; s.clear(); const d = Number(e.target.closest(".cal-day")?.dataset.d || 0); if (d) apply(d); });
  cal.addEventListener("keydown", (e) => {
    const by = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!by) return;
    e.preventDefault(); e.stopPropagation(); s.clear();
    apply(at + by);
  });
  root.querySelector(".cal-steps").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) { s.clear(); apply(at + Number(b.dataset.go)); } });

  apply(reduced ? 12 : 1);
  if (!reduced) s.loop((t) => {
    const u = clamp((t - 0.8) / 3.4);
    apply(Math.round(1 + 11 * ease(u)));
    return u < 1;
  });
  return { stop() { s.clear(); } };
}
