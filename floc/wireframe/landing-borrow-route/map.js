import { MODE_PATHS } from "./data.js";

const LINE = 1.9;
const EDGE = 7;
const MID_R = 4.4;
const MID_RING = 1.8;
const END_R = 6.5;
const END_RING = 2;
const OPEN_R = 3.6;
const ARC = { flight: 0.3, ferry: 0.2, train: 0.12, car: 0.12 };
const CLOSE = 2.1;
const PACE = 0.36;
const SLOW = 1.3;
const FLY_MS = 1000 * SLOW;
const BACK_MS = 1300 * SLOW;
const FOCUS_MS = 600;
const FADE_MS = 300;
const reduce = matchMedia("(prefers-reduced-motion: reduce)");

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (x) => (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2;
const merc = (lng, lat) => {
  const phi = (clamp(lat, -85, 85) * Math.PI) / 180;
  return [(lng + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2];
};

let landP;
function loadLand() {
  landP ??= fetch("/landing-hero-new/land-50m.json")
    .then((r) => r.json())
    .then((data) => {
      const out = [];
      for (const [iso, rings] of Object.entries(data)) {
        const path = new Path2D();
        const box = [Infinity, Infinity, -Infinity, -Infinity];
        for (const ring of rings) {
          let x = 0;
          let y = 0;
          for (let k = 0; k < ring.length; k += 2) {
            x += ring[k];
            y += ring[k + 1];
            const [mx, my] = merc(x / 100, y / 100);
            if (k) path.lineTo(mx, my);
            else path.moveTo(mx, my);
            box[0] = Math.min(box[0], mx);
            box[1] = Math.min(box[1], my);
            box[2] = Math.max(box[2], mx);
            box[3] = Math.max(box[3], my);
          }
          path.closePath();
        }
        out.push({ iso, path, box });
      }
      return out;
    });
  return landP;
}

const ICONS = Object.fromEntries(Object.entries(MODE_PATHS).map(([k, ds]) => [k, ds.map((d) => new Path2D(d))]));

function sample(fn, n) {
  const pts = [];
  for (let k = 0; k <= n; k++) pts.push(fn(k / n));
  return pts;
}
function withLengths(pts) {
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
function along(p, d) {
  const { pts, cum } = p;
  let k = 1;
  while (k < cum.length - 1 && cum[k] < d) k++;
  const span = cum[k] - cum[k - 1] || 1;
  const f = clamp((d - cum[k - 1]) / span, 0, 1);
  return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f, pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]];
}

function buildTrack(trip) {
  const P = trip.stops.map((s) => merc(s.lng, s.lat));
  const cen = P.reduce((a, p) => [a[0] + p[0] / P.length, a[1] + p[1] / P.length], [0, 0]);
  const xs = P.map((p) => p[0]);
  const ys = P.map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const unit = (v) => {
    const l = Math.hypot(v[0], v[1]);
    return l < 1e-9 ? null : [v[0] / l, v[1] / l];
  };
  const pieces = [];
  const stopAt = [];
  const outs = [];
  let at = 0;
  trip.stops.forEach((s, i) => {
    stopAt[i] = at;
    if (s.out) {
      const a = i > 0 ? unit([P[i - 1][0] - P[i][0], P[i - 1][1] - P[i][1]]) : null;
      const b = i < P.length - 1 ? unit([P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]]) : null;
      let dir = unit([-(a?.[0] ?? 0) - (b?.[0] ?? 0), -(a?.[1] ?? 0) - (b?.[1] ?? 0)]);
      if (!dir) {
        const away = unit([P[i][0] - cen[0], P[i][1] - cen[1]]) ?? [0, -1];
        dir = a ? [-a[1], a[0]] : away;
        if (dir[0] * away[0] + dir[1] * away[1] < 0) dir = [-dir[0], -dir[1]];
      }
      const end = [P[i][0] + dir[0] * span * 0.13, P[i][1] + dir[1] * span * 0.13];
      outs[i] = end;
      const there = sample((t) => [P[i][0] + (end[0] - P[i][0]) * t, P[i][1] + (end[1] - P[i][1]) * t], 8);
      const p = withLengths([...there, ...there.slice(0, -1).reverse()]);
      pieces.push({ kind: "spur", i, mode: s.out.mode, start: at, ...p });
      at += p.len;
    }
    if (i < P.length - 1) {
      const a = P[i];
      const b = P[i + 1];
      const mode = trip.stops[i + 1].mode;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let n = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if ((mid[0] - cen[0]) * n[0] + (mid[1] - cen[1]) * n[1] < 0) n = [-n[0], -n[1]];
      const h = (4 / 3) * ARC[mode] * L;
      const others = P.filter((_, k) => k !== i && k !== i + 1);
      const clear = (s) => {
        let best = Infinity;
        for (let t = 0.1; t < 0.95; t += 0.1) {
          const off = 3 * t * (1 - t) * h * s;
          const c = [a[0] + (b[0] - a[0]) * t + n[0] * off, a[1] + (b[1] - a[1]) * t + n[1] * off];
          for (const q of others) best = Math.min(best, Math.hypot(q[0] - c[0], q[1] - c[1]));
        }
        return best;
      };
      if (clear(1) < L * 0.15 && clear(-1) > clear(1)) n = [-n[0], -n[1]];
      const c1 = [a[0] + (b[0] - a[0]) / 3 + n[0] * h, a[1] + (b[1] - a[1]) / 3 + n[1] * h];
      const c2 = [a[0] + (2 * (b[0] - a[0])) / 3 + n[0] * h, a[1] + (2 * (b[1] - a[1])) / 3 + n[1] * h];
      const p = withLengths(
        sample((t) => {
          const u = 1 - t;
          return [u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]];
        }, 40),
      );
      pieces.push({ kind: "leg", i: i + 1, mode, normal: n, start: at, ...p });
      at += p.len;
    }
  });
  const all = pieces.flatMap((p) => p.pts).concat(P);
  const box = [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))];
  return { P, pieces, stopAt, outs, total: at, box };
}

