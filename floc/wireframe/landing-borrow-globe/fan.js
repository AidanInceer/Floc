// C: the Borrow band as it was on the live homepage before the globe (G2 of /landing-borrow). Built by _shots/fan.py.
import { ico } from "/_house/switcher.js";

let band = null;

// Real listings from @floc/core preset trips, in the landing page's order.
const B = (p, n, lat, lng) => ({ p, n, lat, lng });
const H = (m, t) => ({ m, t });
const TRIPS = [
  { place: "Japan", title: "Japan in ten days", nights: 10, price: 185000,
    legs: [B("Tokyo", 4, 35.676, 139.65), H("train", "1h 30"), B("Hakone", 1, 35.233, 139.107), H("train", "2h 20"), B("Kyoto", 3, 35.011, 135.768), H("train", "30 min"), B("Osaka", 2, 34.694, 135.502)] },
  { place: "Spain", title: "Andalusian road trip", nights: 6, price: 58000,
    legs: [B("Seville", 2, 37.389, -5.984), H("car", "1h 30"), B("Córdoba", 1, 37.888, -4.779), H("car", "2h 15"), B("Granada", 3, 37.177, -3.598)] },
  { place: "Iceland", title: "Iceland ring road", nights: 7, price: 142000,
    legs: [B("Reykjavík", 1, 64.146, -21.942), H("car", "3h"), B("Vík", 1, 63.418, -19.006), B("Höfn", 2, 64.256, -15.208), H("car", "4h"), B("Mývatn", 2, 65.603, -16.996), B("Snæfellsnes", 1, 64.912, -23.283)] },
  { place: "Morocco", title: "Atlas mountains and Sahara", nights: 8, price: 89500,
    legs: [B("Marrakech", 3, 31.63, -7.989), H("car", "2h"), B("Imlil", 2, 31.136, -7.919), H("car", "5h"), B("Dades gorge", 2, 31.363, -5.885), B("Erg Chebbi camp", 1, 31.099, -3.976)] },
  { place: "Vietnam", title: "Vietnam, north to south", nights: 12, price: 132000, mapPadY: 20,
    legs: [B("Hanoi", 3, 21.028, 105.804), B("Lan Ha bay", 1, 20.79, 107.09), H("train", "overnight"), B("Hội An", 4, 15.88, 108.338), H("flight", "1h 20"), B("Ho Chi Minh City", 2, 10.823, 106.629), B("Mekong delta", 2, 10.036, 105.788)] },
  { place: "New Zealand", title: "South Island campervan loop", nights: 14, price: 310000,
    legs: [B("Christchurch", 1, -43.532, 172.636), H("car", "4h 30"), B("Franz Josef", 3, -43.389, 170.183), B("Wanaka", 2, -44.7, 169.144), B("Queenstown", 4, -45.031, 168.662), H("car", "4h"), B("Te Anau", 2, -45.414, 167.718), B("Aoraki / Mount Cook", 2, -43.595, 170.142)] },
];


const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let timers = [];
let offs = [];
const clear = () => { timers.forEach(clearTimeout); timers = []; offs.forEach((f) => f()); offs = []; };
const listen = (el, type, fn) => { el.addEventListener(type, fn); offs.push(() => el.removeEventListener(type, fn)); };

const bases = (t) => t.legs.filter((l) => l.p);
const money = (m) => "£" + (m / 100).toLocaleString("en-GB");
const nights = (n) => `${n} ${n === 1 ? "night" : "nights"}`;
const WORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen"];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const svg = (body) => `<svg class="ico" viewBox="0 0 14 14" aria-hidden="true">${body}</svg>`;
const CAR = svg(`<path d="M2 9.6V7.3l1.4-3a1 1 0 0 1 .9-.6h5.4a1 1 0 0 1 .9.6l1.4 3v2.3Z"/><path d="M2 7.3h10"/><circle cx="4.4" cy="10.4" r=".9"/><circle cx="9.6" cy="10.4" r=".9"/>`);
const CHEV = svg(`<path d="M4.2 5.6 7 8.4l2.8-2.8"/>`);
const MODE_ICO = { train: ico("train"), flight: ico("flight"), car: CAR };
const MODE_WORD = { train: "Train", flight: "Fly", car: "Drive" };
const MODE_BY = { train: "train", flight: "plane", car: "car" };

const cta = (t) => `<a class="pill-btn" href="#">Start from ${t.place} ${ico("arrow")}</a>`;
const more = `<a class="pill-btn ghost" href="#">See every trip</a>`;

function swap(el, text) {
  el.textContent = text;
  el.classList.remove("swap");
  void el.offsetWidth;
  el.classList.add("swap");
}

