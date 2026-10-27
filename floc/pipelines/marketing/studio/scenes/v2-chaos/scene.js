const DURATION = 18.5;
const COLLAPSE = 6.5;

const capHook = caption("Planning a trip in the group chat?", 0.1, COLLAPSE - 0.1, 290, 84);
const capChain = [
  caption("One page for the whole group.", COLLAPSE + 0.7, 8.9, 290, 84),
  caption("Where you’re going.", 8.9, 10.6, 290, 84),
  caption("The dates everyone can make.", 10.6, 12.3, 290, 84),
  caption("The plan, day by day.", 12.3, 14.1, 290, 84),
  caption("And who owes who.", 14.1, 15.7, 290, 84),
];

const MSG = [
  ["M", "who-a", "where are we going??", "l", 0.4],
  ["S", "who-b", "anywhere hot tbh", "r", 1.2],
  ["J", "who-c", "i can only do the 14th–20th", "l", 2.0],
  ["A", "who-d", "wait which dates??", "r", 2.7],
  ["S", "who-b", "who’s booking the flights", "l", 3.4],
  ["M", "who-a", "did anyone split the taxi", "r", 4.0],
  ["J", "who-c", "someone make a spreadsheet", "l", 4.5],
  ["A", "who-d", "what’s the plan for day 2", "r", 4.95],
  ["M", "who-a", "scrolling up for the hotel link", "l", 5.35],
  ["S", "who-b", "??????", "r", 5.7],
];
const chat = add(stage, '<div class="card" style="left:90px;top:520px;width:900px;height:980px;overflow:hidden"></div>');
const head = add(chat, '<div class="abs" style="left:0;right:0;top:0;height:112px;border-bottom:2px solid var(--rule);background:var(--sheet);z-index:3;display:flex;align-items:center;padding:0 40px;gap:20px"><span style="font-family:var(--display);font-weight:600;font-size:48px;letter-spacing:-0.03em">Summer trip</span><span class="tag red" style="margin-left:auto"></span></div>');
const badge = head.querySelector(".tag");
const bubbles = MSG.map(([l, cls, text, side]) => {
  const row = add(chat, `<div class="abs" style="left:32px;right:32px;top:0;display:flex;gap:16px;align-items:flex-end;flex-direction:${side === "l" ? "row" : "row-reverse"}">${chip(cls, l)}<div style="padding:22px 32px;border-radius:40px;background:var(--${cls === "who-a" ? "who-1" : cls === "who-b" ? "who-2" : cls === "who-c" ? "who-3" : "who-4"});font-size:40px;line-height:1.15;white-space:nowrap">${text}</div></div>`);
  return row;
});
const STEP = 136, BOTTOM = 830;

const trip = add(stage, '<div class="card" style="left:90px;top:540px;width:900px;height:960px"></div>');
const tHead = add(trip, `<div class="abs" style="left:44px;right:44px;top:36px;display:flex;align-items:center"><div><div style="font-family:var(--display);font-weight:600;font-size:80px;letter-spacing:-0.035em;line-height:1">Lisbon</div></div><div style="margin-left:auto;display:flex">${[["M", "who-a"], ["S", "who-b"], ["J", "who-c"], ["A", "who-d"]].map(([l, c]) => `<div style="margin-left:-12px">${chip(c, l)}</div>`).join("")}</div></div>`);
const rowBox = (top, h, tone, label) => add(trip, `<div class="abs" style="left:32px;right:32px;top:${top}px;height:${h}px;border-radius:28px;background:var(--pastel-${tone});border:2px solid var(--pastel-${tone}-edge);padding:22px 32px"><div class="mono" style="font-size:28px;color:var(--pastel-${tone}-ink)">${label}</div></div>`);

const rWhere = rowBox(160, 150, "yellow", "Where");
add(rWhere, '<div class="abs" style="left:32px;top:68px;font-family:var(--display);font-weight:600;font-size:60px;letter-spacing:-0.03em;line-height:1">Lisbon, Portugal</div>');
const whereTag = add(rWhere, '<div class="tag blue abs" style="right:28px;top:24px">Chosen</div>');

const rWhen = rowBox(334, 210, "blue", "When");
add(rWhen, '<div class="abs" style="left:32px;top:62px;font-family:var(--display);font-weight:600;font-size:60px;letter-spacing:-0.03em;line-height:1">14 – 20 Sep</div>');
const pills = [14, 15, 16, 17, 18, 19, 20].map((d, i) => add(rWhen, `<div class="abs mono" style="left:${32 + i * 112}px;top:138px;width:100px;height:48px;border-radius:16px;background:var(--green-2);border:2px solid var(--green-edge);color:var(--green);font-size:26px;display:grid;place-items:center">${d}</div>`));

