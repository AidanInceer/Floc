// Round 3: I the globe, J find the week, K the lens.
import { ico, group, face, head, scene, reduced, clamp, ease } from "./kit.js";

export const LEDE = `Keep the destination, dates, route and costs in one place. Plan on your own, or with everyone who&rsquo;s coming.`;
export const CTA = `<div class="cta"><a class="pill-btn big" href="#">Start a trip — free</a><a class="pill-btn ghost big" href="#">See example trips</a></div>`;
export const ok = (word) => `<em class="ok">${ico("check")} ${word}</em>`;
export const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// ── I: the globe ───────────────────────────────────────────────────────────
// The six Explore listings the landing page already shows, from @floc/core preset trips.
export const HOME = { lat: 51.507, lng: -0.128 };
export const TRIPS = [
  { country: "Japan", title: "Tokyo to Osaka", nights: 10, from: "£1,850", lat: 35.676, lng: 139.65, tone: "red" },
  { country: "Spain", title: "Andalusian road trip", nights: 6, from: "€580", lat: 37.389, lng: -5.984, tone: "yellow" },
  { country: "Iceland", title: "Iceland ring road", nights: 7, from: "£1,420", lat: 64.146, lng: -21.942, tone: "blue" },
  { country: "Morocco", title: "Atlas mountains and Sahara", nights: 8, from: "£895", lat: 31.63, lng: -7.989, tone: "green" },
  { country: "Vietnam", title: "Vietnam north to south", nights: 12, from: "£1,320", lat: 21.028, lng: 105.804, tone: "red" },
  { country: "New Zealand", title: "South Island campervan", nights: 14, from: "£3,100", lat: -43.532, lng: 172.636, tone: "blue" },
];
export const RAD = Math.PI / 180;
let world = null;

const unit = ({ lat, lng }) => [Math.cos(lat * RAD) * Math.cos(lng * RAD), Math.cos(lat * RAD) * Math.sin(lng * RAD), Math.sin(lat * RAD)];
export function arc(a, b, n = 72) {
  const [p, q] = [unit(a), unit(b)];
  const w = Math.acos(clamp(p[0] * q[0] + p[1] * q[1] + p[2] * q[2], -1, 1));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const [s0, s1] = [Math.sin((1 - t) * w) / Math.sin(w), Math.sin(t * w) / Math.sin(w)];
    const v = [0, 1, 2].map((k) => s0 * p[k] + s1 * q[k]);
    return { lat: Math.asin(v[2]) / RAD, lng: Math.atan2(v[1], v[0]) / RAD };
  });
}