function curve(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2 - (y1 - y0) * 0.16, cy = (y0 + y1) / 2 + (x1 - x0) * 0.16;
    d += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

// ── Nights laid end to end, shared by B, G and I ──────────────────────────
// compact: hop shows its icon only and nights shrink to "4n", for card widths.
function nightsBar(t, compact = false) {
  let from = 0;
  let hop = null;
  const segs = [];
  t.legs.forEach((l) => {
    if (!l.p) { hop = l; return; }
    const hopText = hop ? (compact ? MODE_ICO[hop.m] : `${MODE_ICO[hop.m]}${hop.t}`) : "";
    segs.push(`<li class="b-seg" style="flex:${l.n};--n:${l.n};--from:${(from / t.nights).toFixed(3)};--len:${(l.n / t.nights).toFixed(3)}">
      <span class="b-hop"${hop ? ` title="${MODE_WORD[hop.m]} · ${hop.t}"` : ""}>${hopText}</span>
      <span class="b-bar"><i></i></span>
      <b title="${l.p}">${l.p}</b><span class="nums">${compact ? `${l.n}n` : nights(l.n)}</span></li>`);
    from += l.n;
    hop = null;
  });
  return `<ol class="b-line${compact ? " compact" : ""}">${segs.join("")}</ol>`;
}

// ── A fixed crop of the real map: OSM raster tiles, same source and paper filter as the app ──
const TILE = 256;
const MAX_Z = 9;
function mercator(lat, lng, z) {
  const size = TILE * 2 ** z;
  const s = Math.sin((lat * Math.PI) / 180);
  return [((lng + 180) / 360) * size, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * size];
}
// mapPadY: a tall, thin route (Vietnam) earns a whole zoom level by giving up some top and bottom margin.
function tileMap(t, key, w, h, pad = 34) {
  const padY = t.mapPadY ?? pad;
  const st = bases(t);
  let z = MAX_Z;
  for (; z > 1; z--) {
    const pts = st.map((b) => mercator(b.lat, b.lng, z));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) <= w - 2 * pad && Math.max(...ys) - Math.min(...ys) <= h - 2 * padY) break;
  }
  const world = st.map((b) => mercator(b.lat, b.lng, z));
  const xs = world.map((p) => p[0]), ys = world.map((p) => p[1]);
  const ox = (Math.min(...xs) + Math.max(...xs)) / 2 - w / 2;
  const oy = (Math.min(...ys) + Math.max(...ys)) / 2 - h / 2;
  const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`;
  const tiles = [];
  for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + w) / TILE); tx++) {
    for (let ty = Math.floor(oy / TILE); ty <= Math.floor((oy + h) / TILE); ty++) {
      tiles.push(`<img alt="" loading="lazy" src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${ty}/${(tx + 2 ** z) % 2 ** z}" style="left:${pct(tx * TILE - ox, w)};top:${pct(ty * TILE - oy, h)};width:${pct(TILE, w)};height:${pct(TILE, h)}">`);
    }
  }
  const pts = world.map(([x, y]) => [x - ox, y - oy]);
  const d = curve(pts);
  const step = 0.9 / Math.max(st.length - 1, 1);
  const pins = pts.map(([x, y], i) => `<circle class="m-dot${i === 0 ? " first" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 0 ? 5.5 : 4.5}" style="--d:${(0.15 + i * step).toFixed(2)}s"/>`).join("");
  return `<div class="t-map" style="aspect-ratio:${w}/${h}">
    <div class="t-tiles" aria-hidden="true">${tiles.join("")}</div>
    <svg class="t-route" viewBox="0 0 ${w} ${h}" aria-hidden="true" data-pts="${JSON.stringify(pts.map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)]))}">
      <mask id="reveal-${key}" maskUnits="userSpaceOnUse"><path class="t-reveal" d="${d}"/></mask>
      <path class="t-line" d="${d}" mask="url(#reveal-${key})"/>${pins}
    </svg>
    <span class="t-credit">Tiles &copy; Esri</span>
  </div>`;
}

