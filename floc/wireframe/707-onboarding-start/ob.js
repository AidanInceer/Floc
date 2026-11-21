import { S, INVITE, LIVE, closeX, doors, esc, firstName, gl, hello, listOf, live, modal, openTrip, press, quiet, row } from "./kit.js";

const P = {
  sunrise: '<path d="M1.8 10.6h10.4M3.8 10.6a3.2 3.2 0 0 1 6.4 0M7 3.2v1.6M2.9 5.6l1.1 1.1M11.1 5.6 10 6.7"/>',
  cup: '<path d="M2.6 5.4h7v3.4a2.6 2.6 0 0 1-2.6 2.6H5.2a2.6 2.6 0 0 1-2.6-2.6Z"/><path d="M9.6 6.2h.8a1.4 1.4 0 0 1 0 2.8h-.9M5 2.2v1.4M7.2 2.2v1.4"/>',
  moon: '<path d="M11.4 8.6A4.8 4.8 0 0 1 5.4 2.6a4.8 4.8 0 1 0 6 6Z"/>',
  city: '<path d="M1.8 12.2h10.4M2.8 12.2V6.4h3v5.8M5.8 12.2V2.8h3.4v9.4M9.2 12.2V5.4h2v6.8"/>',
  wave: '<path d="M1.6 9.4c1.2 0 1.6-1 2.7-1s1.5 1 2.7 1 1.5-1 2.7-1 1.5 1 2.7 1M1.6 11.8c1.2 0 1.6-1 2.7-1s1.5 1 2.7 1 1.5-1 2.7-1 1.5 1 2.7 1"/><circle cx="9.6" cy="4.2" r="1.8"/>',
  peak: '<path d="M1.4 11.8 5.4 4.6l2.2 3.6 1.4-2 3.6 5.6Z"/><path d="M4.4 6.4l1 .8 1-.8"/>',
  museum: '<path d="M1.8 5.2 7 2.2l5.2 3ZM2.6 11.8h8.8M3.6 6.6v4M6.2 6.6v4M7.8 6.6v4M10.4 6.6v4"/>',
  flag: '<path d="M3.2 12.4V2M3.2 2.6h7.2L9 4.8l1.4 2.2H3.2"/>',
  key: '<circle cx="4.6" cy="7" r="2.4"/><path d="M7 7h5.2M10.4 7v2M12.2 7v1.6"/>',
  tent: '<path d="M1.6 12 7 2.4 12.4 12ZM7 12 5 8.4M7 12l2-3.6"/>',
  backpack: '<path d="M3.4 5.4a3.6 3.6 0 0 1 7.2 0v6.4H3.4Z"/><path d="M5.4 2.4h3.2M5 8.4h4M5 8.4v1.6M9 8.4v1.6"/>',
  check: '<path d="M3.2 7.3 5.8 9.8l5-5.6"/>',
};
const FLIGHT = '<path d="M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z"/>';

export const og = (name, cls = "") => (P[name] ? `<svg class="g ${cls}" viewBox="0 0 14 14" aria-hidden="true">${P[name]}</svg>` : gl(name, cls));
export const cap = (s) => s[0].toUpperCase() + s.slice(1);

export const VIBES = [
  ["early starts", "sunrise"], ["slow mornings", "cup"], ["late nights", "moon"], ["city breaks", "city"], ["beaches", "wave"],
  ["hiking", "peak"], ["road trips", "car"], ["food first", "food"], ["museums", "museum"], ["festivals", "flag"],
];
export const STYLE = [
  { key: "plan", label: "Planning", options: [["all", "Plan it all", "notes"], ["rough", "A rough plan", "days"], ["wing", "Wing it", "explore"]] },
  { key: "spend", label: "Spend", options: [["shoestring", "Shoestring", "backpack"], ["comfortable", "Comfortable", "bed"], ["treat", "Treat yourself", "star"]] },
  { key: "sleep", label: "Sleep", options: [["hostels", "Hostels", "people"], ["hotels", "Hotels", "bed"], ["apartments", "Apartments", "key"], ["camping", "Camping", "tent"]] },
];
export const styleOf = (g) => g.options.find(([v]) => v === S.me.style[g.key]);
export const stylePicks = () => STYLE.map(styleOf).filter(Boolean).map((o) => o[1]);

export const AIRPORTS = [
  ["DUB", "Dublin", "Ireland"], ["ORK", "Cork", "Ireland"], ["SNN", "Shannon", "Ireland"], ["BFS", "Belfast International", "United Kingdom"],
  ["LHR", "London Heathrow", "United Kingdom"], ["LGW", "London Gatwick", "United Kingdom"], ["STN", "London Stansted", "United Kingdom"],
  ["MAN", "Manchester", "United Kingdom"], ["EDI", "Edinburgh", "United Kingdom"], ["BHX", "Birmingham", "United Kingdom"],
  ["BRS", "Bristol", "United Kingdom"], ["GLA", "Glasgow", "United Kingdom"], ["AMS", "Amsterdam Schiphol", "Netherlands"],
  ["CDG", "Paris Charles de Gaulle", "France"], ["BCN", "Barcelona", "Spain"], ["LIS", "Lisbon", "Portugal"],
];
const GUESS = "DUB";
export const airport = (code) => AIRPORTS.find(([c]) => c === code);

