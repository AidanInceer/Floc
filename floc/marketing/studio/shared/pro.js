const GLYPH = {
  sun: '<circle cx="7" cy="7" r="2.6"/><path d="M7 1.2v1.4M7 11.4v1.4M1.2 7h1.4M11.4 7h1.4M2.9 2.9l1 1M10.1 10.1l1 1M2.9 11.1l1-1M10.1 3.9l1-1"/>',
  cloud: '<path d="M4 11h6.2a2.4 2.4 0 0 0 .3-4.8A3.3 3.3 0 0 0 4.2 6.4 2.3 2.3 0 0 0 4 11z"/>',
  part: '<circle cx="5" cy="5" r="2"/><path d="M5 1.4v.9M1.4 5h.9M2.5 2.5l.6.6M7.5 2.5l-.6.6"/><path d="M6 12h4.6a2 2 0 0 0 .2-4 2.7 2.7 0 0 0-5 .6A1.7 1.7 0 0 0 6 12z"/>',
  check: '<path d="M3 7.4l2.6 2.6L11 4.6"/>',
  file: '<path d="M4 1.5h4l2.5 2.5v8.5H4z"/><path d="M8 1.5V4h2.5"/>',
  plane: '<path d="M7 1.8c.6 0 .9.6.9 1.3v2.6l4.3 2.5v1.3L7.9 8.3v2.4l1.4 1v1L7 12.1l-2.3.6v-1l1.4-1V8.3L1.8 9.5V8.2l4.3-2.5V3.1c0-.7.3-1.3.9-1.3Z"/>',
};
const glyph = (name, size, colour = "currentColor") => `<svg viewBox="0 0 14 14" width="${size}" height="${size}" fill="none" stroke="${colour}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${GLYPH[name]}</svg>`;

const proTag = (text = "Pro") => `<span class="tag" style="background:var(--pro-gold);color:var(--pro);border-color:var(--pro-gold);font-weight:500">${text}</span>`;
const proCard = (style) => `<div class="card" style="background:var(--pro);border-color:var(--pro-edge);color:var(--pro-ink);${style}"></div>`;

const WEATHER = [["Mon", 14, "sun", 26], ["Tue", 15, "sun", 27], ["Wed", 16, "part", 24], ["Thu", 17, "sun", 28], ["Fri", 18, "cloud", 22], ["Sat", 19, "sun", 27], ["Sun", 20, "part", 25]];
function weatherRow(parent, left, top, w = 112, gap = 10) {
  return WEATHER.map(([d, n, g, c], i) => add(parent, `<div class="abs" style="left:${left + i * (w + gap)}px;top:${top}px;width:${w}px;height:220px;border-radius:26px;background:var(--sheet);border:2px solid var(--pro-edge);display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:14px 0;color:var(--ink)"><span class="mono" style="font-size:24px;color:var(--ink-2)">${d}</span><span style="font-family:var(--display);font-weight:600;font-size:42px;line-height:1">${n}</span>${glyph(g, 56, "var(--pro-gold)")}<span class="mono" style="font-size:28px">${c}°</span></div>`));
}

const PACKING = ["Sun cream", "Swimwear", "Plug adapter", "Walking shoes", "Passport"];
function packingList(parent, left, top, width) {
  return PACKING.map((item, i) => add(parent, `<div class="abs" style="left:${left}px;top:${top + i * 92}px;width:${width}px;height:76px;display:flex;align-items:center;gap:24px;font-family:var(--display);font-weight:600;font-size:46px;letter-spacing:-0.03em;color:var(--ink)"><span class="box" style="width:56px;height:56px;border-radius:16px;border:3px solid var(--pro-edge);background:var(--sheet);display:grid;place-items:center;color:var(--green)">${glyph("check", 40)}</span>${item}</div>`));
}
const tickList = (rows, t, a, step = 0.28) => rows.forEach((r, i) => {
  const k = out3(p(t, a + i * step, a + i * step + 0.3));
  pose(r, { o: k, x: (1 - k) * 40 });
  const tick = r.querySelector(".box svg");
  const tk = back(p(t, a + i * step + 0.2, a + i * step + 0.45));
  tick.style.transform = `scale(${tk})`;
  tick.style.opacity = p(t, a + i * step + 0.2, a + i * step + 0.3);
  r.querySelector(".box").style.background = tk > 0.5 ? "var(--green-2)" : "var(--sheet)";
  r.querySelector(".box").style.borderColor = tk > 0.5 ? "var(--green-edge)" : "var(--pro-edge)";
});