export function renderGlobe(stage) {
  stage.innerHTML = `<div class="hero hero-i">
    <div class="i-words">
      <h1>Trip planning, <span>sorted.</span></h1>
      <p class="lede">${LEDE}</p>
      ${CTA}
    </div>
    <div class="globe">
      <canvas aria-label="A globe. Drag to turn it." role="img"></canvas>
      <div class="g-card" aria-live="polite"></div>
    </div>
  </div>`;
  const root = stage.firstElementChild;
  const canvas = root.querySelector("canvas");
  const card = root.querySelector(".g-card");
  const ctx = canvas.getContext("2d");
  const s = scene();
  let live = true;
  let at = 0;
  let view = { lng: 20, lat: 30 };
  let from = { ...view };
  let turn = 1;
  let turned = performance.now();
  let auto = !reduced && innerWidth > 700;
  let drag = null;

  const project = (p, R, c) => {
    const [l, f, f0] = [(p.lng - view.lng) * RAD, p.lat * RAD, view.lat * RAD];
    let x = Math.cos(f) * Math.sin(l);
    let y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l);
    const z = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
    if (z < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; }
    return [c + R * x, c - R * y, z];
  };

  function draw() {
    const size = canvas.clientWidth;
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== size * dpr) canvas.width = canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const [R, c] = [size / 2 - 2, size / 2];
    ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fillStyle = token("--pastel-blue"); ctx.fill();
    if (world) {
      ctx.fillStyle = token("--sheet"); ctx.strokeStyle = token("--pastel-blue-edge"); ctx.lineWidth = 0.8;
      // Why: one path for every country lets overlapping rings cancel each other out at the globe's edge.
      for (const ring of world) {
        const pts = ring.map((pt) => project({ lng: pt[0], lat: pt[1] }, R, c));
        // Why: a hidden point is kept only beside a visible one, pinned to the edge; a ring pinned all the way round would paint the whole disc.
        const seen = pts.filter((q, i) => q[2] >= 0 || pts[(i + 1) % pts.length][2] >= 0 || pts[(i + pts.length - 1) % pts.length][2] >= 0);
        if (seen.length < 3) continue;
        ctx.beginPath();
        seen.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    const pen = token("--pen");
    const trip = TRIPS[at];
    const path = arc(HOME, trip);
    const shown = Math.ceil(path.length * ease(clamp((turn - 0.25) / 0.75)));
    ctx.setLineDash([5, 6]); ctx.lineWidth = 1.8; ctx.strokeStyle = pen; ctx.lineCap = "round"; ctx.beginPath();
    let down = false;
    path.slice(0, shown).forEach((p) => { const [x, y, z] = project(p, R, c); if (z < 0) { down = false; return; } if (down) ctx.lineTo(x, y); else ctx.moveTo(x, y); down = true; });
    ctx.stroke(); ctx.setLineDash([]);
    const pin = (p, r, active) => {
      const [x, y, z] = project(p, R, c);
      if (z < 0.05) return;
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fillStyle = token("--sheet"); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = active ? pen : token("--pastel-blue-edge"); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = pen; ctx.stroke();
    };
    TRIPS.forEach((t, i) => i !== at && pin(t, 4, false));
    pin(HOME, 4, true);
    pin(trip, 7, true);
  }

  function show(i) {
    at = (i + TRIPS.length) % TRIPS.length;
    const t = TRIPS[at];
    from = { ...view };
    turn = reduced ? 1 : 0;
    turned = performance.now();
    card.innerHTML = `<div class="roll-in">
      <span class="k">${t.country} · ${t.nights} nights</span>
      <b>${t.title}</b>
      <span class="g-from nums">from ${t.from}</span>
      <a class="pill-btn" href="#">Start from <span class="g-tone c-${t.tone}">${t.country}</span> ${ico("arrow")}</a>
    </div>
    <div class="g-pager"><button type="button" data-go="-1" aria-label="Previous trip">${ico("back")}</button><span class="nums">${at + 1} of ${TRIPS.length}</span><button type="button" data-go="1" aria-label="Next trip">${ico("arrow")}</button></div>`;
  }

  // One clock: the globe turns to the place, the route from London draws as it arrives, then the tour moves on.
  const frame = () => {
    if (!live) return;
    const now = performance.now();
    if (!drag && turn < 1) {
      turn = clamp((now - turned) / 1500);
      const t = TRIPS[at];
      const e = ease(turn);
      const mid = { lng: t.lng - 18, lat: clamp(t.lat * 0.75 + 8, -50, 55) };
      view = { lng: from.lng + ((((mid.lng - from.lng) % 360) + 540) % 360 - 180) * e, lat: from.lat + (mid.lat - from.lat) * e };
    }
    if (auto && turn === 1 && now - turned > 3600) {
      if (at === TRIPS.length - 1) auto = false;
      show(at + 1);
    }
    draw();
    requestAnimationFrame(frame);
  };

  card.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b) { auto = false; show(at + Number(b.dataset.go)); }
  });
  canvas.addEventListener("pointerdown", (e) => { auto = false; turn = 1; drag = { x: e.clientX, y: e.clientY, ...view }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const k = 140 / canvas.clientWidth;
    view = { lng: drag.lng - (e.clientX - drag.x) * k, lat: clamp(drag.lat + (e.clientY - drag.y) * k, -70, 70) };
  });
  canvas.addEventListener("pointerup", () => { drag = null; });

  show(0);
  fetch("world.geojson").then((r) => r.json()).then((geo) => {
    world = geo.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates[0]] : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.map((poly) => poly[0]) : []));
  });
  requestAnimationFrame(frame);
  return { stop() { live = false; s.clear(); } };
}