const tickSvg = () => `<svg class="g tk" viewBox="0 0 14 14" aria-hidden="true">${P.check}</svg>`;

const apRow = ([code, city, land], hint) =>
  `<button type="button" class="ap-row" data-act="air:${code}">${gl("flight")}<span class="row-text"><span class="row-label">${esc(city)}</span><span class="row-hint">${hint ?? esc(land)}</span></span><span class="nums ap-code">${code}</span></button>`;
export function airportHits() {
  const q = S.me.q.trim().toLowerCase();
  if (!q) return apRow(airport(GUESS), "Nearest to you");
  const hits = AIRPORTS.filter((a) => a.join(" ").toLowerCase().includes(q)).slice(0, 4);
  return hits.length ? hits.map((a) => apRow(a)).join("") : `<p class="quiet ap-none">No airport by that name yet</p>`;
}
LIVE.airports = airportHits;
export const chosenAirport = () => {
  const [code, city, land] = airport(S.me.airport);
  return `<div class="ap-chosen${S.pop === "air" ? " pop" : ""}"><span class="ap-big nums">${code}</span><span class="row-text"><span class="row-label">${esc(city)}</span><span class="row-hint">${esc(land)}</span></span><button type="button" class="b b-ghost" data-act="air:">Change</button></div>`;
};
export const airportPicker = () =>
  S.me.airport
    ? chosenAirport()
    : `<div class="ap"><label class="fld"><span class="typed">Home airport</span><input data-bind="me.q" value="${esc(S.me.q)}" autocomplete="off" maxlength="40"></label><div class="ap-list" data-live="airports">${airportHits()}</div></div>`;

export function arc() {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const d = "M 6 62 Q 150 -4 294 62";
  const motion = still ? "" : `<animateMotion dur="1.5s" fill="freeze" path="${d}" rotate="auto" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1"/>`;
  const place = still ? ' transform="translate(294 62) rotate(35)"' : "";
  return `<div class="arc"><span class="nums arc-end">${S.me.airport}</span><svg viewBox="0 0 300 70" aria-hidden="true"><path class="arc-line" d="${d}"/><g${place}><g class="arc-plane" transform="rotate(45) translate(-7 -7)">${FLIGHT}</g>${motion}</g></svg><span class="nums arc-end">Anywhere</span></div>`;
}

export const tileBtn = ({ on, act, icon, label, pop }) =>
  `<button type="button" class="vt${pop ? " pop" : ""}" aria-pressed="${on}" data-act="${act}"><span class="vt-ic">${og(icon)}</span><span>${label}</span>${on ? `<span class="vt-tick">${tickSvg()}</span>` : ""}</button>`;

export const head = (icon, tone, title, sub) =>
  `<div class="g-centre">${icon ? `<span class="g-ic t-${tone}">${og(icon)}</span>` : ""}<h2>${title}</h2>${sub ? quiet(sub) : ""}</div>`;
export const summary = () => {
  const parts = [];
  if (S.me.airport) parts.push(`flying from ${airport(S.me.airport)[1]}`);
  parts.push(...stylePicks().map((s) => s.toLowerCase()));
  if (S.me.tags.length) parts.push(`into ${listOf(S.me.tags)}`);
  return parts.length ? `${cap(listOf(parts))}.` : "";
};
export const finish = () => {
  const invited = S.arrive === "invite";
  return `<div class="g-centre"><h2>${invited ? `You are on ${INVITE.name}` : "Where to first?"}</h2>${summary() ? quiet(summary()) : ""}</div><div class="rows ruled">${(invited ? [openTrip(), ...doors()] : doors()).map(row).join("")}</div>`;
};

export const dots = (n, i) =>
  `<span class="dots" role="img" aria-label="Step ${i + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<i${k === i ? ' class="is-on"' : k < i ? ' class="is-done"' : ""}></i>`).join("")}</span>`;
export const nav = (last, nextLabel = "Next") => ({
  left: S.step === 0 ? press(`step:${last}`, "Skip", "ghost") : press(`step:${S.step - 1}`, "Back", "ghost"),
  right: S.step === last ? press("skip", "Look around", "ghost") : press(`step:${S.step + 1}`, S.step === last - 1 ? "Done" : nextLabel, "primary"),
});
export const gShell = ({ body, left, right, n, top = "", cls = "", size = "sm" }) =>
  modal({
    size,
    label: "Welcome",
    body: `${closeX()}${top}<div class="g-body step-in ${cls}">${body}</div><footer class="m-foot g-foot"><span class="g-side">${left}</span>${S.step < n ? dots(n, S.step) : ""}<span class="g-side g-right">${right}</span></footer>`,
  });

export { closeX, press };
