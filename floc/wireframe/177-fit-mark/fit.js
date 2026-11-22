import { variants } from "/_house/switcher.js";
import { esc } from "/_house/kit/trip-frame.mjs";
import {
  LISTINGS, SEASON, allPicksFor, g, GLYPH, money, nightsOf, saved, heart, tileMap, toneOf,
  ownTile, topBar, rail, finderBar, moreButton,
} from "/624-season-picks/explore.js";

const ME = { likes: ["Food", "Hiking", "History"], nights: 8, price: 140000 };

const SORT_GLYPH = {
  season: GLYPH.sun,
  match: GLYPH.match,
  cheap: GLYPH.cheap,
  dear: GLYPH.dear,
  short: '<path d="M4.2 7h5.6M4.2 5.4v3.2M9.8 5.4v3.2"/>',
  long: '<path d="M1.2 7h11.6M1.2 5.4v3.2M12.8 5.4v3.2"/>',
};
const SORT_NAME = {
  season: "Top picks first",
  match: "Best match first",
  cheap: "Price, low to high",
  dear: "Price, high to low",
  short: "Shortest first",
  long: "Longest first",
};
const SPREAD = [0, 1, 3, 9, 20, 36, 54];

function fitOf(t) {
  const hits = t.tags.filter((x) => ME.likes.includes(x));
  const style = hits.length >= 2 ? 1 : hits.length ? 0.7 : 0.15;
  const length = Math.max(0, 1 - Math.abs(t.nights - ME.nights) / 10);
  const cost = t.price <= ME.price ? 1 : Math.max(0, 1 - (t.price - ME.price) / 200000);
  const why = [];
  if (hits.length) why.push(hits.join(", ").toLowerCase());
  if (length >= 0.8) why.push("your usual length");
  if (cost >= 0.9) why.push("in your price range");
  return { t, hits, pct: Math.round(100 * (0.5 * style + 0.25 * length + 0.25 * cost)), why: why.slice(0, 2).join(" · ") || "little in common with your trips" };
}

const ROWS = LISTINGS.map(fitOf).sort((a, b) => b.pct - a.pct || a.t.price - b.t.price);
const said = (r) => `${r.pct}% match: ${r.why}`;
const state = { variant: "G", sort: "match" };

function shown() {
  if (state.sort === "match") return SPREAD.map((i) => ROWS[Math.min(i, ROWS.length - 1)]);
  if (state.sort === "season") {
    const ids = allPicksFor(SEASON).map((t) => t.id);
    return [...ROWS].sort((a, b) => Number(ids.includes(b.t.id)) - Number(ids.includes(a.t.id)) || b.pct - a.pct).slice(0, 7);
  }
  const by = {
    cheap: (a, b) => a.t.price - b.t.price,
    dear: (a, b) => b.t.price - a.t.price,
    short: (a, b) => a.t.nights - b.t.nights || a.t.price - b.t.price,
    long: (a, b) => b.t.nights - a.t.nights || a.t.price - b.t.price,
  }[state.sort];
  return [...ROWS].sort(by).slice(0, 7);
}

const dial = (pct) =>
  g(`<circle class="dial-rest" cx="7" cy="7" r="5"/><circle class="dial-fill" cx="7" cy="7" r="5" pathLength="100" stroke-dasharray="${pct} 100" transform="rotate(-90 7 7)"/>`, "g dial");

const figs = (t) => `<span class="figs fit-figs"><span>${nightsOf(t.nights)}</span><span class="sep"> · </span><span>${money(t.price)}</span></span>`;
const chips = (r) =>
  `<span class="chips">${r.t.tags.slice(0, 3).map((x) => `<span class="chip${r.hits.includes(x) ? " hit" : ""}">${r.hits.includes(x) ? g(GLYPH.check, "g tick") : ""}${esc(x)}</span>`).join("")}</span>`;
const mark = (r) => `<span class="fit bare" role="img" aria-label="${esc(said(r))}" title="${esc(said(r))}">${dial(r.pct)}${r.pct}%</span>`;

function tile(r) {
  const t = r.t;
  return `<li class="tile fit-${state.variant}"><a class="tile-link" href="#${t.id}"><span class="tile-art">${tileMap(t)}</span>
    <span class="tile-body fit-body"><span class="tag tone-${toneOf(t)}">${esc(t.country)}</span><b class="tile-title">${esc(t.title)}</b>${chips(r)}
    <span class="fit-last">${figs(t)}${mark(r)}</span></span></a>${heart(t, "heart heart-tile")}</li>`;
}

const radio = (key) =>
  `<button type="button" role="radio" data-sort="${key}" aria-checked="${state.sort === key}" title="${SORT_NAME[key]}" aria-label="${SORT_NAME[key]}">${g(SORT_GLYPH[key])}</button>`;

function page() {
  const sort = `<div class="sg" role="radiogroup" aria-label="Sort">${Object.keys(SORT_NAME).map(radio).join("")}</div>`;
  const head = `<div class="all-head"><h2 class="all-title">All trips</h2><div class="tools"><label class="srch">${g(GLYPH.search)}<input type="search" aria-label="Search trips"></label>${sort}</div></div>`;
  const tiles = shown().map(tile);
  const items = [...tiles.slice(0, 3), ownTile(), ...tiles.slice(3)];
  const ghost = `<div class="ghost typed">Above: the globe and this season's card, unchanged</div>`;
  const note = `<p class="fit-note"><b>Made-up person.</b> Likes food, hiking and history, usually goes for ${ME.nights} nights and pays up to ${money(ME.price)}. In best match order the tiles come from across the range, so each mark shows high and low. Gone from the tile: the top-pick sun and More like this. The sun stays in the sort row.</p>`;
  return `${topBar()}${ghost}<section class="all">${head}<div class="all-body">${rail()}<div class="all-main">${finderBar(LISTINGS.length)}${note}<ul class="tgrid">${items.join("")}</ul>${moreButton(LISTINGS.length - 7)}</div></div></section>`;
}

const stage = document.getElementById("stage");
const render = (key) => {
  if (key) state.variant = key;
  stage.innerHTML = page();
};

stage.addEventListener("click", (e) => {
  const save = e.target.closest("[data-save]");
  if (save) {
    const id = save.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    save.setAttribute("aria-pressed", String(saved.has(id)));
    return;
  }
  const sort = e.target.closest("[data-sort]");
  if (sort) {
    state.sort = sort.dataset.sort;
    return render();
  }
  if (e.target.closest("a[href^='#']")) e.preventDefault();
});

variants(
  [
    { key: "G", code: "G", name: "Dial that fills, and figure", round: 2 },
  ],
  render,
);
