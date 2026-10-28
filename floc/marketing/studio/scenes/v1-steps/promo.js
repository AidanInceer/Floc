// Every frame is a pure function of time: seek(t) sets the whole stage. render.mjs steps t by 1/30 s.
const FPS = 30;
const DURATION = 23;
const CTA_URL = "floc.app";

const clamp = (x) => Math.min(1, Math.max(0, x));
const p = (t, a, b) => clamp((t - a) / (b - a));
const out3 = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 2.70158; return 1 + c * Math.pow(x - 1, 3) + (c - 1) * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;

const stage = document.getElementById("stage");
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const css = (node, o) => { for (const k in o) node.style[k] = o[k]; };
const pose = (node, { o = 1, x = 0, y = 0, s = 1 }) => { node.style.opacity = o; node.style.transform = `translate(${x}px, ${y}px) scale(${s})`; };
const money = (cents) => `${cents < 0 ? "−" : cents > 0 ? "+" : ""}£${(Math.abs(cents) / 100).toFixed(2)}`;
const chip = (cls, letter) => `<div class="chip ${cls}">${letter}</div>`;
const rise = (node, lt, a, d = 0.4, dist = 50) => { const k = out3(p(lt, a, a + d)); pose(node, { o: k, y: (1 - k) * dist }); };

function scene(start, end, speed) {
  const node = el('<div class="scene"></div>');
  stage.append(node);
  return { node, start, end, speed };
}

const caption = (parent, kicker, words) => {
  parent.append(el(`<div class="kicker">${kicker}</div>`));
  const box = el('<div class="caption"></div>');
  const spans = words.map(([w, accent]) => el(`<span class="w">${accent ? `<em>${w}</em>` : w}</span>`));
  spans.forEach((s, i) => { box.append(s); if (i < spans.length - 1) box.append(" "); });
  parent.append(box);
  return (lt) => spans.forEach((s, i) => rise(s, lt, 0.05 + i * 0.07, 0.35, 40));
};

/* 1 · wordmark and headline */
const s1 = scene(0, 3.5, 0.6);
s1.node.append(el(`<div class="abs" style="left:0;right:0;top:700px;display:flex;justify-content:center">
  <span class="mark" style="font-size:210px">
    <svg viewBox="0 0 26 20" width="260" height="200" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path pathLength="1" d="M3 14 6.5 10.5 10 14"/><path pathLength="1" d="M9.5 8.5 13 5 16.5 8.5"/><path pathLength="1" d="M16 14 19.5 10.5 23 14"/>
    </svg>
    <span>${[..."floc"].map((c) => `<span class="l" style="display:inline-block">${c}</span>`).join("")}<span class="dot" style="transform-origin:50% 80%">.</span></span>
  </span></div>`));
const s1Head = el('<div class="abs caption" style="top:1070px;text-align:center;font-size:96px"></div>');
const s1Words = ["Group", "trip", "planning,", "sorted."].map((w, i) => el(`<span class="w">${i === 3 ? `<em>${w}</em>` : w}</span>`));
s1Words.forEach((w, i) => { s1Head.append(w); if (i < 3) s1Head.append(" "); });
s1.node.append(s1Head);
const s1Paths = [...s1.node.querySelectorAll("path")];
const s1Letters = [...s1.node.querySelectorAll(".l")];
const s1Dot = s1.node.querySelector(".dot");
s1.update = (lt) => {
  s1Paths.forEach((path, i) => {
    const k = out3(p(lt, 0.05 + i * 0.1, 0.4 + i * 0.1));
    path.style.strokeDasharray = "1 1";
    path.style.strokeDashoffset = 1 - k;
    path.style.opacity = k > 0 ? 1 : 0;
  });
  s1Letters.forEach((l, i) => rise(l, lt, 0.25 + i * 0.06, 0.3, 60));
  const dk = back(p(lt, 0.62, 0.92));
  s1Dot.style.opacity = p(lt, 0.62, 0.7);
  s1Dot.style.transform = `scale(${dk})`;
  s1Words.forEach((w, i) => rise(w, lt, 0.95 + i * 0.1, 0.4, 50));
};

