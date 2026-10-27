const DURATION = 24.5;
const PERKS = [10.0, 11.7, 13.4, 15.1];

const caps = [
  caption("Planning a group trip?", 0.1, 3.1, 290, 84),
  caption("Everything the group needs is free.", 3.3, 8.7, 290, 84),
  caption("Want a few extras?", 8.8, 10.0, 290, 84),
  caption("Pro adds the extras.", 10.0, 16.7, 290, 84),
  caption("One Pro covers the whole trip.", 16.8, 19.6, 290, 84),
  caption("And no catch.", 19.7, 22.0, 290, 84),
];

const zero = add(stage, '<div class="abs" style="left:0;right:0;top:640px;text-align:center;font-family:var(--display);font-weight:600;font-size:460px;letter-spacing:-0.06em;line-height:1">£0</div>');
const zeroSub = add(stage, '<div class="abs" style="left:0;right:0;top:1150px;text-align:center;font-family:var(--display);font-weight:600;font-size:64px;letter-spacing:-0.03em;color:var(--ink-2)">to plan it together</div>');

const FREE = [["Vote on where to go", "yellow"], ["Find dates that work", "blue"], ["Plan it day by day", "blue"], ["Split the costs", "green"], ["Pack together", "yellow"]];
const freeRows = FREE.map(([name, tone], i) => {
  const r = add(stage, `<div class="card" style="left:96px;top:${560 + i * 166}px;width:888px;height:140px;display:flex;align-items:center;gap:28px;padding:0 36px;border-radius:32px"><span style="width:30px;height:30px;border-radius:50%;background:var(--pastel-${tone}-ink)"></span><span style="font-family:var(--display);font-weight:600;font-size:54px;letter-spacing:-0.03em">${name}</span></div>`);
  const tag = add(r, '<span class="tag green" style="margin-left:auto;height:60px;font-size:32px">Free</span>');
  return { r, tag };
});

const pro = add(stage, proCard("left:90px;top:540px;width:900px;height:920px;border-radius:44px;overflow:hidden"));
add(pro, `<div class="abs" style="left:44px;top:40px;display:flex;align-items:center;gap:20px">${proTag()}<span class="mono" style="font-size:28px;color:var(--pro-ink-2)">for the whole trip</span></div>`);
const perkTitle = (text) => add(pro, `<div class="abs" style="left:44px;right:44px;top:130px;font-family:var(--display);font-weight:600;font-size:66px;letter-spacing:-0.035em;line-height:1.05">${text}</div>`);
const perks = [
  { title: perkTitle("Weather on your dates") },
  { title: perkTitle("A packing list that writes itself") },
  { title: perkTitle("Booking links, filled in") },
  { title: perkTitle("More room for photos and tickets") },
];
perks[0].items = weatherRow(pro, 22, 400);
perks[1].items = packingList(pro, 60, 330, 780);
const booking = add(pro, '<div class="abs" style="left:44px;right:44px;top:360px"></div>');
const fields = [["Where", "Lisbon"], ["When", "14 – 20 Sep"], ["Who", "4 people"]].map(([l, v], i) => add(booking, `<div class="abs" style="left:0;right:0;top:${i * 128}px;height:112px;border-radius:28px;background:var(--sheet);border:2px solid var(--pro-edge);display:flex;align-items:center;padding:0 32px;gap:28px"><span class="mono" style="font-size:28px;color:var(--ink-2);width:110px">${l}</span><span class="v" style="font-family:var(--display);font-weight:600;font-size:50px;letter-spacing:-0.03em;color:var(--ink)"></span></div>`));
const fieldText = fields.map((f) => f.querySelector(".v"));
const fieldFull = ["Lisbon", "14 – 20 Sep", "4 people"];
const search = add(booking, `<div class="abs" style="left:0;top:400px;height:104px;padding:0 44px;border-radius:999px;background:var(--pen);color:#fff;display:flex;align-items:center;gap:20px;font-family:var(--display);font-weight:600;font-size:46px;letter-spacing:-0.03em">${glyph("plane", 48, "#fff")}Search flights</div>`);
const store = add(pro, '<div class="abs" style="left:44px;right:44px;top:400px"></div>');
add(store, '<div class="abs" style="left:0;right:0;top:0;height:64px;border-radius:999px;background:var(--sheet);border:2px solid var(--pro-edge);overflow:hidden"><div class="fill" style="height:100%;width:0;background:var(--pro-gold)"></div></div>');
const storeFill = store.querySelector(".fill");
const storeNum = add(store, '<div class="abs mono" style="left:0;top:96px;font-size:56px;font-weight:500;color:var(--pro-ink)"></div>');
add(store, '<div class="abs mono" style="right:0;top:110px;font-size:30px;color:var(--pro-ink-2)">per trip</div>');
const files = [0, 1, 2, 3, 4, 5].map((i) => add(store, `<div class="abs" style="left:${i * 136}px;top:220px;width:116px;height:150px;border-radius:22px;background:var(--sheet);border:2px solid var(--pro-edge);display:grid;place-items:center;color:var(--pro-gold)">${glyph("file", 62)}</div>`));

const price = add(pro, '<div class="abs" style="left:44px;right:44px;top:130px"><div style="font-family:var(--display);font-weight:600;font-size:150px;letter-spacing:-0.05em;line-height:1;color:var(--pro-ink)">£3.99</div><div class="mono" style="font-size:34px;color:var(--pro-ink-2);margin-top:12px">a month · cancel any time</div></div>');
const SIX = [["M", 1], ["S", 2], ["J", 3], ["A", 4], ["R", 5], ["K", 6]];
const shares = SIX.map(([l, n], i) => add(pro, `<div class="abs" style="left:${70 + (i % 3) * 270}px;top:${470 + Math.floor(i / 3) * 200}px;display:flex;flex-direction:column;align-items:center;gap:10px;width:220px"><div class="chip" style="width:104px;height:104px;font-size:48px;background:var(--who-${n});color:var(--who-${n}-ink);border-color:var(--pro)">${l}</div><span class="mono" style="font-size:40px;font-weight:500">67p</span></div>`));

