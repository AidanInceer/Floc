// The type sets under review. Each has a display, a sans and a mono face, as the design card asks.
// d: display weight, track: display letter-spacing, wm: wordmark weight.
// Rounds 1–3 closed on 2026-11-15 to a shortlist: Now (reference), H, J and W. Git holds the closed sets.
// Round 4: each shortlisted heading face at three more weights, with its own text and mono faces.
// Round 4 narrowed to heading weights 700–800: closed H2 500, H3 600, J2 600, J4 900, W2 600 and W 900.
// Shipped as W4. The page stays open as a type playground: add a set to SHORTLIST or WEIGHTS to try it against the live one.

const face = (name, fallback) => `"${name}", ${fallback}`;
const SANS = "system-ui, sans-serif";
const SERIF = "Georgia, serif";
const MONO = "ui-monospace, Consolas, monospace";

const NOW = {
  key: "was", code: "Was", round: 3, name: "The set before W4: Bricolage Grotesque, Instrument Sans, DM Mono",
  note: "What the site used until W4 shipped, for reference.",
  display: "Bricolage Grotesque", sans: "Instrument Sans", mono: "DM Mono",
  css: face("Bricolage Grotesque", SANS), sansCss: face("Instrument Sans", SANS), monoCss: face("DM Mono", MONO),
  d: 600, track: "-0.035em", wm: 700, wmTrack: "-0.03em",
  q: "family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500",
};

const H = {
  display: "Plus Jakarta Sans", sans: "Plus Jakarta Sans", mono: "Azeret Mono",
  css: face("Plus Jakarta Sans", SANS), sansCss: face("Plus Jakarta Sans", SANS), monoCss: face("Azeret Mono", MONO),
  q: "family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Azeret+Mono:wght@400;500",
};
const J = {
  display: "Schibsted Grotesk", sans: "Newsreader", mono: "Spline Sans Mono",
  css: face("Schibsted Grotesk", SANS), sansCss: face("Newsreader", SERIF), monoCss: face("Spline Sans Mono", MONO),
  q: "family=Schibsted+Grotesk:wght@500;600;700;800;900&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Spline+Sans+Mono:wght@400;500",
};
const W = {
  display: "Red Hat Display", sans: "Red Hat Text", mono: "Red Hat Mono",
  css: face("Red Hat Display", SANS), sansCss: face("Red Hat Text", SANS), monoCss: face("Red Hat Mono", MONO),
  q: "family=Red+Hat+Display:wght@600;700;800;900&family=Red+Hat+Text:wght@400;500;600&family=Red+Hat+Mono:wght@400;500",
};

const step = (base, key, round, d, track, name, note) => ({ ...base, key, round, name, note, d, track, wm: d, wmTrack: track });

export const SHORTLIST = [
  NOW,
  step(H, "H", 3, 800, "-0.04em", "Plus Jakarta Sans 800: friendly, one family",
    "Open and rounded, heavy at heading sizes. 800 is the heaviest weight Plus Jakarta Sans has."),
  step(J, "J", 3, 800, "-0.04em", "Schibsted Grotesk 800 with Newsreader: newspaper",
    "Tight, heavy news headings over a serif for prose."),
];

export const WEIGHTS = [
  step(H, "H4", 4, 700, "-0.035em", "Plus Jakarta Sans 700: a touch lighter than H", "One step lighter than H."),
  step(J, "J3", 4, 700, "-0.03em", "Schibsted Grotesk 700: a touch lighter than J", "One step lighter than J."),
  step(W, "W3", 4, 700, "-0.03em", "Red Hat Display 700: lighter than W", "Crisp, slightly squared letters; Red Hat Text and Mono match it below."),
  step(W, "W4", 4, 800, "-0.035em", "Red Hat Display 800: a touch lighter than W", "One step lighter than W's 900, which is closed."),
];

export const ALL_SETS = [...SHORTLIST, ...WEIGHTS];

const loaded = new Set();
export function loadFonts(set) {
  if (loaded.has(set.q)) return;
  loaded.add(set.q);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${set.q}&display=swap`;
  document.head.appendChild(link);
}

export const vars = (s) =>
  `--display:${s.css};--sans:${s.sansCss};--type:${s.monoCss};--d-wt:${s.d};--d-track:${s.track};--wm-wt:${s.wm};--wm-track:${s.wmTrack};--d-stretch:${s.stretch || "100%"}`;

// Chosen 2026-11-15: W4 for all three roles. Headings Red Hat Display 800; text Red Hat Text and numbers Red Hat Mono, both as in W3 and W4.
export const PICKED_HEADING = WEIGHTS.find((s) => s.key === "W4");

// Every text and mono face seen in rounds 1–3, so text and numbers draw from the full field, not only the shortlist.
// The first entry is W4's own partner; the second is the live site's.
const pool = (names, fallback) => names.map(([name, spec]) => ({ name, css: face(name, fallback), spec: spec === undefined ? "wght@400;500;600" : spec }));
export const TEXT_POOL = pool([
  ["Red Hat Text"], ["Instrument Sans"], ["Geist"], ["Inter"], ["DM Sans", "opsz,wght@9..40,400;9..40,500;9..40,600"],
  ["Manrope"], ["Hanken Grotesk"], ["Public Sans"], ["Plus Jakarta Sans"], ["Figtree"],
  ["Barlow"], ["IBM Plex Sans"], ["Source Sans 3"], ["Nunito"], ["Karla"], ["Jost"], ["Rubik"], ["Archivo"],
  ["Mulish"], ["Inter Tight"], ["Chakra Petch"], ["Libre Franklin"],
], SANS).concat(pool([["Newsreader", "opsz,wght@6..72,400;6..72,500;6..72,600"]], SERIF));
export const MONO_POOL = pool([
  ["Red Hat Mono", "wght@400;500"], ["DM Mono", "wght@400;500"], ["Geist Mono", "wght@400;500"], ["JetBrains Mono", "wght@400;500"],
  ["Space Mono", "wght@400;700"], ["IBM Plex Mono", "wght@400;500"], ["Fira Code", "wght@400;500"], ["Azeret Mono", "wght@400;500"],
  ["Martian Mono", "wght@400;500"], ["Spline Sans Mono", "wght@400;500"], ["Overpass Mono", "wght@400;500"],
  ["Source Code Pro", "wght@400;500"], ["Fira Mono", "wght@400;500"], ["Courier Prime", ""], ["Cutive Mono", ""],
  ["Anonymous Pro", ""], ["Roboto Mono", "wght@400;500"], ["Sometype Mono", "wght@400;500"], ["Share Tech Mono", ""],
], MONO);
export const poolQuery = (list) => list.map((f) => `family=${f.name.replace(/ /g, "+")}${f.spec ? ":" + f.spec : ""}`).join("&");
