const DURATION = 20.6;
const ROW = 162, ROW0 = 112;

const caps = [
  caption("One pass for the whole trip.", 0.3, 2.0),
  caption("Where to?", 2.0, 5.0),
  caption("When?", 5.0, 8.0),
  caption("Who’s in?", 8.0, 10.8),
  caption("What’s the plan?", 10.8, 13.6),
  caption("Who owes who?", 13.6, 16.0),
  caption("Sorted.", 16.0, 17.9),
];

const pass = add(stage, '<div class="card" style="left:100px;top:520px;width:880px;height:940px;border-radius:44px"></div>');
add(pass, `<div class="abs" style="left:48px;top:30px">${markHtml(44, 56, 43)}</div>`);
add(pass, '<div class="abs mono" style="right:48px;top:40px;font-size:28px;color:var(--ink-2)">Group trip pass</div>');
add(pass, '<div class="abs" style="left:40px;right:40px;top:100px;border-top:3px dashed var(--rule-2)"></div>');
["left:-34px", "right:-34px"].forEach((side) => add(pass, `<div class="abs" style="${side};top:66px;width:68px;height:68px;border-radius:50%;background:var(--paper);border:2px solid var(--rule)"></div>`));

const rowAt = (i, label) => {
  const row = add(pass, `<div class="abs" style="left:22px;right:22px;top:${ROW0 + i * ROW}px;height:${ROW - 6}px;border-radius:28px;padding:18px 28px"><div class="mono" style="font-size:28px;color:var(--ink-2)">${label}</div></div>`);
  return row;
};
const rows = [rowAt(0, "To"), rowAt(1, "Dates"), rowAt(2, "Who’s in"), rowAt(3, "Route"), rowAt(4, "Owes")];
const windows = [[2.0, 5.0], [5.0, 8.0], [8.0, 10.8], [10.8, 13.6], [13.6, 16.0]];

const reel = (row, items, size) => {
  const win = add(row, `<div class="abs" style="left:28px;top:56px;width:520px;height:${size}px;overflow:hidden"></div>`);
  const strip = add(win, '<div class="abs" style="left:0;top:0"></div>');
  items.forEach((s) => add(strip, `<div style="height:${size}px;line-height:${size}px;font-family:var(--display);font-weight:600;font-size:${size * 0.78}px;letter-spacing:-0.035em;white-space:nowrap">${s}</div>`));
  return { win, strip, size, n: items.length - 1 };
};
const reelTo = reel(rows[0], ["Kyoto", "Marrakech", "Athens", "Porto", "Rome", "Split", "Lisbon"], 96);
const reelWhen = reel(rows[1], ["3 – 9 Aug", "29 Aug – 4 Sep", "7 – 13 Sep", "21 – 27 Sep", "1 – 7 Oct", "14 – 20 Sep"], 96);
const spin = (r, t, a, b) => {
  const f = (x) => out4(p(x, a, b));
  const k = f(t);
  const speed = Math.abs(f(t + 0.02) - f(t - 0.02)) / 0.04 * r.n * r.size;
  r.win.style.opacity = p(t, a - 0.1, a);
  r.strip.style.transform = `translateY(${-k * r.n * r.size}px)`;
  r.strip.style.filter = `blur(${Math.min(7, speed * 0.004)}px)`;
};
const tagTo = add(rows[0], '<div class="tag blue abs" style="right:28px;top:78px">Chosen</div>');
const tagWhen = add(rows[1], '<div class="tag green abs" style="right:28px;top:78px">All 4 free</div>');

const whoChips = [["M", "who-a"], ["S", "who-b"], ["J", "who-c"], ["A", "who-d"]].map(([l, c], i) => add(rows[2], `<div class="abs" style="left:${28 + i * 92}px;top:60px"><div class="chip ${c}" style="width:84px;height:84px;font-size:40px;border-color:var(--sheet-2)">${l}</div></div>`));
const going = add(rows[2], '<div class="abs mono" style="right:28px;top:84px;font-size:38px">4 going</div>');

