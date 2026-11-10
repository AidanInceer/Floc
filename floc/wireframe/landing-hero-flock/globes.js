// Round 4, on I: I1 the horizon, I2 the vote, I3 the spin.
import { ico, group, face, head, scene, reduced, clamp, ease } from "./kit.js";
import { LEDE, CTA, ok, token, HOME, TRIPS, RAD, arc } from "./round3.js";

let land = null;
export const loadWorld = async () => land || fetch("/landing-hero-flock/world.geojson").then((r) => r.json()).then((geo) => {
  land = geo.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates[0]] : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.map((poly) => poly[0]) : []));
});
export const shortest = (d) => ((d % 360) + 540) % 360 - 180;
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);
export const facing = (t) => ({ lng: t.lng - 18, lat: clamp(t.lat * 0.75 + 8, -50, 55) });
const apart = (a, b) => Math.hypot(shortest(a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * RAD), a.lat - b.lat);
const tone = (t) => `<span class="g-tone c-${t.tone}">${t.country}</span>`;

/** Draws the paper globe on a canvas. `fit` places the sphere, so it can be larger than the canvas. */
export function painter(canvas, fit = (w, h) => ({ R: Math.min(w, h) / 2 - 2, cx: w / 2, cy: h / 2 })) {
  const ctx = canvas.getContext("2d");
  const g = { view: { lng: 20, lat: 30 }, R: 0, cx: 0, cy: 0, ctx };
  let pen = "";
  g.project = (p) => {
    const [l, f, f0] = [(p.lng - g.view.lng) * RAD, p.lat * RAD, g.view.lat * RAD];
    let x = Math.cos(f) * Math.sin(l);
    let y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l);
    const z = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
    if (z < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; }
    return [g.cx + g.R * x, g.cy - g.R * y, z];
  };
  g.base = () => {
    const [w, h] = [canvas.clientWidth, canvas.clientHeight];
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    Object.assign(g, fit(w, h));
    pen = token("--pen");
    const edge = token("--pastel-blue-edge");
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.R, 0, Math.PI * 2); ctx.fillStyle = token("--pastel-blue"); ctx.fill();
    if (land) {
      ctx.fillStyle = token("--sheet"); ctx.strokeStyle = edge; ctx.lineWidth = 0.8;
      // Why: land that runs behind the globe is cut where it crosses the edge and closed along the edge itself; joining the two crossing points with a straight line drew a flat side.
      const [f0, l0] = [g.view.lat * RAD, g.view.lng * RAD];
      const [s0, c0] = [Math.sin(f0), Math.cos(f0)];
      for (const ring of land) {
        let any = false;
        const pts = ring.map(([lng, lat]) => {
          const [l, f] = [lng * RAD - l0, lat * RAD];
          const cf = Math.cos(f), sf = Math.sin(f), cl = Math.cos(l);
          const z = s0 * sf + c0 * cf * cl;
          if (z >= 0) any = true;
          return [cf * Math.sin(l), c0 * sf - s0 * cf * cl, z];
        });
        if (!any) continue;
        const out = [];
        pts.forEach((q, k) => {
          const p = pts[(k + pts.length - 1) % pts.length];
          if (p[2] >= 0 !== q[2] >= 0) {
            const t = p[2] / (p[2] - q[2]);
            out.push({ a: Math.atan2(p[1] + (q[1] - p[1]) * t, p[0] + (q[0] - p[0]) * t) });
          }
          out.push(q[2] >= 0 ? { x: g.cx + g.R * q[0], y: g.cy - g.R * q[1] } : { a: Math.atan2(q[1], q[0]) });
        });
        ctx.beginPath();
        out.forEach((q, k) => {
          const p = out[(k + out.length - 1) % out.length];
          if (q.a === undefined) return k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
          if (k && p.a !== undefined) return ctx.arc(g.cx, g.cy, g.R, -p.a, -q.a, shortest((q.a - p.a) / RAD) > 0);
          const [x, y] = [g.cx + g.R * Math.cos(q.a), g.cy - g.R * Math.sin(q.a)];
          return k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.R, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.strokeStyle = edge; ctx.stroke();
  };
  g.route = (to, shown) => {
    const path = arc(HOME, to);
    ctx.setLineDash([5, 6]); ctx.lineWidth = 1.8; ctx.strokeStyle = pen; ctx.lineCap = "round"; ctx.beginPath();
    let down = false;
    path.slice(0, Math.ceil(path.length * shown)).forEach((p) => { const [x, y, z] = g.project(p); if (z < 0) { down = false; return; } if (down) ctx.lineTo(x, y); else ctx.moveTo(x, y); down = true; });
    ctx.stroke(); ctx.setLineDash([]);
  };
  g.pin = (p, r, active) => {
    const [x, y, z] = g.project(p);
    if (z < 0.05) return;
    ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fillStyle = token("--sheet"); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = active ? pen : token("--pastel-blue-edge"); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = pen; ctx.stroke();
  };
  return g;
}

/** Turns the globe from where it is to a view, on the scene's one clock. `u` is how far it has got. */
export function mover(g) {
  let from = { ...g.view }, by = { lng: 0, lat: 0 }, t0 = 0, dur = 0, curve = ease;
  const m = {
    u: 1,
    go(to, ms = 1500, turns = 0, fn = ease) {
      from = { ...g.view };
      by = { lng: shortest(to.lng - from.lng) + 360 * turns, lat: to.lat - from.lat };
      [t0, dur, curve, m.u] = [performance.now(), reduced ? 0 : ms, fn, 0];
    },
    step(now) {
      if (m.u >= 1) return;
      m.u = dur ? clamp((now - t0) / dur) : 1;
      const e = curve(m.u);
      g.view = { lng: from.lng + by.lng * e, lat: from.lat + by.lat * e };
    },
    stop() { m.u = 1; },
  };
  return m;
}

/** Drag to turn. Returns a getter for "is the pointer down". */
export function draggable(canvas, g, { start, end, range = [-70, 70] } = {}) {
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => { start?.(); drag = { x: e.clientX, y: e.clientY, ...g.view }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const k = 70 / g.R;
    g.view = { lng: drag.lng - (e.clientX - drag.x) * k, lat: clamp(drag.lat + (e.clientY - drag.y) * k, range[0], range[1]) };
  });
  const up = () => { if (drag) { drag = null; end?.(); } };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  return () => Boolean(drag);
}

/** The plane flies the whole route at the front of the line and lands on the pin. */
export function plane(g, to, shown, landing) {
  const path = arc(HOME, to);
  const i = Math.max(1, Math.round((path.length - 1) * shown));
  const [a, b] = [g.project(path[i - 1]), g.project(path[i])];
  if (shown <= 0.01 || landing >= 1 || b[2] < 0.05) return;
  const c = g.ctx;
  const k = 0.92 * (1 - 0.6 * landing);
  c.save();
  c.globalAlpha = 1 - landing;
  c.translate(b[0], b[1]);
  c.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
  c.scale(k, k); c.translate(-12, -12);
  c.lineJoin = "round"; c.lineWidth = 3; c.strokeStyle = token("--sheet"); c.stroke(PLANE);
  c.fillStyle = token("--pen"); c.fill(PLANE);
  c.restore();
}

// ── I1: the horizon ────────────────────────────────────────────────────────
// Why: the trip sits this far above the middle of the sphere, so it lands on the part of the dome that shows.
const RISE = 40;
// The plane the live hero flies behind its cards (landing/hero/flight.tsx), nose to the right.
const PLANE = new Path2D("M23 12c0-1-1-1.4-2-1.4h-6L9.5 3h-2l3 7.6H5L3.2 8H1.6l1 4-1 4h1.6L5 13.4h5.5l-3 7.6h2l5.5-7.6h6c1 0 2-.4 2-1.4Z");
const BELOW = new Set(["Morocco", "Vietnam"]);

/** `opts` lets another band reuse the scene: `head` and `after` are markup, `extra(trip)` adds to the card, `onShow(trip, root)` hears each change. The spin also takes `main`: a button that takes the centre, with "Start from" stepping to its right. */
export function renderHorizon(stage, opts = {}) {
  stage.innerHTML = `<div class="hero hero-i1">
    ${opts.head ?? head(`<span class="hl">Trip planning,</span> <span class="hl">sorted.</span>`)}
    <div class="hz">
      <canvas role="img" aria-label="The top of a globe. Drag to turn it."></canvas>
      <div class="hz-flags">${TRIPS.map((t, i) => `<button type="button" class="hz-flag${BELOW.has(t.country) ? " below" : ""}" data-i="${i}">${t.country}</button>`).join("")}</div>
      <div class="g-card hz-card" aria-live="polite"></div>
    </div>
    ${opts.after ?? ""}
  </div>`;
  const root = stage.firstElementChild;
  const canvas = root.querySelector("canvas");
  const card = root.querySelector(".hz-card");
  const flags = [...root.querySelectorAll(".hz-flag")];
  const g = painter(canvas, (w) => { const R = Math.max(w * 0.42, 250); return { R, cx: w / 2, cy: 16 + R }; });
  const m = mover(g);
  const s = scene();
  let at = 0;
  let auto = !reduced;
  let rested = performance.now();
  let takeoff = 0;
  const over = (t) => ({ lng: t.lng, lat: t.lat - RISE });
  g.view = { lng: 60, lat: -5 };

  function show(i) {
    at = (i + TRIPS.length) % TRIPS.length;
    const t = TRIPS[at];
    takeoff = 0;
    m.go(over(t), 1700);
    flags.forEach((f, k) => f.setAttribute("aria-current", String(k === at)));
    card.innerHTML = `<div class="roll-in">
      <span class="k">${t.country} · ${t.nights} nights</span>
      <b>${t.title}</b>
      <span class="g-from nums">from ${t.from}</span>
      ${opts.extra?.(t) ?? ""}
      <a class="pill-btn" href="#">Start from ${t.country} ${ico("arrow")}</a>
    </div>
    <div class="g-pager"><button type="button" data-go="-1" aria-label="Previous trip">${ico("back")}</button><span class="nums">${at + 1} of ${TRIPS.length}</span><button type="button" data-go="1" aria-label="Next trip">${ico("arrow")}</button></div>`;
    opts.onShow?.(t, root);
    place();
  }
  // The card steps to one side when another trip's pin would sit under it once the dome has turned.
  function place() {
    if (innerWidth <= 700) { card.style.translate = ""; return; }
    const [w, h, keep] = [canvas.clientWidth, canvas.clientHeight, g.view];
    g.view = over(TRIPS[at]);
    const pins = TRIPS.filter((_, i) => i !== at).map((t) => g.project(t)).filter((q) => q[2] > 0.2);
    g.view = keep;
    const top = h - 22 - card.offsetHeight;
    const room = Math.max(0, w / 2 - 165);
    const off = [0, 215, -215, 340, -340].map((o) => clamp(o, -room, room)).find((o) => !pins.some(([x, y]) => Math.abs(x - (w / 2 + o)) < 205 && y > top - 36)) ?? 0;
    card.style.translate = `${off}px 0`;
  }
  const down = draggable(canvas, g, { start() { auto = false; m.stop(); }, range: [-85, 60] });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go], [data-i]");
    if (!b) return;
    auto = false;
    show(b.dataset.go ? at + Number(b.dataset.go) : Number(b.dataset.i));
  });

  // One clock: the dome turns until the trip stands on top, the route from London comes over the edge, then the tour moves on.
  s.loop(() => {
    const now = performance.now();
    if (!down()) m.step(now);
    if (m.u < 1) rested = now;
    if (auto && now - rested > 3400) { if (at === TRIPS.length - 1) auto = false; show(at + 1); }
    g.base();
    // The flight starts as the dome settles, and takes longer the further the trip is.
    if (!takeoff && m.u > 0.6) takeoff = now;
    const u = reduced ? 1 : takeoff ? clamp((now - takeoff) / (880 + 11.2 * apart(HOME, TRIPS[at]))) : 0;
    const shown = ease(u);
    g.route(TRIPS[at], shown);
    TRIPS.forEach((t, i) => i !== at && g.pin(t, 4, false));
    g.pin(HOME, 4, true);
    g.pin(TRIPS[at], 7, true);
    plane(g, TRIPS[at], shown, clamp((u - 0.9) / 0.1));
    if (u < 1) rested = now;
    TRIPS.forEach((t, i) => {
      const [x, y, z] = g.project(t);
      flags[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      flags[i].style.opacity = clamp((z - 0.2) * 6);
      flags[i].style.pointerEvents = z > 0.3 ? "" : "none";
    });
  });
  g.base();
  show(0);
  loadWorld();
  return { stop() { s.clear(); } };
}

