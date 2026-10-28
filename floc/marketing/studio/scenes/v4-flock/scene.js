const DURATION = 21;

const T = { scatter: 3.6, join: [3.8, 5.6], place: [6.6, 9.6], dates: [9.6, 12.6], route: [12.6, 15.6], owe: [15.6, 18.0], leave: 18.0 };
const win = (t, [a, b], f = 0.35) => out3(p(t, a, a + f)) * (1 - out3(p(t, b - f, b)));

const caps = [
  caption("Everyone wants something different.", 0.1, 3.6, 290, 84),
  caption("Floc gets the group flying together.", 3.7, 6.5, 290, 84),
  caption("Pick where to go.", T.place[0], T.place[1], 290, 84),
  caption("Find dates that work.", T.dates[0], T.dates[1], 290, 84),
  caption("Follow the plan, day by day.", T.route[0], T.route[1], 290, 84),
  caption("See who owes who.", T.owe[0], T.owe[1], 290, 84),
];

const map = add(stage, '<div class="abs" style="left:60px;top:580px;width:960px;height:920px;border-radius:44px;background:var(--sheet-2);border:2px solid var(--rule)"></div>');

const PEOPLE = [["Maya", 1], ["Sam", 2], ["Jo", 3], ["Alex", 4]];
const birds = PEOPLE.map(([, n]) => {
  const node = add(stage, `<div class="abs" style="left:0;top:0;width:140px;height:80px;margin:-40px 0 0 -70px"><svg viewBox="0 0 140 80" width="140" height="80" style="overflow:visible"><path d="" fill="none" stroke="var(--who-${n}-ink)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`);
  return { node, path: node.querySelector("path") };
});
const placeBird = (i, x, y, heading, t) => {
  const apex = 22 + 14 * Math.sin(t * 8 + i * 1.7);
  birds[i].path.setAttribute("d", `M14 60 L70 ${apex} L126 60`);
  birds[i].node.style.transform = `translate(${x}px, ${y}px) rotate(${heading}deg)`;
};
const angleLerp = (a, b, k) => a + ((((b - a + 540) % 360) - 180) * k);
const rad = (d) => (d * Math.PI) / 180;

const FORM = [[0, -120], [-120, 0], [120, 0], [0, 120]];
const inFlock = (i, cx, cy, heading, spread = 1) => {
  const [ox, oy] = FORM[i];
  const a = rad(heading);
  return [cx + (ox * Math.cos(a) - oy * Math.sin(a)) * spread, cy + (ox * Math.sin(a) + oy * Math.cos(a)) * spread];
};

const DRIFT = [
  { x0: 260, y0: 800, vx: -20, vy: -26, tag: "beach" },
  { x0: 800, y0: 960, vx: 30, vy: -10, tag: "city break" },
  { x0: 290, y0: 1280, vx: -24, vy: 28, tag: "cheap" },
  { x0: 780, y0: 1340, vx: 24, vy: 30, tag: "hiking" },
];
const scatter = (i, t) => {
  const d = DRIFT[i];
  const x = d.x0 + d.vx * t + Math.sin(t * 2.1 + i) * 26;
  const y = d.y0 + d.vy * t + Math.cos(t * 1.7 + i * 2) * 22;
  const vx = d.vx + Math.cos(t * 2.1 + i) * 55;
  const vy = d.vy - Math.sin(t * 1.7 + i * 2) * 37;
  return [x, y, (Math.atan2(vx, -vy) * 180) / Math.PI];
};
const wishes = DRIFT.map((d, i) => add(stage, `<div class="abs" style="left:0;top:0"><div style="transform:translateX(-50%);margin:-130px 0 0 0;padding:6px 30px 10px;border-radius:999px;background:var(--who-${i + 1});color:var(--who-${i + 1}-ink);font-family:var(--display);font-weight:600;font-size:52px;letter-spacing:-0.03em;white-space:nowrap">${d.tag}</div></div>`));

const pins = [["Kyoto", 250, 760], ["Marrakech", 790, 840], ["Lisbon", 540, 690]].map(([name, x, y]) => ({
  name, x, y,
  dot: add(stage, `<div class="abs" style="left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;background:var(--sheet);border:9px solid var(--pen)"></div>`),
  label: add(stage, `<div class="abs" style="left:${x}px;top:${y - 100}px;transform:translateX(-50%);padding:8px 30px 12px;border-radius:999px;background:var(--sheet);border:2px solid var(--rule);box-shadow:var(--shadow);font-family:var(--display);font-weight:600;font-size:52px;letter-spacing:-0.03em;white-space:nowrap">${name}</div>`),
}));
const chosen = add(stage, '<div class="tag blue abs" style="left:540px;top:524px;margin-left:-70px;display:none">Chosen</div>');
chosen.style.display = "inline-flex";

