const DURATION = 23;
const P0 = 2.8, LEG = 3.0;
const PEOPLE = [
  { name: "Maya", n: 1, role: "the organiser", line: "Stops chasing everyone." },
  { name: "Sam", n: 2, role: "on a budget", line: "Knows exactly what to pay." },
  { name: "Jo", n: 3, role: "the packer", line: "Got Pro. The list wrote itself." },
  { name: "Alex", n: 4, role: "always late", line: "Has the whole plan on their phone." },
];
const startOf = (i) => P0 + i * LEG;
const PITCH = startOf(4), PARTY = PITCH + 3.8, END = PARTY + 1.9;
const big = "font-family:var(--display);font-weight:600;letter-spacing:-0.03em";
const face = (n, l, size) => `<div class="chip" style="width:${size}px;height:${size}px;font-size:${size * 0.46}px;background:var(--who-${n});color:var(--who-${n}-ink);border:none">${l}</div>`;

const caps = [
  caption("Four friends. One trip.", 0.1, P0, 290, 84),
  ...PEOPLE.map((pp, i) => caption(`${pp.name}, ${pp.role}.`, startOf(i), startOf(i + 1), 290, 84)),
  caption("Jo’s Pro covers everyone.", PITCH, PARTY, 290, 84),
  caption("The planning stays free.", PARTY, END, 290, 84),
];

const crowd = PEOPLE.map((pp, i) => add(stage, `<div class="abs" style="left:${70 + i * 240}px;top:720px;width:220px;display:flex;flex-direction:column;align-items:center;gap:20px">${face(pp.n, pp.name[0], 190)}<span style="${big};font-size:52px">${pp.name}</span></div>`));

const heads = PEOPLE.map((pp) => add(stage, `<div class="abs" style="left:90px;top:460px;right:80px;display:flex;align-items:center;gap:36px">${face(pp.n, pp.name[0], 150)}<span style="${big};font-size:62px;line-height:1.05">${pp.line}</span></div>`));
const cards = PEOPLE.map((pp, i) => add(stage, i === 2 ? proCard("left:90px;top:680px;width:900px;height:780px") : '<div class="card" style="left:90px;top:680px;width:900px;height:780px;overflow:hidden"></div>'));

add(cards[0], '<div class="abs mono" style="left:48px;top:40px;font-size:30px;color:var(--ink-2)">Dates · who’s replied</div>');
const replies = PEOPLE.map((pp, i) => {
  const r = add(cards[0], `<div class="abs" style="left:40px;right:40px;top:${110 + i * 130}px;height:110px;display:flex;align-items:center;gap:28px;border-bottom:2px solid var(--rule)">${face(pp.n, pp.name[0], 84)}<span style="${big};font-size:50px">${pp.name}</span><span class="tag" style="margin-left:auto;height:58px;font-size:30px"></span></div>`);
  return r.querySelector(".tag");
});
const allIn = add(cards[0], '<div class="abs" style="left:0;right:0;top:660px;display:flex;justify-content:center"><span class="tag green" style="height:76px;font-size:40px;padding:0 36px">All 4 in</span></div>');

const sheet = add(cards[1], '<div class="abs" style="left:60px;top:60px;width:780px;height:420px"></div>');
const cells = [];
for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
  const v = r === 0 ? ["Who", "Paid", "Owes", "??"][c] : c === 0 ? ["Maya", "Sam", "Jo", "Alex"][r - 1] : `${((r * 37 + c * 53) % 90) + 10}.${(r * c * 7) % 10}0`;
  cells.push(add(sheet, `<div class="abs mono" style="left:${c * 195}px;top:${r * 84}px;width:195px;height:84px;border:2px solid var(--rule-2);background:${r === 0 ? "var(--sheet-2)" : "var(--sheet)"};display:flex;align-items:center;padding:0 18px;font-size:30px;color:var(--ink-2)">${v}</div>`));
}
const owe = add(cards[1], `<div class="abs" style="left:50px;right:50px;top:250px;height:140px;border-radius:34px;background:var(--pen-2);border:2px solid var(--pen-edge);color:var(--pen-deep);display:flex;align-items:center;padding:0 40px;${big};font-size:56px"><span>Sam owes Maya</span><span class="mono" style="margin-left:auto;font-weight:500">£18.00</span></div>`);
const noSheet = add(cards[1], `<div class="abs" style="left:0;right:0;top:450px;text-align:center;${big};font-size:48px;color:var(--ink-2)">No spreadsheet needed.</div>`);

add(cards[2], `<div class="abs" style="left:56px;top:44px;display:flex;align-items:center;gap:18px">${proTag()}<span class="mono" style="font-size:30px;color:var(--pro-ink-2)">packing list for Lisbon</span></div>`);
const pack = packingList(cards[2], 56, 150, 780);

const phone = add(cards[3], '<div class="abs" style="left:225px;top:30px;width:450px;height:720px;border-radius:70px;border:16px solid var(--phone-frame);background:var(--paper);overflow:hidden"></div>');
add(phone, `<div class="abs" style="left:36px;top:60px"><div class="mono" style="font-size:26px;color:var(--ink-2)">Day 3 · today</div><div style="${big};font-size:64px;margin-top:6px">Sintra</div></div>`);
const plan = [["10:00", "Pena Palace"], ["13:30", "Lunch in town"], ["17:00", "Train to Lisbon"]].map(([tm, what], i) => add(phone, `<div class="abs" style="left:24px;right:24px;top:${230 + i * 130}px;height:112px;border-radius:26px;background:var(--sheet);border:2px solid var(--rule);display:flex;flex-direction:column;justify-content:center;padding:0 24px"><span class="mono" style="font-size:24px;color:var(--ink-2)">${tm}</span><span style="${big};font-size:38px">${what}</span></div>`));

