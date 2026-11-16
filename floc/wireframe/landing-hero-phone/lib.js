export const group = [
  { name: "Priya", tone: 1 }, { name: "Sam", tone: 4 }, { name: "Jo", tone: 2 },
  { name: "Alex", tone: 3 }, { name: "Maya", tone: 6 }, { name: "Kit", tone: 7 },
];
export const face = (p, size = 26) => `<span class="hp-face who-${p.tone}" style="--s:${size}px" title="${p.name}">${p.name.slice(0, 2)}</span>`;

export const PLANE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5v-1.6l-8-5V3.4a1.5 1.5 0 0 0-3 0v5.5l-8 5v1.6l8-2.5v5.5l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5v-5.5Z"/></svg>`;

export const h1 = (cls = "") => `<h1 class="hp-h1 ${cls}">Trip planning, <span class="hp-sorted">sorted.<svg class="hp-mark" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M9 6 C70 3 140 5 199 2 L193 31 C130 34 60 36 2 38 Z"/></svg></span></h1>`;
export const ctas = (cls = "") => `<div class="hp-ctas ${cls}"><a class="hp-btn hp-primary" href="#">Start a trip — free</a><a class="hp-btn" href="#">See example trips</a></div>`;
export const swap = (from, to) => `<span class="hp-swap"><span>${from}</span><span>${to}</span></span>`;

export function play(root, events, { onTick, total } = {}) {
  const end = total ?? events[events.length - 1][0] + 900;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("end");
  let start = 0, done = 0, raf = 0, stopped = false;
  const frame = (now) => {
    if (stopped) return;
    const t = now - start;
    while (done < events.length && events[done][0] <= t) events[done++][1]();
    onTick?.(Math.min(t, end));
    if (t < end) raf = requestAnimationFrame(frame);
  };
  const watch = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    watch.disconnect();
    if (calm) {
      root.classList.add("calm");
      events.forEach(([, fn]) => fn());
      onTick?.(end);
      return;
    }
    start = performance.now();
    raf = requestAnimationFrame(frame);
  }, { threshold: 0.2 });
  watch.observe(root);
  return () => { stopped = true; cancelAnimationFrame(raf); watch.disconnect(); };
}