// ── I2: the vote ───────────────────────────────────────────────────────────
const PICKS = [0, 4, 5].map((i) => TRIPS[i]);
const VOTES = [0, 1, 2, 0, 2, 1];
const REST = { lng: 135, lat: 5 };
const WORDS = ["started.", "shared.", "taking shape.", "sorted."];
const ME = `<span class="avatar v-me">You</span>`;

export function renderVote(stage) {
  stage.innerHTML = `<div class="hero hero-i hero-i2">
    <div class="i-words">
      <h1>Trip planning, <span id="word"></span></h1>
      <p class="lede">${LEDE}</p>
      ${CTA}
    </div>
    <div class="globe">
      <canvas role="img" aria-label="A globe with three places the group is choosing between. Drag to turn it."></canvas>
      <div class="v-pins" aria-hidden="true">${PICKS.map(() => `<span class="v-pin avatar-row"></span>`).join("")}</div>
      <div class="g-card v-card">
        <span class="k">Where to · <span id="count"></span></span>
        <div class="v-rows">${PICKS.map((t, i) => `<button type="button" class="v-row" data-i="${i}" aria-pressed="false">${tone(t)}<span class="v-who avatar-row"></span><b class="nums">0</b></button>`).join("")}</div>
        <div class="v-foot" aria-live="polite"></div>
      </div>
    </div>
  </div>`;
  const root = stage.firstElementChild;
  const canvas = root.querySelector("canvas");
  const rows = [...root.querySelectorAll(".v-row")];
  const pins = [...root.querySelectorAll(".v-pin")];
  const foot = root.querySelector(".v-foot");
  const g = painter(canvas);
  const m = mover(g);
  const s = scene();
  const tally = PICKS.map(() => []);
  let mine = -1;
  let said = -1;
  g.view = { ...REST };

  const say = (i) => { if (i !== said) { said = i; root.querySelector("#word").innerHTML = `<span class="roll">${WORDS[i]}</span>`; } };
  function paint() {
    const cast = tally.reduce((n, list) => n + list.length, 0) + (mine >= 0 ? 1 : 0);
    root.querySelector("#count").textContent = `${cast} of 7 voted`;
    PICKS.forEach((t, i) => {
      const who = tally[i].map((p) => face(p, 20)).join("") + (mine === i ? ME : "");
      rows[i].querySelector(".v-who").innerHTML = who;
      rows[i].querySelector("b").textContent = tally[i].length + (mine === i ? 1 : 0);
      rows[i].classList.toggle("won", mine === i);
      rows[i].setAttribute("aria-pressed", String(mine === i));
      pins[i].innerHTML = who;
    });
  }
  function vote(k) {
    tally[VOTES[k]].push(group[k]);
    const t = PICKS[VOTES[k]];
    m.go({ lng: REST.lng + shortest(t.lng - REST.lng) * 0.3, lat: REST.lat + (t.lat - REST.lat) * 0.3 }, 620);
    say(1);
    paint();
  }
  function tie() {
    m.go(REST, 900);
    say(2);
    root.classList.add("open");
    foot.innerHTML = `<span class="v-ask roll">${ME} Your vote decides</span>`;
  }
  function settle(i) {
    if (!root.classList.contains("open")) return;
    mine = i;
    m.go(facing(PICKS[i]), 1400);
    say(3);
    paint();
    foot.innerHTML = `<span class="roll v-done">${ok("Settled")}<a class="pill-btn" href="#">Start from ${tone(PICKS[i])} ${ico("arrow")}</a></span>`;
  }
  root.querySelector(".v-rows").addEventListener("click", (e) => { const b = e.target.closest(".v-row"); if (b) settle(Number(b.dataset.i)); });
  const down = draggable(canvas, g, { start() { m.stop(); } });

  function spin() {
    s.loop(() => {
      if (!down()) m.step(performance.now());
      g.base();
      if (mine >= 0) g.route(PICKS[mine], ease(clamp((m.u - 0.25) / 0.75)));
      g.pin(HOME, 4, true);
      PICKS.forEach((t, i) => {
        g.pin(t, mine === i ? 8 : 6, mine < 0 || mine === i);
        const [x, y, z] = g.project(t);
        pins[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        pins[i].style.opacity = clamp((z - 0.1) * 6);
      });
    });
  }

  say(0);
  paint();
  VOTES.forEach((_, k) => s.at(1000 + k * 720, () => vote(k)));
  s.at(1000 + VOTES.length * 720 + 300, tie);
  spin();
  loadWorld();
  return { stop() { s.clear(); } };
}

// ── I3: the spin ───────────────────────────────────────────────────────────
export function renderSpin(stage, opts = {}) {
  const chip = (t, i) => `<li><button type="button" class="spin-chip" data-i="${i}">${tone(t)}<b>${t.title}</b><span class="nums">${t.nights} nights · from ${t.from}</span></button></li>`;
  stage.innerHTML = `<div class="hero hero-i3">
    ${opts.head ?? head(`<span class="hl">Trip planning,</span> <span class="hl">sorted.</span>`)}
    <div class="spin">
      <ul class="spin-list l">${TRIPS.slice(0, 3).map((t, i) => chip(t, i)).join("")}</ul>
      <div class="spin-globe globe"><canvas role="img" aria-label="A globe. Drag to turn it, or flick it to spin."></canvas></div>
      <ul class="spin-list r">${TRIPS.slice(3).map((t, i) => chip(t, i + 3)).join("")}</ul>
      ${opts.main
        ? `<div class="spin-bar tri" aria-live="polite"><button type="button" class="btn spin-go">Spin for me</button>${opts.main}<a class="pill-btn ghost spin-start" href="#"></a></div>`
        : `<div class="spin-bar" aria-live="polite"><button type="button" class="btn spin-go">Spin for me</button><a class="pill-btn spin-start" href="#"></a></div>`}
    </div>
  </div>`;
  const root = stage.firstElementChild;
  const canvas = root.querySelector("canvas");
  const chips = [...root.querySelectorAll(".spin-chip")];
  const start = root.querySelector(".spin-start");
  const g = painter(canvas);
  const m = mover(g);
  const s = scene();
  let at = 0;
  let lit = -1;
  let ticking = false;
  let coast = 0;
  let takeoff = 0;
  let last = { x: 0, t: 0 };
  let then = performance.now();
  g.view = { lng: 60, lat: 25 };

  const nearest = () => TRIPS.reduce((best, t, i) => (apart(g.view, facing(t)) < apart(g.view, facing(TRIPS[best])) ? i : best), 0);
  const light = (i) => {
    if (i === lit) return;
    lit = i;
    chips.forEach((c, k) => c.setAttribute("aria-current", String(k === i)));
    start.innerHTML = `Start from ${opts.main ? TRIPS[i].country : tone(TRIPS[i])} ${ico("arrow")}`;
    opts.onShow?.(TRIPS[i], root);
  };
  function show(i, ms = 1500, turns = 0, fn = ease) {
    at = i;
    coast = 0;
    takeoff = 0;
    ticking = turns > 0;
    m.go(facing(TRIPS[i]), ms, turns, fn);
    if (!turns) light(i);
  }
  const down = draggable(canvas, g, {
    start() { m.stop(); coast = 0; },
    end() {
      if (performance.now() - last.t > 80) coast = 0;
      coast = clamp(coast, -0.9, 0.9);
      if (Math.abs(coast) < 0.04 || reduced) show(nearest(), 700);
    },
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!down()) return;
    const now = performance.now();
    if (last.t && now > last.t) coast = coast * 0.6 + (-(e.clientX - last.x) * (70 / g.R) / (now - last.t)) * 0.4;
    last = { x: e.clientX, t: now };
  });
  canvas.addEventListener("pointerdown", (e) => { last = { x: e.clientX, t: 0 }; });
  root.querySelector(".spin").addEventListener("click", (e) => {
    const c = e.target.closest(".spin-chip");
    if (c) return show(Number(c.dataset.i));
    if (!e.target.closest(".spin-go")) return;
    const pick = (at + 1 + Math.floor(Math.random() * (TRIPS.length - 1))) % TRIPS.length;
    show(pick, 2800, 2, outCubic);
  });

  // One clock: a flick coasts and slows, the nearest trip takes it; the route from London draws once the globe is still.
  s.loop(() => {
    const now = performance.now();
    const dt = Math.min(50, now - then);
    then = now;
    if (!down()) {
      if (coast) {
        g.view = { ...g.view, lng: g.view.lng + coast * dt };
        coast *= Math.pow(0.94, dt / 16);
        if (Math.abs(coast) < 0.02) show(nearest(), 800);
      } else m.step(now);
    }
    light(coast || down() || (ticking && m.u < 1) ? nearest() : at);
    g.base();
    const still = !coast && !down();
    if (still && !takeoff && m.u > 0.75) takeoff = now;
    const u = reduced ? 1 : takeoff ? clamp((now - takeoff) / (880 + 11.2 * apart(HOME, TRIPS[at]))) : 0;
    if (still) g.route(TRIPS[at], ease(u));
    TRIPS.forEach((t, i) => i !== at && g.pin(t, 4, false));
    g.pin(HOME, 4, true);
    g.pin(TRIPS[at], 7, true);
    if (still) plane(g, TRIPS[at], ease(u), clamp((u - 0.9) / 0.1));
  });
  show(0);
  loadWorld();
  return { stop() { s.clear(); } };
}