// ── J: find the week ───────────────────────────────────────────────────────
const BUSY = { Priya: [[1, 4], [22, 26]], Sam: [[8, 10], [21, 23]], Jo: [[3, 7], [20, 21], [28, 30]], Alex: [[9, 11], [24, 27]], Maya: [[1, 2], [6, 8], [20, 24]], Kit: [[5, 6], [10, 11], [26, 30]] };
export const DAY = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
export const NIGHTS = [["Palermo", 2], ["Cefalù", 1], ["Taormina", 2], ["Syracuse", 2]];
const busyOn = (name, d) => BUSY[name].some(([a, b]) => d >= a && d <= b);

export function renderWeek(stage) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  stage.innerHTML = `<div class="hero hero-j">
    ${head(`<span class="hl">Trip planning,</span> <span class="hl" id="word"><span class="roll">taking shape.</span></span>`)}
    <div class="board-wrap"><div class="board">
      <div class="b-names"><span class="k">Sept</span>${group.map((p) => `<span class="b-name" data-who="${p.name}">${face(p, 24)}<b>${p.name}</b></span>`).join("")}<span class="b-legend"><i></i>Busy</span></div>
      <div class="b-days">
        <div class="b-row b-head">${days.map((d) => `<span class="${d % 7 === 5 ? "sun" : ""}${d === 1 ? " sun" : ""}"><i>${DAY[d % 7][0]}</i>${d}</span>`).join("")}</div>
        ${group.map((p) => `<div class="b-row">${days.map((d) => `<span class="cell${busyOn(p.name, d) ? ` busy who-${p.tone}` : ""}"></span>`).join("")}</div>`).join("")}
        <div class="b-frame"><span class="b-label" id="label"></span></div>
        <div class="b-nights">${NIGHTS.map(([n, k]) => `<span style="flex:${k}"><i></i><b>${n}</b><small class="nums">${k}n</small></span>`).join("")}</div>
        <input type="range" min="1" max="23" value="1" aria-label="Move the week">
      </div>
    </div></div>
  </div>`;
  const root = stage.firstElementChild;
  const board = root.querySelector(".board");
  const input = root.querySelector("input");
  const word = root.querySelector("#word");
  const s = scene();
  let said = "";

  function apply(pos) {
    const start = Math.round(pos);
    board.style.setProperty("--at", pos.toFixed(3));
    const clash = group.filter((p) => days.slice(start - 1, start + 7).some((d) => busyOn(p.name, d)));
    const free = group.length - clash.length;
    const all = free === group.length;
    board.classList.toggle("found", all);
    root.querySelectorAll(".b-name").forEach((el) => el.classList.toggle("clash", clash.some((p) => p.name === el.dataset.who)));
    const text = `${DAY[start % 7]} ${start} – ${DAY[(start + 7) % 7]} ${start + 7} Sep`;
    root.querySelector("#label").innerHTML = `<b class="nums">${text}</b>${all ? ok("All 6 free") : `<em>${free} of 6 free</em>`}`;
    input.setAttribute("aria-valuetext", `${text}, ${free} of 6 free`);
    const now = all ? "sorted." : "taking shape.";
    if (now !== said) { said = now; word.innerHTML = `<span class="roll">${now}</span>`; }
  }
  const stopAuto = () => s.clear();
  input.addEventListener("pointerdown", stopAuto);
  input.addEventListener("keydown", stopAuto);
  input.addEventListener("input", () => apply(Number(input.value)));

  apply(reduced ? 12 : 1);
  input.value = reduced ? 12 : 1;
  if (!reduced) s.loop((t) => {
    const u = clamp((t - 0.8) / 3.4);
    const pos = 1 + 11 * ease(u);
    input.value = Math.round(pos);
    apply(u < 1 ? pos : 12);
    return u < 1;
  });
  return { stop() { s.clear(); } };
}

