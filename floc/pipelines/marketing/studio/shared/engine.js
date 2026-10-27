// Every frame is a pure function of time: run() exposes seek(t); render.mjs steps t by 1/FPS.
const CTA_URL = "floc.app";
const FPS = 30;

const clamp = (x) => Math.min(1, Math.max(0, x));
const p = (t, a, b) => clamp((t - a) / (b - a));
const out3 = (x) => 1 - Math.pow(1 - x, 3);
const out4 = (x) => 1 - Math.pow(1 - x, 4);
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c = 2.70158; return 1 + c * Math.pow(x - 1, 3) + (c - 1) * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;

const stage = document.getElementById("stage");
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const css = (node, o) => { for (const k in o) node.style[k] = o[k]; };
const pose = (node, { o = 1, x = 0, y = 0, s = 1, r = 0 }) => { node.style.opacity = o; node.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`; };
const chip = (cls, letter) => `<div class="chip ${cls}">${letter}</div>`;
const add = (parent, html) => { const n = el(html); parent.append(n); return n; };

const CHEVRONS = '<path pathLength="1" d="M3 14 6.5 10.5 10 14"/><path pathLength="1" d="M9.5 8.5 13 5 16.5 8.5"/><path pathLength="1" d="M16 14 19.5 10.5 23 14"/>';
const markHtml = (size, w, h) => `<span class="mark" style="font-size:${size}px"><svg viewBox="0 0 26 20" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${CHEVRONS}</svg><span>floc<span class="dot">.</span></span></span>`;

function caption(text, a, b, top = 290, size) {
  const n = add(stage, `<div class="cap" style="top:${top}px${size ? `;font-size:${size}px` : ""}">${text}</div>`);
  return (t) => {
    const inK = out3(p(t, a, a + 0.45));
    const outK = b === undefined ? 0 : out3(p(t, b - 0.35, b));
    pose(n, { o: inK * (1 - outK), y: (1 - inK) * 46 - outK * 30 });
  };
}

// End card shared by every version: wordmark, the line, the button, the address.
function endCard(at) {
  const mark = add(stage, `<div class="abs" style="left:0;right:0;top:560px;display:flex;justify-content:center">${markHtml(190, 236, 182)}</div>`);
  const line = add(stage, '<div class="cap" style="top:840px;left:60px;right:60px;text-align:center">Group trip planning, sorted.</div>');
  const cta = add(stage, '<div class="cta" style="left:50%;top:1150px;margin-left:-310px">Start a trip — free</div>');
  const url = add(stage, `<div class="url" style="top:1330px">${CTA_URL}</div>`);
  return (t) => {
    const m = out3(p(t, at, at + 0.6));
    pose(mark, { o: m, y: (1 - m) * 40, s: lerp(0.9, 1, m) });
    const l = out3(p(t, at + 0.5, at + 1.0));
    pose(line, { o: l, y: (1 - l) * 40 });
    const c = back(p(t, at + 1.1, at + 1.6));
    cta.style.opacity = p(t, at + 1.1, at + 1.3);
    cta.style.transform = `scale(${c})`;
    url.style.opacity = out3(p(t, at + 1.5, at + 1.9));
  };
}

function run(duration, frame) {
  window.seek = frame;
  window.PROMO = { FPS, DURATION: duration };
  window.promoReady = document.fonts.ready.then(() => Promise.all([
    document.fonts.load('600 40px "Bricolage Grotesque"'),
    document.fonts.load('400 40px "Instrument Sans"'),
    document.fonts.load('400 40px "DM Mono"'),
    document.fonts.load('500 40px "DM Mono"'),
  ]));
  const q = new URLSearchParams(location.search);
  if (q.has("t")) frame(parseFloat(q.get("t")));
  else {
    const t0 = performance.now();
    const tick = () => { frame(((performance.now() - t0) / 1000) % duration); requestAnimationFrame(tick); };
    tick();
  }
}