function colours(tone) {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    sheet: v("--sheet"), ink: v("--ink"), ink2: v("--ink-2"), ink3: v("--ink-3"), rule2: v("--rule-2"),
    land: v("--sheet-3"), tone: v(`--tone-${tone}`), pen2: v("--pen-2"), penEdge: v("--pen-edge"),
    display: "\"Bricolage Grotesque\", system-ui, sans-serif", sans: "\"Instrument Sans\", system-ui, sans-serif",
  };
}

export function createMap({ box, canvas, trip, inset = () => ({ l: 0, t: 0, r: 0, b: 0 }), onStep = () => {}, onPick = () => {} }) {
  const ctx = canvas.getContext("2d");
  const track = buildTrack(trip);
  let land = [];
  let C = colours(trip.tone);
  let W = 0;
  let H = 0;
  let dpr = 1;
  let fit = { cx: 0, cy: 0, s: 1 };
  let focusPt = [0, 0];
  let cam = null;
  let phase = "done";
  let t0 = 0;
  let drawTime = 3000;
  let drawn = track.total;
  let step = -1;
  let selected = null;
  let view = null;
  let camFrom = null;
  let camTo = null;
  let raf = 0;
  let marks = new Map();
  let labelCache = { s: 0, boxes: null };
  let hits = [];

  function measure() {
    const r = box.getBoundingClientRect();
    W = r.width;
    H = r.height;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ins = inset();
    const narrow = W < 560;
    const padX = narrow ? 46 : 84;
    const padT = narrow ? 34 : 54;
    const padB = narrow ? 44 : 64;
    const rx0 = ins.l + padX;
    const ry0 = ins.t + padT;
    const rw = Math.max(40, W - ins.l - ins.r - padX * 2);
    const rh = Math.max(40, H - ins.t - ins.b - padT - padB);
    const [x0, y0, x1, y1] = track.box;
    const s = Math.min(rw / (x1 - x0 || 1e-6), rh / (y1 - y0 || 1e-6));
    focusPt = [rx0 + rw / 2, ry0 + rh / 2 + (padB - padT) / 2 - (padB - padT) / 2];
    fit = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s };
    labelCache.s = 0;
  }

  const toS = (p) => [(p[0] - cam.cx) * cam.s + focusPt[0], (p[1] - cam.cy) * cam.s + focusPt[1]];
  const lerpCam = (a, b, f) => ({ cx: a.cx + (b.cx - a.cx) * f, cy: a.cy + (b.cy - a.cy) * f, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * f) });
  const pointAt = (d) => {
    const p = track.pieces.find((q) => d <= q.start + q.len) ?? track.pieces[track.pieces.length - 1];
    if (!p) return track.P[0];
    return along(p, d - p.start);
  };
  const followCam = (d) => {
    let sx = 0;
    let sy = 0;
    for (let k = -3; k <= 3; k++) {
      const p = pointAt(clamp(d + k * 0.03 * track.total, 0, track.total));
      sx += p[0] / 7;
      sy += p[1] / 7;
    }
    return { cx: sx, cy: sy, s: fit.s * CLOSE };
  };
  const camFor = (i) => (i == null ? fit : { cx: track.P[i][0], cy: track.P[i][1], s: fit.s * 1.6 });

  function setStep(i) {
    if (i === step) return;
    step = i;
    onStep(i);
  }

  function seen(key, now) {
    if (!marks.has(key)) marks.set(key, now);
    return marks.get(key);
  }
  const fade = (key, now) => clamp((now - seen(key, now)) / FADE_MS, 0, 1);

  function strokeLine(pts, mode, spur) {
    if (pts.length < 2) return;
    const path = new Path2D();
    pts.forEach((p, k) => (k ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
    ctx.lineJoin = "round";
    if (!spur && mode !== "flight") {
      ctx.setLineDash([]);
      ctx.lineCap = "round";
      ctx.lineWidth = EDGE;
      ctx.strokeStyle = C.sheet;
      ctx.stroke(path);
    }
    let w = LINE;
    let dash = [];
    let cap = "round";
    if (spur) {
      w = LINE * 0.8;
      dash = [1.6 * LINE, 1.9 * LINE];
    } else if (mode === "train") {
      w = LINE * 1.3;
      dash = [0.01, 2.1 * w];
    } else if (mode === "flight") {
      w = LINE * 0.85;
      dash = [3.4 * w, 2.6 * w];
    } else if (mode === "ferry") {
      w = LINE * 0.85;
      dash = [1.5 * w, 1.9 * w];
      cap = "butt";
    }
    ctx.setLineDash(dash);
    ctx.lineCap = cap;
    ctx.lineWidth = w;
    ctx.strokeStyle = C.ink;
    ctx.stroke(path);
    ctx.setLineDash([]);
  }

  function partial(p, upto) {
    const out = [];
    for (let k = 0; k < p.pts.length; k++) {
      if (p.cum[k] <= upto) out.push(toS(p.pts[k]));
      else {
        const q = along(p, upto);
        out.push(toS(q));
        break;
      }
    }
    return out;
  }

  function arrow(x, y, dx, dy, a) {
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-3.5, -4);
    ctx.lineTo(1.5, 0);
    ctx.lineTo(-3.5, 4);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.restore();
  }

  function tag(x, y, mode, a) {
    ctx.save();
    ctx.globalAlpha = a;
    const w = 28;
    const h = 20;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = C.sheet;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.ink3;
    ctx.stroke();
    ctx.translate(x - 6, y - 6);
    ctx.scale(12 / 14, 12 / 14);
    ctx.lineWidth = 1.25;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = C.ink;
    for (const p of ICONS[mode]) ctx.stroke(p);
    ctx.restore();
  }

  function dot(kind, x, y, a, grow) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.scale(grow, grow);
    ctx.beginPath();
    if (kind === "open") {
      ctx.arc(0, 0, OPEN_R, 0, Math.PI * 2);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = C.ink;
      ctx.stroke();
    } else if (kind === "night") {
      ctx.arc(0, 0, MID_R, 0, Math.PI * 2);
      ctx.fillStyle = C.sheet;
      ctx.fill();
      ctx.lineWidth = MID_RING;
      ctx.strokeStyle = C.ink;
      ctx.stroke();
    } else {
      ctx.arc(0, 0, END_R + END_RING / 2, 0, Math.PI * 2);
      ctx.fillStyle = C.sheet;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, END_R - END_RING / 2, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.fillStyle = C.sheet;
      ctx.beginPath();
      if (kind === "start") {
        ctx.moveTo(-1.6, -2.6);
        ctx.lineTo(2.8, 0);
        ctx.lineTo(-1.6, 2.6);
        ctx.closePath();
      } else ctx.rect(-2.2, -2.2, 4.4, 4.4);
      ctx.fill();
    }
    ctx.restore();
  }

  function layoutLabels(items) {
    if (labelCache.boxes && Math.abs(labelCache.s / cam.s - 1) < 0.03 && labelCache.n === items.length) return labelCache.boxes;
    const taken = items.map((it) => ({ x0: it.x - it.r - 3, y0: it.y - it.r - 3, x1: it.x + it.r + 3, y1: it.y + it.r + 3, wt: 6 }));
    const boxes = items.map((it) => {
      const h = it.sub ? 30 : 16;
      const g = it.r + 6;
      const cands = [
        { x0: it.x - it.w / 2, y0: it.y + it.r + 5 },
        { x0: it.x + it.r + 7, y0: it.y - h / 2 },
        { x0: it.x - it.r - 7 - it.w, y0: it.y - h / 2 },
        { x0: it.x - it.w / 2, y0: it.y - it.r - 5 - h },
        { x0: it.x + g - 4, y0: it.y + g - 4 },
        { x0: it.x + g - 4, y0: it.y - g + 4 - h },
        { x0: it.x - g + 4 - it.w, y0: it.y + g - 4 },
        { x0: it.x - g + 4 - it.w, y0: it.y - g + 4 - h },
      ].map((c) => ({ ...c, x1: c.x0 + it.w, y1: c.y0 + h }));
      const cost = (c) => taken.reduce((sum, t) => sum + (t.wt ?? 1) * Math.max(0, Math.min(c.x1, t.x1) - Math.max(c.x0, t.x0)) * Math.max(0, Math.min(c.y1, t.y1) - Math.max(c.y0, t.y0)), 0);
      let best = cands[0];
      let bestCost = Infinity;
      for (const c of cands) {
        const k = cost(c);
        if (k < bestCost - 0.5) {
          best = c;
          bestCost = k;
        }
        if (k === 0) break;
      }
      taken.push(best);
      return { dx: best.x0 - it.x, dy: best.y0 - it.y };
    });
    labelCache = { s: cam.s, n: items.length, boxes };
    return boxes;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const { s } = cam;
    const vx0 = cam.cx - focusPt[0] / s;
    const vy0 = cam.cy - focusPt[1] / s;
    const vx1 = vx0 + W / s;
    const vy1 = vy0 + H / s;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (focusPt[0] - cam.cx * s), dpr * (focusPt[1] - cam.cy * s));
    ctx.lineWidth = 0.75 / s;
    ctx.lineJoin = "round";
    for (const c of land) {
      if (c.box[2] < vx0 || c.box[0] > vx1 || c.box[3] < vy0 || c.box[1] > vy1) continue;
      const mine = trip.iso.includes(c.iso);
      ctx.fillStyle = mine ? C.tone : C.land;
      ctx.fill(c.path);
      ctx.strokeStyle = C.rule2;
      ctx.stroke(c.path);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const p of track.pieces) {
      if (p.start >= drawn) break;
      strokeLine(partial(p, Math.min(drawn - p.start, p.len)), p.mode, p.kind === "spur");
    }
    for (const p of track.pieces) {
      if (p.kind !== "leg" || drawn < p.start + p.len / 2) continue;
      const m = along(p, p.len / 2);
      const [x, y] = toS(m);
      arrow(x, y, m[2], m[3], fade(`a${p.i}`, now));
    }
    for (const p of track.pieces) {
      if (p.kind !== "leg" || drawn < p.start + p.len) continue;
      const a = toS(p.pts[0]);
      const b = toS(p.pts[p.pts.length - 1]);
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 70) continue;
      const m = toS(along(p, p.len / 2));
      tag(m[0] + p.normal[0] * 18, m[1] + p.normal[1] * 18, p.mode, fade(`t${p.i}`, now));
    }

    if (selected != null && (phase === "done" || phase === "focus")) {
      const [x, y] = toS(track.P[selected]);
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = C.pen2;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.penEdge;
      ctx.stroke();
    }

    const items = [];
    const last = trip.stops.length - 1;
    hits = [];
    trip.stops.forEach((st, i) => {
      if (drawn + 1e-12 < track.stopAt[i]) return;
      const [x, y] = toS(track.P[i]);
      const a = fade(`s${i}`, now);
      const kind = i === 0 ? "start" : i === last ? "end" : "night";
      const r = kind === "night" ? MID_R : END_R;
      const out = track.outs[i];
      if (out) {
        const sp = track.pieces.find((q) => q.kind === "spur" && q.i === i);
        if (drawn >= sp.start + sp.len / 2) {
          const [ox, oy] = toS(out);
          const oa = fade(`o${i}`, now);
          dot("open", ox, oy, oa, 0.55 + 0.45 * ease(oa));
          items.push({ x: ox, y: oy, r: OPEN_R, a: oa, name: st.out.name, sub: null, w: 0, out: true });
        }
      }
      dot(kind, x, y, a, kind === "night" ? 0.55 + 0.45 * ease(a) : 1);
      items.push({ x, y, r, a, name: st.name, sub: `${st.nights} ${st.nights === 1 ? "night" : "nights"}`, w: 0, i });
      hits.push({ x, y, i });
    });
    const nameFont = `600 12.5px ${C.display}`;
    const subFont = `italic 400 11.5px ${C.sans}`;
    const outFont = `italic 500 11.5px ${C.sans}`;
    for (const it of items) {
      ctx.font = it.out ? outFont : nameFont;
      let w = ctx.measureText(it.name).width;
      if (it.sub) {
        ctx.font = subFont;
        w = Math.max(w, ctx.measureText(it.sub).width);
      }
      it.w = w;
    }
    const placed = layoutLabels(items);
    ctx.lineJoin = "round";
    ctx.textBaseline = "alphabetic";
    items.forEach((it, k) => {
      const { dx, dy } = placed[k] ?? { dx: -it.w / 2, dy: it.r + 5 };
      const x0 = it.x + dx;
      const y0 = it.y + dy;
      const center = Math.abs(dx + it.w / 2) < 1;
      const right = dx < 0 && !center;
      ctx.textAlign = center ? "center" : right ? "right" : "left";
      const tx = center ? it.x : right ? x0 + it.w : x0;
      ctx.globalAlpha = it.a;
      const line = (text, font, y, fill) => {
        ctx.font = font;
        ctx.lineWidth = 5;
        ctx.strokeStyle = C.sheet;
        ctx.strokeText(text, tx, y);
        ctx.fillStyle = fill;
        ctx.fillText(text, tx, y);
      };
      line(it.name, it.out ? outFont : nameFont, y0 + 12, it.out ? C.ink2 : C.ink);
      if (it.sub) line(it.sub, subFont, y0 + 26, C.ink2);
      if (it.i != null) hits.push({ x: x0 + it.w / 2, y: y0 + 14, i: it.i, label: true, w: it.w });
    });
    ctx.globalAlpha = 1;

    if (phase === "draw") {
      const p = pointAt(drawn);
      const [x, y] = toS(p);
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.sheet;
      ctx.stroke();
    }
  }

  function frame(now) {
    raf = 0;
    const t = now - t0;
    if (phase === "fly") {
      cam = lerpCam(camFrom, followCam(0), ease(t / FLY_MS));
      drawn = 0;
      if (t >= FLY_MS) {
        phase = "draw";
        t0 = now;
      }
    } else if (phase === "draw") {
      drawn = ease(t / drawTime) * track.total;
      cam = followCam(drawn);
      let i = 0;
      while (i + 1 < track.stopAt.length && track.stopAt[i + 1] <= drawn + 1e-12) i++;
      setStep(i);
      if (t >= drawTime) {
        drawn = track.total;
        phase = "back";
        t0 = now;
        camFrom = followCam(track.total);
      }
    } else if (phase === "back") {
      cam = lerpCam(camFrom, fit, ease(t / BACK_MS));
      if (t >= BACK_MS) {
        phase = "done";
        cam = fit;
      }
    } else if (phase === "focus") {
      cam = lerpCam(camFrom, camTo, ease(t / FOCUS_MS));
      if (t >= FOCUS_MS) {
        phase = "done";
        cam = camTo;
      }
    }
    draw(now);
    const fading = [...marks.values()].some((m) => now - m < FADE_MS);
    if (phase !== "done" || fading) raf = requestAnimationFrame(frame);
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  function settle() {
    drawn = track.total;
    const past = performance.now() - FADE_MS * 2;
    for (const p of track.pieces) {
      marks.set(`a${p.i}`, marks.get(`a${p.i}`) ?? past);
      marks.set(`t${p.i}`, marks.get(`t${p.i}`) ?? past);
    }
    trip.stops.forEach((_, i) => {
      marks.set(`s${i}`, marks.get(`s${i}`) ?? past);
      marks.set(`o${i}`, marks.get(`o${i}`) ?? past);
    });
  }

  function play() {
    selected = null;
    view = null;
    marks = new Map();
    if (reduce.matches) {
      settle();
      for (const k of marks.keys()) marks.set(k, -1e9);
      phase = "done";
      cam = fit;
      setStep(trip.stops.length - 1);
      kick();
      return;
    }
    drawTime = clamp((track.total * fit.s) / PACE, 2200, 5600) * SLOW;
    phase = "fly";
    t0 = performance.now();
    camFrom = { cx: fit.cx, cy: fit.cy, s: fit.s / 5 };
    cam = camFrom;
    drawn = 0;
    step = -1;
    setStep(0);
    kick();
  }

  function focus(i) {
    if (phase !== "done" && phase !== "focus") {
      settle();
      setStep(trip.stops.length - 1);
    }
    selected = i;
    view = i;
    camFrom = cam ?? fit;
    camTo = camFor(i);
    if (reduce.matches) {
      cam = camTo;
      phase = "done";
    } else {
      phase = "focus";
      t0 = performance.now();
    }
    kick();
  }

  const at = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best = null;
    let bd = 16;
    for (const h of hits) {
      const d = h.label ? (Math.abs(x - h.x) < h.w / 2 + 4 && Math.abs(y - h.y) < 16 ? 0 : Infinity) : Math.hypot(x - h.x, y - h.y);
      if (d < bd) {
        bd = d;
        best = h.i;
      }
    }
    return best;
  };
  const onMove = (e) => (canvas.style.cursor = at(e) != null ? "pointer" : "");
  const onClick = (e) => {
    const i = at(e);
    if (i != null) onPick(i);
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("click", onClick);

  const ro = new ResizeObserver(() => {
    measure();
    if (phase === "done") cam = camFor(view);
    if (cam) kick();
  });
  const mo = new MutationObserver(() => {
    C = colours(trip.tone);
    kick();
  });
  mo.observe(document.documentElement, { attributes: true });
  mo.observe(document.body, { attributes: true });

  measure();
  cam = fit;
  Promise.all([loadLand(), document.fonts.ready]).then(([l]) => {
    land = l;
    C = colours(trip.tone);
    ro.observe(box);
    play();
  });

  return {
    play,
    focus,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("click", onClick);
    },
  };
}
