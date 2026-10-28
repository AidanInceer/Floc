const DURATION = 23.5;
const GO = 2.4, LEG = 2.25, STOP = GO + 7 * LEG;
const STEPS = ["Start a trip", "Invite the group", "Pick a place", "Agree the dates", "Plan the days", "Split the costs", "Pack"];
const PRO_STEPS = [3, 6];
const startOf = (i) => GO + i * LEG;
const clock = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

const caps = [
  caption("Group trip speedrun. Go.", 0.1, GO, 290, 84),
  ...STEPS.map((s, i) => caption(`${i + 1}. ${s}`, startOf(i), startOf(i + 1), 290, 84)),
  caption("Trip sorted.", STOP, 20.6, 290, 84),
];

const watch = add(stage, '<div class="abs" style="left:80px;top:420px;display:flex;align-items:center;gap:22px"><span class="t mono" style="font-size:60px;font-weight:500;padding:6px 30px;border-radius:999px;background:var(--sheet);border:2px solid var(--rule-2)">0:00.0</span><span class="mono" style="font-size:30px;color:var(--ink-2)">speedrun</span></div>');
const watchT = watch.querySelector(".t");

const card = add(stage, '<div class="card" style="left:90px;top:540px;width:900px;height:580px;overflow:hidden"></div>');
const pane = () => add(card, '<div class="abs" style="inset:0"></div>');
const panes = STEPS.map(pane);
const btn = (parent, x, y, text) => add(parent, `<div class="abs" style="left:${x}px;top:${y}px;height:100px;padding:0 44px;border-radius:999px;background:var(--pen);color:#fff;display:flex;align-items:center;font-family:var(--display);font-weight:600;font-size:44px;letter-spacing:-0.03em">${text}</div>`);
const big = "font-family:var(--display);font-weight:600;letter-spacing:-0.03em";

add(panes[0], '<div class="abs mono" style="left:60px;top:70px;font-size:30px;color:var(--ink-2)">Trip name</div>');
add(panes[0], '<div class="abs" style="left:60px;top:120px;width:780px;height:120px;border-radius:28px;border:3px solid var(--pen);background:var(--sheet)"></div>');
const typed = add(panes[0], `<div class="abs" style="left:96px;top:146px;${big};font-size:60px"></div>`);
const create = btn(panes[0], 60, 300, "Create trip");
const created = add(panes[0], '<div class="tag green abs" style="left:440px;top:322px;height:60px;font-size:32px">Created</div>');

add(panes[1], '<div class="abs mono" style="left:60px;top:90px;width:540px;height:110px;border-radius:28px;background:var(--sheet-2);border:2px solid var(--rule);display:flex;align-items:center;padding:0 30px;font-size:36px">floc.app/join/k7q2</div>');
const copy = btn(panes[1], 630, 95, "Copy");
const copied = add(panes[1], '<div class="tag green abs" style="left:630px;top:118px;height:60px;font-size:32px">Copied</div>');
const joiners = [["M", "who-a"], ["S", "who-b"], ["J", "who-c"], ["A", "who-d"]].map(([l, c], i) => add(panes[1], `<div class="abs" style="left:${60 + i * 120}px;top:290px"><div class="chip ${c}" style="width:104px;height:104px;font-size:46px">${l}</div></div>`));
const going = add(panes[1], '<div class="abs mono" style="left:580px;top:320px;font-size:44px">4 going</div>');

const places = [["Lisbon", 4], ["Kyoto", 1], ["Marrakech", 2]].map(([n, v], i) => {
  const r = add(panes[2], `<div class="abs" style="left:60px;top:${60 + i * 150}px;width:780px;height:126px;border-radius:30px;border:2px solid var(--rule);background:var(--sheet);display:flex;align-items:center;padding:0 36px;${big};font-size:56px"><span>${n}</span><span class="n mono" style="margin-left:auto;font-weight:500">0</span></div>`);
  return { r, n: r.querySelector(".n"), v };
});
const chosen = add(panes[2], '<div class="tag blue abs" style="left:560px;top:36px">Chosen</div>');

const wTiles = weatherRow(panes[3], 34, 170, 112, 10);
const proWeather = add(panes[3], `<div class="abs" style="left:34px;top:60px;display:flex;align-items:center;gap:18px">${proTag()}<span class="mono" style="font-size:30px;color:var(--pro-ink-2)">weather, on the dates you picked</span></div>`);