/* 2 · pitch and vote */
const s2 = scene(3.5, 8, 0.55);
const s2Cap = caption(s2.node, "01 &nbsp;Where", [["Vote", 0], ["on", 0], ["a", 1], ["place.", 1]]);
const places = [
  { name: "Lisbon", sub: "Portugal", top: 640, win: true },
  { name: "Kyoto", sub: "Japan", top: 920 },
  { name: "Marrakech", sub: "Morocco", top: 1200 },
];
const votes = [[0, "M", "who-a", 0.6], [1, "S", "who-b", 0.85], [0, "J", "who-c", 1.1], [0, "A", "who-d", 1.35]];
const cards = places.map((pl) => {
  const card = el(`<div class="card place" style="top:${pl.top}px">
    <div><div class="name">${pl.name}</div><div class="sub">${pl.sub}</div></div>
    <div class="voters"></div><div class="count">0</div>
    ${pl.win ? '<div class="tag blue" style="position:absolute;right:36px;top:-26px;background:var(--pen);color:#fff;border-color:var(--pen)">Chosen</div>' : ""}
  </div>`);
  s2.node.append(card);
  return { card, voters: card.querySelector(".voters"), count: card.querySelector(".count"), tag: card.querySelector(".tag"), shown: 0 };
});
const voteChips = votes.map(([ci, letter, cls]) => { const c = el(chip(cls, letter)); cards[ci].voters.append(c); return c; });
s2.update = (lt) => {
  s2Cap(lt);
  const win = out3(p(lt, 1.62, 1.85));
  cards.forEach((c, i) => {
    const k = out3(p(lt, 0.2 + i * 0.12, 0.65 + i * 0.12));
    const dim = places[i].win ? 0 : win;
    pose(c.card, { o: k * (1 - dim * 0.45), x: (1 - k) * 140, y: places[i].win ? -win * 6 : 0, s: places[i].win ? 1 + win * 0.03 : 1 });
    css(c.card, { borderColor: places[i].win && win > 0 ? "var(--pen)" : "var(--rule)", background: places[i].win && win > 0.5 ? "var(--pen-2)" : "var(--sheet)" });
    c.shown = 0;
  });
  votes.forEach(([ci, , , at], i) => {
    const k = p(lt, at, at + 0.22);
    pose(voteChips[i], { o: k > 0 ? 1 : 0, s: back(k) || 0.001 });
    voteChips[i].style.display = k > 0 ? "grid" : "none";
    if (k > 0) cards[ci].shown++;
  });
  cards.forEach((c) => { c.count.textContent = c.shown; });
  cards[0].tag.style.opacity = win;
  cards[0].tag.style.transform = `scale(${back(p(lt, 1.62, 1.9))})`;
};