const stops = [["Lisbon", 90], ["Sintra", 310], ["Évora", 530], ["Lagos", 750]];
const routeSvg = add(rows[3], `<svg class="abs" style="left:0;top:0" width="836" height="${ROW - 6}" viewBox="0 0 836 ${ROW - 6}"><path id="rt" pathLength="1" d="M90 84 L310 84 L530 84 L750 84" stroke="var(--pen)" stroke-width="6" stroke-linecap="round" fill="none" stroke-dasharray="1 1"/>${stops.map(([n, x]) => `<circle class="rd" cx="${x}" cy="84" r="14" fill="var(--sheet)" stroke="var(--pen)" stroke-width="6"/><text class="rl" x="${x}" y="136" text-anchor="middle" font-family="var(--display)" font-weight="600" font-size="34" fill="var(--ink)">${n}</text>`).join("")}</svg>`);
const rt = routeSvg.querySelector("#rt");
const rds = [...routeSvg.querySelectorAll(".rd")];
const rls = [...routeSvg.querySelectorAll(".rl")];

const owes = [["Sam owes Maya", "£18.00", 58], ["Jo owes Maya", "£24.50", 106]].map(([a, b, y]) => add(rows[4], `<div class="abs" style="left:28px;right:28px;top:${y}px;display:flex;font-family:var(--display);font-weight:600;font-size:44px;letter-spacing:-0.03em;line-height:1"><span>${a}</span><span class="mono" style="margin-left:auto;font-weight:500">${b}</span></div>`));

const stamp = add(stage, '<div class="abs" style="left:150px;top:880px;width:780px;display:flex;justify-content:center;pointer-events:none"><div style="padding:6px 52px 18px;border:12px solid var(--green);border-radius:36px;color:var(--green);background:var(--green-2);font-family:var(--display);font-weight:600;font-size:190px;letter-spacing:-0.04em;line-height:1.1">Sorted</div></div>');

const end = endCard(18.3);

function frame(t) {
  caps.forEach((c) => c(t));

  const drop = back(p(t, 0.1, 0.9));
  const passOut = inOut(p(t, 17.8, 18.5));
  const hit = Math.max(0, 1 - p(t, 16.3, 16.75)) * (t > 16.3 ? 1 : 0);
  pose(pass, { o: p(t, 0.1, 0.3) * (1 - passOut), y: (1 - drop) * -700 - passOut * 500 + Math.sin(t * 90) * hit * 10, r: (1 - drop) * -5 + passOut * 6, s: 1 - passOut * 0.1 });

  rows.forEach((r, i) => {
    const [a, b] = windows[i];
    const on = p(t, a, a + 0.25) * (1 - p(t, b - 0.2, b));
    r.style.background = `rgba(238, 236, 231, ${on * 0.7})`;
  });
  spin(reelTo, t, 2.4, 4.1);
  spin(reelWhen, t, 5.3, 6.9);
  const tk = (a) => back(p(t, a, a + 0.3));
  tagTo.style.opacity = p(t, 4.2, 4.35); tagTo.style.transform = `scale(${tk(4.2)})`;
  tagWhen.style.opacity = p(t, 7.0, 7.15); tagWhen.style.transform = `scale(${tk(7.0)})`;

  whoChips.forEach((c, i) => { const a = 8.4 + i * 0.5; const k = p(t, a, a + 0.3); pose(c, { o: p(t, a, a + 0.08), s: lerp(1.8, 1, out4(k)) }); });
  going.style.opacity = p(t, 10.2, 10.4);

  rt.style.strokeDashoffset = 1 - out3(p(t, 11.2, 12.7));
  rds.forEach((d, i) => { const a = 11.1 + i * 0.5; d.style.transformBox = "fill-box"; d.style.transformOrigin = "center"; d.style.transform = `scale(${back(p(t, a, a + 0.3))})`; d.style.opacity = p(t, a, a + 0.1); });
  rls.forEach((l, i) => { l.style.opacity = p(t, 11.2 + i * 0.5, 11.5 + i * 0.5); });
  owes.forEach((o, i) => { const a = 14.0 + i * 0.7; const k = out3(p(t, a, a + 0.4)); pose(o, { o: k, x: (1 - k) * 60 }); });

  const sk = p(t, 16.3, 16.55);
  const sIn = 1 - p(t, 17.6, 17.95);
  pose(stamp, { o: p(t, 16.3, 16.4) * sIn, s: lerp(2.6, 1, out4(sk)), r: -9 });
  end(t);
}

run(DURATION, frame);