const rPlan = rowBox(568, 210, "green", "Plan");
const stops = [["Lisbon", 60], ["Sintra", 290], ["Évora", 520], ["Lagos", 750]];
add(rPlan, `<svg class="abs" style="left:0;top:0" width="836" height="206" viewBox="0 0 836 206"><path id="plan-line" pathLength="1" d="M60 100 L290 100 L520 100 L750 100" stroke="var(--pen)" stroke-width="6" stroke-linecap="round" fill="none" stroke-dasharray="1 1"/>${stops.map(([n, x]) => `<circle class="plan-dot" cx="${x}" cy="100" r="15" fill="var(--sheet)" stroke="var(--pen)" stroke-width="6"/><text x="${x}" y="164" text-anchor="middle" font-family="var(--display)" font-weight="600" font-size="34" fill="var(--ink)">${n}</text>`).join("")}</svg>`);
const planLine = rPlan.querySelector("#plan-line");
const planDots = [...rPlan.querySelectorAll(".plan-dot")];

const rMoney = rowBox(802, 124, "green", "Money");
add(rMoney, '<div class="abs" style="left:150px;top:30px;font-family:var(--display);font-weight:600;font-size:48px;letter-spacing:-0.03em;line-height:1;white-space:nowrap">Sam owes Maya <span class="mono" style="font-weight:500;font-size:48px;margin-left:24px">£18.00</span></div>');
const rows = [[rWhere, 8.9], [rWhen, 10.6], [rPlan, 12.3], [rMoney, 14.1]];

const end = endCard(15.9);

function frame(t) {
  capHook(t);
  const shake = out3(p(t, 4.6, COLLAPSE)) * 5;
  const collapse = inOut(p(t, COLLAPSE, COLLAPSE + 0.7));
  let n = 0;
  MSG.forEach((m) => { n += out3(p(t, m[4], m[4] + 0.35)); });
  const chatIn = out3(p(t, 0, 0.4));
  pose(chat, { o: chatIn * (1 - collapse), y: (1 - chatIn) * 40, s: 1 - collapse * 0.1, x: Math.sin(t * 61) * shake });
  badge.textContent = `${Math.round(n * 4.7 + 2)} unread`;
  bubbles.forEach((b, i) => {
    const k = out3(p(t, MSG[i][4], MSG[i][4] + 0.35));
    const y = 112 + BOTTOM - 112 - (n - 1 - i) * STEP;
    const fade = clamp((y - 120) / 90);
    pose(b, { o: k * fade, y: y - 0, r: (i % 2 ? 1 : -1) * (0.8 + shake * 0.25) });
  });

  const tk = back(p(t, COLLAPSE + 0.55, COLLAPSE + 1.15));
  const tOut = out3(p(t, 15.6, 16.2));
  pose(trip, { o: p(t, COLLAPSE + 0.55, COLLAPSE + 0.8) * (1 - tOut), s: lerp(0.88, 1, Math.min(tk, 1.04)) * (1 - tOut * 0.08), y: -tOut * 60 });
  const hk = out3(p(t, COLLAPSE + 1.0, COLLAPSE + 1.5));
  pose(tHead, { o: hk, y: (1 - hk) * 20 });
  rows.forEach(([r, at]) => { const k = out3(p(t, at - 0.2, at + 0.35)); pose(r, { o: k, y: (1 - k) * 60 }); });
  const wt = back(p(t, 9.6, 9.95));
  whereTag.style.opacity = p(t, 9.6, 9.75);
  whereTag.style.transform = `scale(${wt})`;
  pills.forEach((pl, i) => { const k = back(p(t, 11.0 + i * 0.1, 11.3 + i * 0.1)); pl.style.opacity = p(t, 11.0 + i * 0.1, 11.15 + i * 0.1); pl.style.transform = `scale(${k})`; });
  planLine.style.strokeDashoffset = 1 - out3(p(t, 12.7, 13.7));
  planDots.forEach((d, i) => { const k = back(p(t, 12.6 + i * 0.3, 12.9 + i * 0.3)); d.style.transformBox = "fill-box"; d.style.transformOrigin = "center"; d.style.transform = `scale(${k})`; d.style.opacity = p(t, 12.6 + i * 0.3, 12.7 + i * 0.3); });
  capChain.forEach((c) => c(t));
  end(t);
}

run(DURATION, frame);