/* 3 · dates */
const s3 = scene(8, 12.5, 0.55);
const s3Cap = caption(s3.node, "02 &nbsp;When", [["Find", 0], ["dates", 0], ["that", 1], ["work.", 1]]);
const MEMBERS = [["M", "who-a"], ["S", "who-b"], ["J", "who-c"], ["A", "who-d"]];
const GRID_LEFT = 90, GRID_TOP = 756, STEP = 130;
const free = (m, d) => {
  if (d >= 14 && d <= 20) return true;
  if (m === d % 4) return false;
  return ((d * 7 + m * 13 + d * m) % 5) !== 0;
};
s3.node.append(el('<div class="abs cal-head" style="left:96px;top:600px">September</div>'));
const s3Chips = MEMBERS.map(([l, c], i) => { const n = el(`<div class="abs">${chip(c, l)}</div>`); css(n, { left: `${708 + i * 70}px`, top: "606px" }); s3.node.append(n); return n; });
["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d, i) => { const n = el(`<div class="dow">${d}</div>`); css(n, { left: `${GRID_LEFT + i * STEP}px`, top: "700px" }); s3.node.append(n); });
const s3Cells = [];
for (let d = 1; d <= 30; d++) {
  const col = d % 7, row = Math.floor(d / 7);
  const cell = el(`<div class="cell">${d}</div>`);
  css(cell, { left: `${GRID_LEFT + col * STEP}px`, top: `${GRID_TOP + row * STEP}px` });
  s3.node.append(cell);
  s3Cells.push({ cell, d, row });
}
const rowBox = el('<div class="abs" style="left:78px;width:924px;top:0;height:132px;border:5px solid var(--pen);border-radius:32px;transform-origin:0 50%"></div>');
css(rowBox, { top: `${GRID_TOP + 2 * STEP - 6}px` });
s3.node.append(rowBox);
const s3Tag = el('<div class="abs tag green" style="left:96px;top:1436px;height:64px;font-size:30px;padding:0 30px">Mon 14 – Sun 20 &nbsp;·&nbsp; all 4 free</div>');
s3.node.append(s3Tag);
const LEVEL = [
  ["var(--sheet)", "var(--rule)", "var(--ink-2)"],
  ["var(--some-free-1)", "var(--some-free-1)", "var(--some-free-ink)"],
  ["var(--some-free-2)", "var(--some-free-2)", "var(--some-free-ink)"],
  ["var(--some-free-3)", "var(--some-free-3)", "var(--some-free-ink)"],
  ["var(--green-2)", "var(--green-edge)", "var(--green)"],
];
s3.update = (lt) => {
  s3Cap(lt);
  s3Cells.forEach(({ cell, d, row }, i) => {
    pose(cell, { o: out3(p(lt, 0.1 + i * 0.006, 0.4 + i * 0.006)) });
    let n = 0;
    MEMBERS.forEach((_, m) => { if (free(m, d) && lt >= 0.5 + m * 0.3 + d * 0.005) n++; });
    const [bg, edge, ink] = LEVEL[n];
    css(cell, { background: bg, borderColor: edge, color: ink });
  });
  s3Chips.forEach((c, m) => { const k = p(lt, 0.5 + m * 0.3, 0.8 + m * 0.3); const pulse = Math.sin(Math.PI * k); pose(c, { o: out3(p(lt, 0.05 + m * 0.05, 0.3 + m * 0.05)), s: 1 + pulse * 0.25 }); });
  const rk = out3(p(lt, 1.5, 1.8));
  rowBox.style.opacity = rk;
  rowBox.style.transform = `scaleX(${rk})`;
  const tk = back(p(lt, 1.6, 1.9));
  s3Tag.style.opacity = p(lt, 1.6, 1.75);
  s3Tag.style.transform = `scale(${tk})`;
  s3Tag.style.transformOrigin = "0 50%";
};

/* 4 · route */
const s4 = scene(12.5, 17, 0.55);
const s4Cap = caption(s4.node, "03 &nbsp;What to do", [["Plan", 0], ["it", 0], ["day", 1], ["by", 1], ["day.", 1]]);
const stops = [
  { name: "Lisbon", days: "Days 1–2", x: 300, y: 175, at: 0.3, tone: "blue" },
  { name: "Sintra", left: true, days: "Day 3", x: 230, y: 100, at: 0.55, tone: "green" },
  { name: "Évora", days: "Days 4–5", x: 570, y: 215, at: 0.95, tone: "yellow" },
  { name: "Lagos", days: "Days 6–7", x: 350, y: 370, at: 1.35, tone: "red" },
];
const mapCard = el(`<div class="card" style="left:96px;top:590px;width:888px;height:440px;overflow:hidden">
  <svg viewBox="0 0 888 440" width="888" height="440" style="position:absolute;inset:0">
    <path d="M70 20 C110 100 60 190 110 255 C150 320 120 380 170 430 L840 430 L840 20 Z" fill="var(--sheet-2)" stroke="var(--rule-2)" stroke-width="3" stroke-linejoin="round"/>
    <path id="route" pathLength="1" d="M300 175 C275 145 255 125 230 100 C330 95 490 140 570 215 C570 290 460 355 350 370" fill="none" stroke="var(--pen)" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 1"/>
    ${stops.map((s) => `<g class="stop" data-i="${stops.indexOf(s)}"><circle class="ring" cx="${s.x}" cy="${s.y}" r="16" fill="none" stroke="var(--pen)" stroke-width="4"/><circle cx="${s.x}" cy="${s.y}" r="16" fill="var(--sheet)" stroke="var(--pen)" stroke-width="7"/><text x="${s.left ? s.x - 32 : s.x + 32}" y="${s.y + 12}" text-anchor="${s.left ? "end" : "start"}" font-family="var(--display)" font-weight="600" font-size="38" fill="var(--ink)">${s.name}</text></g>`).join("")}
  </svg></div>`);
s4.node.append(mapCard);
const route = mapCard.querySelector("#route");
const stopGs = [...mapCard.querySelectorAll(".stop")];
const dayRows = stops.map((s, i) => {
  const row = el(`<div class="day" style="top:${1060 + i * 116}px;height:100px"><span class="n">${s.days}</span><span class="p">${s.name}</span><span class="bar" style="background:var(--pastel-${s.tone}-ink)"></span></div>`);
  css(row, { background: `var(--pastel-${s.tone})`, borderColor: `var(--pastel-${s.tone}-edge)` });
  s4.node.append(row);
  return row;
});
s4.update = (lt) => {
  s4Cap(lt);
  pose(mapCard, { o: out3(p(lt, 0.1, 0.4)), y: (1 - out3(p(lt, 0.1, 0.4))) * 50 });
  const rk = out3(p(lt, 0.3, 1.5));
  route.style.strokeDashoffset = 1 - rk;
  stopGs.forEach((g, i) => {
    const k = back(p(lt, stops[i].at, stops[i].at + 0.25));
    g.style.transformBox = "fill-box";
    g.style.transformOrigin = "0 50%";
    g.style.opacity = p(lt, stops[i].at, stops[i].at + 0.1);
    const ring = g.querySelector(".ring");
    const pk = p(lt, stops[i].at, stops[i].at + 0.5);
    ring.style.transformBox = "fill-box";
    ring.style.transformOrigin = "center";
    ring.style.transform = `scale(${1 + pk * 1.8})`;
    ring.style.opacity = pk > 0 && pk < 1 ? 1 - pk : 0;
    g.style.transform = `scale(${lerp(0.6, 1, Math.min(k, 1.15))})`;
  });
  dayRows.forEach((r, i) => { const k = out3(p(lt, stops[i].at + 0.15, stops[i].at + 0.5)); pose(r, { o: k, x: (1 - k) * -120 }); });
};

/* 5 · money */
const s5 = scene(17, 20.5, 0.45);
const s5Cap = caption(s5.node, "04 &nbsp;Who pays", [["Split", 0], ["the", 1], ["costs.", 1]]);
const bal = [["Maya", "who-a", "M", 4250], ["Sam", "who-b", "S", -1800], ["Jo", "who-c", "J", -2450], ["Alex", "who-d", "A", 0]];
const ledger = el('<div class="card ledger" style="top:640px;height:500px"></div>');
const balRows = bal.map(([n, c, l, v], i) => {
  const r = el(`<div class="row" style="top:${i * 125}px;height:125px">${chip(c, l)}<span class="nm">${n}</span><span class="amt"></span></div>`);
  ledger.append(r);
  return { r, amt: r.querySelector(".amt"), v };
});
s5.node.append(ledger);
const owes = [["Sam", "Maya", 1800], ["Jo", "Maya", 2450]].map(([a, b, v], i) => {
  const o = el(`<div class="owe" style="top:${1190 + i * 150}px"><span>${a} owes ${b}</span><span class="a">£${(v / 100).toFixed(2)}</span></div>`);
  s5.node.append(o);
  return o;
});
s5.update = (lt) => {
  s5Cap(lt);
  pose(ledger, { o: out3(p(lt, 0.02, 0.25)) });
  balRows.forEach((b, i) => {
    const k = out3(p(lt, 0.08 + i * 0.07, 0.3 + i * 0.07));
    pose(b.r, { o: k, y: (1 - k) * 24 });
    const count = out3(p(lt, 0.15 + i * 0.07, 0.5 + i * 0.07));
    b.amt.textContent = money(Math.round(b.v * count));
    b.amt.style.color = b.v > 0 ? "var(--green)" : b.v < 0 ? "var(--red)" : "var(--ink-2)";
  });
  owes.forEach((o, i) => { const k = back(p(lt, 0.42 + i * 0.14, 0.7 + i * 0.14)); pose(o, { o: p(lt, 0.42 + i * 0.14, 0.55 + i * 0.14), y: (1 - Math.min(k, 1)) * 40, s: Math.min(k, 1.05) }); });
};

/* 6 · call to action */
const s6 = scene(20.5, 23, 0.6);
s6.node.append(el(`<div class="abs" style="left:0;right:0;top:700px;display:flex;justify-content:center">
  <span class="mark" style="font-size:190px">
    <svg viewBox="0 0 26 20" width="236" height="182" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14 6.5 10.5 10 14"/><path d="M9.5 8.5 13 5 16.5 8.5"/><path d="M16 14 19.5 10.5 23 14"/></svg>
    <span>floc<span class="dot">.</span></span></span></div>`));
const cta = el('<div class="cta">Start a trip — free</div>');
const url = el(`<div class="url">${CTA_URL}</div>`);
s6.node.append(cta, url);
const s6Mark = s6.node.firstElementChild;
s6.update = (lt) => {
  const mk = out3(p(lt, 0.0, 0.4));
  pose(s6Mark, { o: mk, y: (1 - mk) * 40, s: lerp(0.9, 1, mk) });
  const ck = back(p(lt, 0.3, 0.65));
  css(cta, { left: "50%", top: "1020px", marginLeft: "-310px" });
  cta.style.opacity = p(lt, 0.3, 0.45);
  cta.style.transform = `scale(${ck})`;
  css(url, { left: "0", right: "0", top: "1210px", textAlign: "center" });
  url.style.opacity = out3(p(lt, 0.55, 0.85));
};

const scenes = [s1, s2, s3, s4, s5, s6];
const IN = 0.3, OUT = 0.3;
function seek(t) {
  for (const s of scenes) {
    const lt = t - s.start;
    const inK = s === s1 ? 1 : out3(p(t, s.start - 0.1, s.start - 0.1 + IN));
    const outK = s === s6 ? 0 : out3(p(t, s.end - 0.1, s.end - 0.1 + OUT));
    const visible = inK * (1 - outK);
    s.node.style.display = visible > 0 ? "block" : "none";
    s.node.style.opacity = visible;
    s.node.style.transform = `translateY(${(1 - inK) * 36 - outK * 36}px)`;
    if (visible > 0) s.update(Math.max(lt, 0) * s.speed);
  }
}

window.seek = seek;
window.PROMO = { FPS, DURATION };
window.promoReady = document.fonts.ready.then(() => Promise.all([
  document.fonts.load('600 40px "Bricolage Grotesque"'),
  document.fonts.load('400 40px "Instrument Sans"'),
  document.fonts.load('400 40px "DM Mono"'),
  document.fonts.load('500 40px "DM Mono"'),
]));

const q = new URLSearchParams(location.search);
if (q.has("t")) seek(parseFloat(q.get("t")));
else {
  const t0 = performance.now();
  const tick = () => { seek(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(tick); };
  tick();
}