const stops = [["Lisbon", 120], ["Sintra", 340], ["Évora", 560], ["Lagos", 780]];
const routeSvg = add(panes[4], `<svg class="abs" style="left:0;top:0" width="900" height="580" viewBox="0 0 900 580"><path class="rt" pathLength="1" d="M120 260 L340 260 L560 260 L780 260" stroke="var(--pen)" stroke-width="8" stroke-linecap="round" fill="none" stroke-dasharray="1 1"/>${stops.map(([n, x], i) => `<g class="st"><circle cx="${x}" cy="260" r="20" fill="var(--sheet)" stroke="var(--pen)" stroke-width="8"/><text x="${x}" y="350" text-anchor="middle" font-family="var(--display)" font-weight="600" font-size="42" fill="var(--ink)">${n}</text><text x="${x}" y="200" text-anchor="middle" font-family="var(--type)" font-size="28" fill="var(--ink-2)">${["days 1–2", "day 3", "days 4–5", "days 6–7"][i]}</text></g>`).join("")}</svg>`);
const rt = routeSvg.querySelector(".rt");
const sts = [...routeSvg.querySelectorAll(".st")];

const owes = [["Sam owes Maya", "£18.00"], ["Jo owes Maya", "£24.50"]].map(([a, b], i) => add(panes[5], `<div class="abs" style="left:50px;right:50px;top:${130 + i * 170}px;height:132px;border-radius:32px;background:var(--pen-2);border:2px solid var(--pen-edge);color:var(--pen-deep);display:flex;align-items:center;padding:0 40px;${big};font-size:52px"><span>${a}</span><span class="mono" style="margin-left:auto;font-weight:500">${b}</span></div>`));

const packRows = packingList(panes[6], 60, 100, 780);
const proPack = add(panes[6], `<div class="abs" style="left:60px;top:30px;display:flex;align-items:center;gap:18px">${proTag()}<span class="mono" style="font-size:30px;color:var(--pro-ink-2)">the packing list writes itself</span></div>`);

const splits = STEPS.map((s, i) => add(stage, `<div class="abs mono" style="left:96px;right:96px;top:${1156 + i * 54}px;display:flex;align-items:center;gap:16px;font-size:32px"><span class="nm">${s}</span>${PRO_STEPS.includes(i) ? `<span style="font-size:22px;padding:2px 12px;border-radius:999px;background:var(--pro-gold);color:var(--pro)">Pro</span>` : ""}<span class="tm" style="margin-left:auto">–:––</span></div>`));

const finalTime = add(stage, `<div class="abs" style="left:0;right:0;top:640px;text-align:center;${big};font-size:230px;letter-spacing:-0.05em"></div>`);
const sorted = add(stage, '<div class="abs" style="left:0;right:0;top:930px;display:flex;justify-content:center"><span class="tag green" style="height:84px;font-size:46px;padding:0 40px">Sorted</span></div>');
const honest = add(stage, `<div class="abs" style="left:80px;right:80px;top:1080px;text-align:center;${big};font-size:52px;color:var(--ink-2)">Real trips take a bit longer.<br>Not much longer.</div>`);

const end = endCard(20.8);