const PROMISES = ["No ads.", "No booking commission.", "We never sell your data."];
const promises = PROMISES.map((s, i) => add(stage, `<div class="abs" style="left:96px;right:60px;top:${660 + i * 210}px;display:flex;align-items:center;gap:30px;font-family:var(--display);font-weight:600;font-size:64px;white-space:nowrap;letter-spacing:-0.035em"><span style="width:110px;height:110px;flex:none;border-radius:50%;background:var(--green-2);border:3px solid var(--green-edge);display:grid;place-items:center;color:var(--green)">${glyph("check", 72)}</span>${s}</div>`));

const end = endCard(22.0);
const proLine = add(stage, '<div class="url" style="top:1420px;font-size:34px">Pro from £3.99 a month, shared by the trip</div>');

const shown = (t, a, b) => out3(p(t, a, a + 0.3)) * (1 - out3(p(t, b - 0.25, b)));

function frame(t) {
  caps.forEach((c) => c(t));

  const zk = back(p(t, 0.3, 0.8));
  const zOut = out3(p(t, 2.8, 3.3));
  pose(zero, { o: p(t, 0.3, 0.45) * (1 - zOut), s: zk * (1 - zOut * 0.4), y: -zOut * 200 });
  const sk = out3(p(t, 1.1, 1.6));
  pose(zeroSub, { o: sk * (1 - zOut), y: (1 - sk) * 30 });

  freeRows.forEach(({ r, tag }, i) => {
    const a = 3.7 + i * 0.85;
    const k = out3(p(t, a, a + 0.45));
    const leave = inOut(p(t, 8.2 + i * 0.06, 8.75 + i * 0.06));
    pose(r, { o: k * (1 - leave), x: (1 - k) * (i % 2 ? 160 : -160), y: leave * 300 });
    tag.style.opacity = p(t, a + 0.4, a + 0.5);
    tag.style.transform = `scale(${lerp(2.2, 1, out4(p(t, a + 0.4, a + 0.65)))}) rotate(${(1 - p(t, a + 0.4, a + 0.65)) * -12}deg)`;
  });

  const flip = out3(p(t, 8.9, 9.6));
  const proOut = inOut(p(t, 19.3, 19.8));
  pro.style.opacity = p(t, 8.9, 9.0) * (1 - proOut);
  pro.style.transform = `perspective(2200px) rotateY(${(1 - flip) * 80}deg) translateY(${proOut * -160}px) scale(${1 - proOut * 0.1})`;

  perks.forEach((pk, i) => {
    const a = PERKS[i], b = i < 3 ? PERKS[i + 1] : 16.7;
    const k = shown(t, a, b);
    pose(pk.title, { o: k, y: (1 - out3(p(t, a, a + 0.3))) * 30 });
  });
  perks[0].items.forEach((d, i) => { const a = PERKS[0] + 0.25 + i * 0.1; const k = out4(p(t, a, a + 0.35)); pose(d, { o: p(t, a, a + 0.1) * shown(t, PERKS[0], PERKS[1]), y: (1 - k) * -120 }); });
  const packVis = shown(t, PERKS[1], PERKS[2]);
  tickList(perks[1].items, t, PERKS[1] + 0.25, 0.22);
  perks[1].items.forEach((r) => { r.style.opacity = Number(r.style.opacity) * packVis; });
  booking.style.opacity = shown(t, PERKS[2], PERKS[3]);
  fields.forEach((f, i) => { const a = PERKS[2] + 0.2 + i * 0.32; const k = out3(p(t, a, a + 0.25)); pose(f, { o: k, y: (1 - k) * 30 }); fieldText[i].textContent = fieldFull[i].slice(0, Math.round(fieldFull[i].length * p(t, a + 0.1, a + 0.4))); });
  const sk2 = back(p(t, PERKS[2] + 1.15, PERKS[2] + 1.45));
  search.style.opacity = p(t, PERKS[2] + 1.15, PERKS[2] + 1.25);
  search.style.transform = `scale(${sk2})`;
  store.style.opacity = shown(t, PERKS[3], 16.7);
  const g = inOut(p(t, PERKS[3] + 0.3, PERKS[3] + 1.2));
  storeFill.style.width = `${lerp(20, 100, g)}%`;
  storeNum.textContent = g < 1 ? `${Math.round(lerp(200, 1000, g))} MB` : "1 GB";
  files.forEach((f, i) => { const a = PERKS[3] + 0.3 + i * 0.12; const k = back(p(t, a, a + 0.3)); f.style.opacity = p(t, a, a + 0.1); f.style.transform = `scale(${k})`; });

  pose(price, { o: shown(t, 16.8, 19.4), y: (1 - out3(p(t, 16.8, 17.2))) * 30 });
  shares.forEach((s, i) => { const a = 17.5 + i * 0.14; const k = back(p(t, a, a + 0.35)); s.style.opacity = p(t, a, a + 0.1) * (1 - p(t, 19.15, 19.4)); s.style.transform = `scale(${k})`; });

  promises.forEach((pr, i) => { const a = 20.0 + i * 0.45; const k = out3(p(t, a, a + 0.4)); pose(pr, { o: k * (1 - out3(p(t, 21.7, 22.0))), x: (1 - k) * -80 }); });

  end(t);
  proLine.style.opacity = out3(p(t, 23.6, 24.0));
}

run(DURATION, frame);