// ── K: the lens ────────────────────────────────────────────────────────────
const WALL = [
  ["Jo", "so where are we actually going", "yellow", "Where to", "Sicily", "All 6 voted"],
  ["Kit", "which weekend was it again??", "blue", "When", "12–19 Sep", "All 6 free"],
  ["Sam", "i sent a link last week somewhere", "sheet", "Notes", "Villa shortlist", "3 links kept"],
  ["Alex", "who paid for the flat", "green", "Flat, Palermo", "£960.00", "Priya paid"],
  ["Jo", "do i owe you or do you owe me", "green", "Jo owes Priya", "£42.50", "Worked out"],
  ["Maya", "is anyone bringing a speaker", "red", "Packing", "Speaker", "Sam has it"],
  ["Kit", "what time is the train", "blue", "Tue 14 Sep", "Train, 10:12", "To Cefalù"],
  ["Priya", "where is the booking pdf", "red", "Files", "Booking, PDF", "On the trip"],
  ["Sam", "are we doing taormina or not", "yellow", "Route", "4 stops", "7 nights"],
];
const who = (name) => group.find((p) => p.name === name);

export function renderLens(stage) {
  stage.innerHTML = `<div class="hero hero-k">
    ${head(`<span class="hl">Trip planning,</span> <span class="hl">sorted.</span>`)}
    <div class="wall-wrap">
      <div class="wall">
        <div class="wall-layer noise" aria-hidden="true">${WALL.map(([name, text], i) => `<div class="w-item" style="--r:${[-5, 3, -2, 4, -4, 2, 5, -3, 3][i]}deg">${face(who(name), 22)}<p>${text}</p></div>`).join("")}</div>
        <div class="wall-layer plan" role="img" aria-label="The same nine questions, answered on the trip">${WALL.map(([, , tone, k, b, st]) => `<div class="w-item"><div class="w-chip c-${tone}"><span class="k">${k}</span><b>${b}</b>${ok(st)}</div></div>`).join("")}</div>
        <span class="lens" aria-hidden="true"><i>floc<u>.</u></i></span>
      </div>
      <button type="button" class="btn lens-all" aria-pressed="false">Sort the lot</button>
    </div>
  </div>`;
  const root = stage.firstElementChild;
  const wall = root.querySelector(".wall");
  const all = root.querySelector(".lens-all");
  const s = scene();
  let auto = true;

  const move = (x, y) => { wall.style.setProperty("--x", `${x}px`); wall.style.setProperty("--y", `${y}px`); };
  const onPointer = (e) => {
    auto = false;
    const box = wall.getBoundingClientRect();
    move(clamp(e.clientX - box.left, 0, box.width), clamp(e.clientY - box.top, 0, box.height));
  };
  wall.addEventListener("pointermove", onPointer);
  wall.addEventListener("pointerdown", onPointer);
  all.addEventListener("click", () => {
    const on = !wall.classList.contains("open");
    wall.classList.toggle("open", on);
    all.textContent = on ? "Back to the chat" : "Sort the lot";
    all.setAttribute("aria-pressed", String(on));
  });

  const rest = () => move(wall.clientWidth * 0.5, wall.clientHeight * 0.5);
  rest();
  // The lens wanders once across the wall, then waits where the pointer leaves it.
  if (!reduced) s.loop((t) => {
    if (!auto) return false;
    const u = clamp((t - 0.6) / 4.2);
    const a = ease(u) * Math.PI * 2;
    move(wall.clientWidth * (0.5 - 0.33 * Math.sin(a)), wall.clientHeight * (0.5 - 0.3 * Math.sin(a * 2)));
    return u < 1;
  });
  return { stop() { s.clear(); } };
}