function frame(t) {
  caps.forEach((c) => c(t));
  const run = clamp((t - GO) / (STOP - GO)) * (STOP - GO);
  watchT.textContent = clock(run);
  const fin = p(t, STOP, STOP + 0.4);
  pose(watch, { o: out3(p(t, 0.6, 1.0)) * (1 - out3(p(t, STOP, STOP + 0.3))), s: 1 + Math.sin(fin * Math.PI) * 0.08 });
  watchT.style.borderColor = t > GO && t < STOP ? "var(--pen)" : "var(--rule-2)";

  const cardK = out3(p(t, GO - 0.4, GO));
  pose(card, { o: cardK * (1 - out3(p(t, STOP - 0.1, STOP + 0.3))), y: (1 - cardK) * 40 });
  panes.forEach((pn, i) => {
    const a = startOf(i), b = startOf(i + 1);
    const k = out3(p(t, a, a + 0.25)) * (1 - out3(p(t, b - 0.2, b)));
    pose(pn, { o: k, x: (1 - out3(p(t, a, a + 0.25))) * 80 - out3(p(t, b - 0.2, b)) * 80 });
  });
  splits.forEach((s, i) => {
    const done = t >= startOf(i + 1);
    const now = t >= startOf(i) && !done;
    const k = out3(p(t, GO - 0.3 + i * 0.05, GO + i * 0.05));
    pose(s, { o: k * (1 - out3(p(t, STOP + 0.1, STOP + 0.5))) });
    s.style.color = now ? "var(--ink)" : done ? "var(--ink-2)" : "var(--ink-3)";
    s.querySelector(".nm").style.fontWeight = now ? "500" : "400";
    const tm = s.querySelector(".tm");
    tm.textContent = done ? clock(startOf(i + 1) - GO) : "–:––";
    tm.style.color = done ? "var(--green)" : "";
  });

  let lt = t - startOf(0);
  typed.textContent = "Summer trip".slice(0, Math.round(11 * p(lt, 0.1, 0.9))) + (lt < 1.1 && Math.floor(t * 3) % 2 ? "|" : "");
  create.style.transform = `scale(${lt > 1.15 && lt < 1.35 ? 0.94 : 1})`;
  created.style.opacity = p(lt, 1.35, 1.45); created.style.transform = `scale(${back(p(lt, 1.35, 1.65))})`;

  lt = t - startOf(1);
  copy.style.opacity = 1 - p(lt, 0.5, 0.55);
  copied.style.opacity = p(lt, 0.5, 0.6); copied.style.transform = `scale(${back(p(lt, 0.5, 0.8))})`;
  joiners.forEach((j, i) => { const a = i === 0 ? -1 : 0.7 + i * 0.25; const k = back(p(lt, a, a + 0.3)); j.style.opacity = i === 0 ? 1 : p(lt, a, a + 0.08); j.style.transform = `scale(${i === 0 ? 1 : k})`; });
  going.style.opacity = p(lt, 1.6, 1.75);

  lt = t - startOf(2);
  places.forEach((pl, i) => { pl.n.textContent = Math.round(pl.v * p(lt, 0.2 + i * 0.1, 1.3)); pl.r.style.borderColor = i === 0 && lt > 1.45 ? "var(--pen)" : "var(--rule)"; pl.r.style.background = i === 0 && lt > 1.45 ? "var(--pen-2)" : "var(--sheet)"; });
  chosen.style.opacity = p(lt, 1.45, 1.55); chosen.style.transform = `scale(${back(p(lt, 1.45, 1.75))})`;

  lt = t - startOf(3);
  wTiles.forEach((w, i) => {
    const g = lt > 0.25 + i * 0.07;
    w.style.background = g ? "var(--green-2)" : "var(--sheet)";
    w.style.borderColor = g ? "var(--green-edge)" : "var(--rule)";
    const a = 1.0 + i * 0.07;
    const k = out4(p(lt, a, a + 0.3));
    const icon = w.querySelector("svg");
    icon.style.opacity = p(lt, a, a + 0.08); icon.style.transform = `translateY(${(1 - k) * -60}px)`;
    w.lastElementChild.style.opacity = p(lt, a + 0.1, a + 0.25);
  });
  pose(proWeather, { o: p(lt, 0.9, 1.05), s: back(p(lt, 0.9, 1.2)) });
  proWeather.style.transformOrigin = "0 50%";

  lt = t - startOf(4);
  rt.style.strokeDashoffset = 1 - out3(p(lt, 0.15, 1.4));
  sts.forEach((s, i) => { const a = 0.1 + i * 0.4; s.style.opacity = p(lt, a, a + 0.15); });

  lt = t - startOf(5);
  owes.forEach((o, i) => { const a = 0.2 + i * 0.5; const k = out3(p(lt, a, a + 0.4)); pose(o, { o: k, y: (1 - k) * 50 }); });

  lt = t - startOf(6);
  pose(proPack, { o: p(lt, 0.1, 0.25), s: back(p(lt, 0.1, 0.4)) });
  proPack.style.transformOrigin = "0 50%";
  tickList(packRows, t, startOf(6) + 0.3, 0.26);

  const fk = back(p(t, STOP + 0.2, STOP + 0.6));
  finalTime.textContent = clock(STOP - GO);
  finalTime.style.opacity = p(t, STOP + 0.2, STOP + 0.3) * (1 - out3(p(t, 20.4, 20.8)));
  finalTime.style.transform = `scale(${fk})`;
  sorted.style.opacity = p(t, STOP + 0.6, STOP + 0.7) * (1 - out3(p(t, 20.4, 20.8)));
  sorted.style.transform = `scale(${lerp(2.2, 1, out4(p(t, STOP + 0.6, STOP + 0.85)))}) rotate(-4deg)`;
  const hk = out3(p(t, STOP + 1.1, STOP + 1.5));
  pose(honest, { o: hk * (1 - out3(p(t, 20.4, 20.8))), y: (1 - hk) * 30 });

  end(t);
}

run(DURATION, frame);