const DAYS = [14, 15, 16, 17, 18, 19, 20];
const dayPills = DAYS.map((d, i) => add(stage, `<div class="abs mono" style="left:${112 + i * 122}px;top:1280px;width:110px;height:130px;border-radius:26px;background:var(--sheet);border:2px solid var(--rule);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:26px;color:var(--ink-3)"><span style="font-size:46px;color:var(--ink)">${d}</span>${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</div>`));
const datesTag = add(stage, '<div class="tag green abs" style="left:112px;top:1432px;height:56px;font-size:30px">14 – 20 Sep · all 4 free</div>');

const ROUTE_D = "M190 1290 C 240 1040, 430 1190, 520 1020 S 770 990, 880 790";
const routeSvg = add(stage, `<svg class="abs" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920"><path id="route" pathLength="1" d="${ROUTE_D}" fill="none" stroke="var(--pen)" stroke-width="8" stroke-linecap="round" stroke-dasharray="1 1"/></svg>`);
const routePath = routeSvg.querySelector("#route");
const ROUTE_LEN = routePath.getTotalLength();
const at = (u) => { const q = routePath.getPointAtLength(clamp(u) * ROUTE_LEN); return [q.x, q.y]; };
const heading = (u) => { const a = at(clamp(u - 0.015)); const b = at(clamp(u + 0.015)); return (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI; };
const STOPS = [["Lisbon", "days 1–2", 0, "r"], ["Sintra", "day 3", 0.33, "r"], ["Évora", "days 4–5", 0.66, "l"], ["Lagos", "days 6–7", 1, "l"]];
const stopEls = STOPS.map(([name, days, u, side]) => {
  const [x, y] = at(u);
  const dot = add(stage, `<div class="abs" style="left:${x - 20}px;top:${y - 20}px;width:40px;height:40px;border-radius:50%;background:var(--sheet);border:8px solid var(--pen)"></div>`);
  const label = add(stage, `<div class="abs" style="top:${y + 80}px;${side === "r" ? `left:${x - 20}px` : `right:${1080 - x - 20}px`};padding:8px 28px 12px;border-radius:999px;background:var(--sheet);border:2px solid var(--rule);box-shadow:var(--shadow);font-family:var(--display);font-weight:600;font-size:46px;letter-spacing:-0.03em;white-space:nowrap">${name} <span class="mono" style="font-weight:400;font-size:28px;color:var(--ink-2);margin-left:8px">${days}</span></div>`);
  return { u, dot, label };
});

const oweRows = [["Sam owes Maya", "£18.00", 1250], ["Jo owes Maya", "£24.50", 1370]].map(([a, b, y]) => add(stage, `<div class="abs" style="left:96px;width:888px;top:${y}px;height:104px;border-radius:30px;background:var(--pen-2);border:2px solid var(--pen-edge);color:var(--pen-deep);display:flex;align-items:center;padding:0 40px;font-family:var(--display);font-weight:600;font-size:48px;letter-spacing:-0.03em"><span>${a}</span><span class="mono" style="margin-left:auto;font-weight:500;font-size:48px">${b}</span></div>`));
const links = add(stage, '<svg class="abs" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920"><line id="l1" stroke="var(--ink-2)" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round"/><line id="l2" stroke="var(--ink-2)" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round"/></svg>');
const l1 = links.querySelector("#l1"), l2 = links.querySelector("#l2");

birds.forEach((b) => stage.append(b.node));
wishes.forEach((w) => stage.append(w));
const end = endCard(18.7);

const FLOCK_REST = [540, 1050];

function frame(t) {
  caps.forEach((c) => c(t));

  let pos = [0, 0, 0, 0].map((_, i) => scatter(i, Math.min(t, 5.6)));
  const spread = t < 9.4 ? 1 : t < 10.3 ? lerp(1, 0.8, inOut(p(t, 9.4, 10.3))) : t < 12.2 ? 0.8 : t < 13.1 ? lerp(0.8, 0.6, inOut(p(t, 12.2, 13.1))) : t < 15.4 ? 0.6 : lerp(0.6, 1.35, inOut(p(t, 15.4, 16.4)));
  const joinK = inOut(p(t, T.join[0], T.join[1]));
  let cx = FLOCK_REST[0], cy = FLOCK_REST[1], h = 0;
  const flying = t >= T.join[1];
  if (!flying) {
    pos = pos.map(([sx, sy, sh], i) => { const [fx, fy] = inFlock(i, cx, cy, 0); return [lerp(sx, fx, joinK), lerp(sy, fy, joinK), angleLerp(sh, 0, joinK)]; });
  } else {
    if (t < 9.4) { const k = inOut(p(t, 7.0, 8.7)); cx = 540; cy = lerp(1050, 880, k); h = 0; }
    else if (t < 10.3) { const k = inOut(p(t, 9.4, 10.3)); cx = lerp(540, 190, k); cy = lerp(880, 1030, k); h = lerp(0, 90, k); }
    else if (t < 12.2) { const k = inOut(p(t, 10.2, 11.6)); cx = lerp(190, 860, k); cy = 1030; h = 90; }
    else if (t < 13.1) { const k = inOut(p(t, 12.2, 13.1)); const [sx, sy] = at(0); cx = lerp(860, sx, k); cy = lerp(1030, sy, k); h = angleLerp(90, heading(0), k); }
    else if (t < 15.4) { const u = inOut(p(t, 13.1, 15.4)); [cx, cy] = at(u); h = heading(u); }
    else { const k = inOut(p(t, 15.4, 16.4)); const [ex, ey] = at(1); cx = lerp(ex, FLOCK_REST[0], k); cy = lerp(ey, 940, k); h = angleLerp(heading(1), 0, k); }
    if (t > T.leave) { const k = inOut(p(t, T.leave, T.leave + 0.9)); cy -= k * 1500; }
    pos = [0, 1, 2, 3].map((i) => { const [x, y] = inFlock(i, cx, cy, h, spread); return [x, y, h]; });
  }
  pos.forEach(([x, y, hd], i) => placeBird(i, x, y, hd, t));

  wishes.forEach((w, i) => {
    const a = 0.6 + i * 0.5;
    const k = back(p(t, a, a + 0.3)) * (1 - out3(p(t, 3.8, 4.3)));
    const [x, y] = pos[i];
    w.style.opacity = Math.min(1, k * 2);
    w.style.transform = `translate(${Math.min(Math.max(x, 190), 890)}px, ${y}px) scale(${Math.max(k, 0)})`;
  });

  const mapK = out3(p(t, 6.1, 6.7)) * (1 - out3(p(t, T.leave - 0.2, T.leave + 0.4)));
  pose(map, { o: mapK });

  const placeW = win(t, [T.place[0] + 0.2, T.place[1] - 0.1], 0.4);
  pins.forEach((pn, i) => {
    const lost = i < 2 ? out3(p(t, 8.5, 9.0)) : 0;
    const k = out3(p(t, 7.1 + i * 0.25, 7.5 + i * 0.25));
    const o = k * (1 - lost) * (1 - out3(p(t, 9.1, 9.5)));
    pose(pn.dot, { o, s: lerp(0.4, 1, k) });
    pose(pn.label, { o, y: (1 - k) * 20 });
    pn.label.style.transform += " translateX(-50%)";
  });
  void placeW;
  const ck = back(p(t, 8.9, 9.2));
  chosen.style.opacity = p(t, 8.9, 9.05) * (1 - out3(p(t, 9.1, 9.5)));
  chosen.style.transform = `scale(${ck})`;
  chosen.style.top = "524px";

  const flockLead = pos[0][0];
  dayPills.forEach((pl, i) => {
    const appear = out3(p(t, 9.7 + i * 0.05, 10.1 + i * 0.05));
    const passed = t > 10.2 && t < 12.6 && flockLead > 112 + i * 122 + 40 ? 1 : 0;
    const done = t >= 11.7 ? 1 : passed;
    const hide = 1 - out3(p(t, 12.2, 12.6));
    pose(pl, { o: appear * (done ? 1 : 1) * (t > 12.3 ? hide : 1), y: (1 - appear) * 40 + (done && t < 12.3 ? -8 : 0) });
    pl.style.background = done ? "var(--green-2)" : "var(--sheet)";
    pl.style.borderColor = done ? "var(--green-edge)" : "var(--rule)";
  });
  datesTag.style.opacity = p(t, 11.7, 11.85) * (1 - out3(p(t, 12.3, 12.6)));
  datesTag.style.transform = `scale(${back(p(t, 11.7, 12.0))})`;

  const routeVis = win(t, [T.route[0] + 0.3, T.route[1] + 0.6], 0.4);
  const u = t < 13.1 ? 0 : inOut(p(t, 13.1, 15.4));
  routePath.style.strokeDashoffset = 1 - u;
  routeSvg.style.opacity = routeVis;
  stopEls.forEach((s) => {
    const k = back(p(t, 13.1 + s.u * 2.3 - 0.1, 13.1 + s.u * 2.3 + 0.25));
    const o = p(t, 13.1 + s.u * 2.3 - 0.1, 13.1 + s.u * 2.3) * routeVis;
    pose(s.dot, { o, s: Math.max(k, 0.01) });
    pose(s.label, { o, y: (1 - Math.min(k, 1)) * 14 });
  });

  const [mx, my] = pos[0], [sx, sy] = pos[1], [jx, jy] = pos[2];
  const lk = out3(p(t, 16.4, 16.9));
  [[l1, sx, sy], [l2, jx, jy]].forEach(([ln, x, y]) => { ln.setAttribute("x1", x); ln.setAttribute("y1", y); ln.setAttribute("x2", mx); ln.setAttribute("y2", my); ln.style.opacity = lk * (1 - out3(p(t, T.leave - 0.3, T.leave)));
    ln.style.strokeDashoffset = -t * 50; });
  oweRows.forEach((r, i) => { const a = 16.7 + i * 0.6; const k = out3(p(t, a, a + 0.45)); pose(r, { o: k * (1 - out3(p(t, T.leave - 0.3, T.leave + 0.1))), y: (1 - k) * 50 }); });

  end(t);
}

run(DURATION, frame);