const pitch = add(stage, proCard("left:90px;top:520px;width:900px;height:940px"));
add(pitch, `<div class="abs" style="left:48px;top:44px;display:flex;align-items:center;gap:18px">${proTag()}<span class="mono" style="font-size:30px;color:var(--pro-ink-2)">for the whole trip</span></div>`);
const PERKS = [["sun", "Weather on your dates"], ["check", "Packing lists that write themselves"], ["plane", "Booking links, filled in"], ["file", "1 GB for photos and tickets"]];
const perkRows = PERKS.map(([g, text], i) => add(pitch, `<div class="abs" style="left:48px;right:48px;top:${150 + i * 130}px;height:110px;display:flex;align-items:center;gap:28px;${big};font-size:48px"><span style="width:92px;height:92px;flex:none;border-radius:26px;background:var(--sheet);border:2px solid var(--pro-edge);display:grid;place-items:center;color:var(--pro-gold)">${glyph(g, 56)}</span>${text}</div>`));
const priceLine = add(pitch, `<div class="abs" style="left:48px;right:48px;top:700px;border-top:3px dashed var(--pro-edge);padding-top:40px;display:flex;align-items:baseline;gap:24px"><span style="${big};font-size:96px;letter-spacing:-0.05em">£3.99</span><span class="mono" style="font-size:34px;color:var(--pro-ink-2)">a month · under £1 each</span></div>`);

const end = endCard(END + 0.1);

function frame(t) {
  caps.forEach((c) => c(t));

  crowd.forEach((c, i) => {
    const a = 0.3 + i * 0.25;
    const k = back(p(t, a, a + 0.45));
    const party = t > PARTY ? Math.abs(Math.sin((t - PARTY) * 7 + i * 0.9)) * 60 * (1 - p(t, END - 0.3, END)) : 0;
    const vis = p(t, a, a + 0.1) * (1 - out3(p(t, P0 - 0.3, P0))) + out3(p(t, PARTY, PARTY + 0.4)) * (1 - out3(p(t, END - 0.2, END + 0.2)));
    const bob = t < P0 ? Math.sin(t * 5 + i) * 8 : 0;
    pose(c, { o: vis, s: t < P0 ? k : 1, y: bob - party });
  });

  PEOPLE.forEach((pp, i) => {
    const a = startOf(i), b = startOf(i + 1);
    const k = out3(p(t, a, a + 0.35)) * (1 - out3(p(t, b - 0.25, b)));
    pose(heads[i], { o: k, x: (1 - out3(p(t, a, a + 0.35))) * -60 });
    const ck = out3(p(t, a + 0.15, a + 0.5));
    pose(cards[i], { o: ck * (1 - out3(p(t, b - 0.25, b))), y: (1 - ck) * 60 });
  });

  let lt = t - startOf(0);
  replies.forEach((tag, i) => {
    const a = 0.7 + i * 0.35;
    const done = lt > a;
    tag.textContent = done ? "In" : "Waiting";
    tag.className = done ? "tag green" : "tag";
    if (!done) css(tag, { background: "var(--sheet-2)", color: "var(--ink-2)", borderColor: "var(--rule)" });
    else css(tag, { background: "", color: "", borderColor: "" });
    tag.style.transform = `scale(${done ? back(p(lt, a, a + 0.3)) : 1})`;
  });
  allIn.style.opacity = p(lt, 2.15, 2.25);
  allIn.style.transform = `scale(${back(p(lt, 2.15, 2.45))})`;

  lt = t - startOf(1);
  cells.forEach((c, i) => {
    const a = 0.1 + i * 0.015;
    const fall = p(lt, 1.0 + (i % 7) * 0.03, 1.55 + (i % 7) * 0.03);
    pose(c, { o: p(lt, a, a + 0.15) * (1 - fall), y: fall * fall * 500, r: fall * ((i % 3) - 1) * 40 });
  });
  const ok = back(p(lt, 1.45, 1.8));
  owe.style.opacity = p(lt, 1.45, 1.55); owe.style.transform = `scale(${ok})`;
  noSheet.style.opacity = p(lt, 1.9, 2.1);

  tickList(pack, t, startOf(2) + 0.6, 0.3);

  lt = t - startOf(3);
  const pk = out3(p(lt, 0.2, 0.7));
  pose(phone, { y: (1 - pk) * 300, r: (1 - pk) * 8 });
  plan.forEach((r, i) => { const a = 0.8 + i * 0.35; const k = out3(p(lt, a, a + 0.3)); pose(r, { o: k, x: (1 - k) * 50 }); });

  const pIn = out3(p(t, PITCH, PITCH + 0.45));
  pose(pitch, { o: pIn * (1 - out3(p(t, PARTY - 0.3, PARTY))), y: (1 - pIn) * 60 });
  perkRows.forEach((r, i) => { const a = PITCH + 0.4 + i * 0.4; const k = out3(p(t, a, a + 0.35)); pose(r, { o: k, x: (1 - k) * 60 }); });
  const prk = back(p(t, PITCH + 2.2, PITCH + 2.55));
  priceLine.style.opacity = p(t, PITCH + 2.2, PITCH + 2.3);
  priceLine.style.transform = `scale(${prk})`;
  priceLine.style.transformOrigin = "0 50%";

  end(t);
}

run(DURATION, frame);