// ── G: D + B — the fan, each sheet carrying its nights bar ────────────────
function renderFanNights(real = false) {
  const n = TRIPS.length;
  let i = 0;
  band.innerHTML = `<section class="v-d v-g${real ? " v-g2" : ""}">
    <h2 class="band-title">Borrow a trip to <span class="word" data-word>${TRIPS[0].place}</span></h2>
    <p class="lede">A finished route to start from. Change anything.</p>
    <div class="d-stage">${TRIPS.map((t, k) => `<article class="d-card" data-i="${k}">
      <header><span class="typed">${t.place} · ${nights(t.nights)}</span><span class="nums">from ${money(t.price)}</span></header>
      <h3>${t.title}</h3>
      ${real ? tileMap(t, k, 424, 190) : `<div class="d-map">${routeMap(t, 420, 170, 30, false)}</div>`}
      ${nightsBar(t, true)}
    </article>`).join("")}</div>
    <div class="d-nav"><button type="button" data-step="-1" aria-label="Previous trip">${ico("back")}</button><span class="nums" data-count></span><button type="button" data-step="1" aria-label="Next trip">${ico("arrow")}</button></div>
    <div class="btns center" data-cta></div>
  </section>`;
  const root = band.firstElementChild;
  const cards = [...root.querySelectorAll(".d-card")];
  const place = () => {
    cards.forEach((c, k) => {
      const rel = (k - i + n) % n;
      c.dataset.pos = rel === 0 ? "front" : rel === 1 ? "right" : rel === n - 1 ? "left" : "back";
      c.setAttribute("aria-hidden", String(rel !== 0));
    });
    root.querySelector("[data-count]").textContent = `${i + 1} of ${n}`;
    root.querySelector("[data-cta]").innerHTML = cta(TRIPS[i]) + more;
    swap(root.querySelector("[data-word]"), TRIPS[i].place);
    if (real) cards.forEach((c, k) => (k === i ? journey.play(c) : journey.finish(c)));
    if (real) root.querySelector("[data-word]").dataset.tone = TONES[i % TONES.length];
  };
  const journey = syncedJourney();
  offs.push(journey.stop);
  root.querySelectorAll("[data-step]").forEach((b) => listen(b, "click", () => { i = (i + +b.dataset.step + n) % n; place(); }));
  cards.forEach((c) => listen(c, "click", () => {
    if (c.dataset.pos === "left" || c.dataset.pos === "right") { i = +c.dataset.i; place(); }
  }));
  place();
}

// The live band's four pastels, in its order.
const TONES = ["red", "yellow", "blue", "green"];

// ── G2's one clock: the bar fills night by night and the map line arrives
// at each stop the moment the bar reaches that stop's first night.
const JOURNEY_MS = 2600;
const easeInOut = (x) => 0.5 - Math.cos(Math.PI * x) / 2;
function syncedJourney() {
  let raf = 0;
  const parts = (card) => {
    const svgEl = card.querySelector(".t-route");
    const pts = JSON.parse(svgEl.dataset.pts);
    const segs = [...card.querySelectorAll(".b-seg")];
    const from = segs.map((s) => +s.style.getPropertyValue("--from"));
    const len = segs.map((s) => +s.style.getPropertyValue("--len"));
    const cum = [0];
    for (let k = 1; k < pts.length; k++) {
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      probe.setAttribute("d", curve([pts[k - 1], pts[k]]));
      svgEl.appendChild(probe);
      cum.push(cum[k - 1] + probe.getTotalLength());
      probe.remove();
    }
    return {
      from, len, cum, total: cum.at(-1),
      fills: segs.map((s) => s.querySelector(".b-bar i")),
      hops: segs.map((s) => s.querySelector(".b-hop")),
      dots: [...svgEl.querySelectorAll(".m-dot")],
      reveal: card.querySelector(".t-reveal"),
    };
  };
  const paint = (P, p) => {
    P.fills.forEach((f, k) => (f.style.transform = `scaleX(${Math.min(1, Math.max(0, (p - P.from[k]) / P.len[k]))})`));
    P.hops.forEach((h, k) => (h.style.opacity = p >= P.from[k] ? 1 : 0));
    P.dots.forEach((d, k) => (d.style.opacity = p >= P.from[k] ? 1 : 0));
    let drawn = P.total;
    for (let k = 0; k < P.from.length - 1; k++) {
      if (p < P.from[k + 1]) { drawn = P.cum[k] + (P.cum[k + 1] - P.cum[k]) * Math.max(0, (p - P.from[k]) / P.len[k]); break; }
    }
    P.reveal.style.strokeDasharray = `${P.total} ${P.total}`;
    P.reveal.style.strokeDashoffset = String(P.total - drawn);
  };
  return {
    play(card) {
      cancelAnimationFrame(raf);
      const P = parts(card);
      if (reduced) return paint(P, 1);
      paint(P, 0);
      const start = performance.now() + 200;
      const tick = (now) => {
        const x = Math.min(1, Math.max(0, (now - start) / JOURNEY_MS));
        paint(P, easeInOut(x));
        if (x < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    finish(card) { paint(parts(card), 1); },
    stop() { cancelAnimationFrame(raf); },
  };
}

/** The fan's own styles load only while it shows; their plain class names clash with the globe's. */
export function renderFan(stage) {
  const css = Object.assign(document.createElement("link"), { rel: "stylesheet", href: "/landing-borrow-globe/fan.css" });
  let live = true;
  stage.innerHTML = `<div class="page bw-fan"></div>`;
  band = stage.firstElementChild;
  css.onload = () => live && renderFanNights(true);
  document.head.append(css);
  return { stop() { live = false; clear(); css.remove(); } };
}
