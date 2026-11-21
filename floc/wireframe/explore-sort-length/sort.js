import { variants } from "/_house/switcher.js";
import { LISTINGS, g, GLYPH, tile, ownTile, topBar, rail, finderBar, moreButton } from "/624-season-picks/explore.js";

const G = {
  season: GLYPH.sun,
  match: GLYPH.match,
  cheap: GLYPH.cheap,
  dear: GLYPH.dear,
  short: '<path d="M4.2 7h5.6M4.2 5.4v3.2M9.8 5.4v3.2"/>',
  long: '<path d="M1.2 7h11.6M1.2 5.4v3.2M12.8 5.4v3.2"/>',
};

const NAMES = {
  season: "Top picks first",
  match: "Saved first",
  cheap: "Price, low to high",
  dear: "Price, high to low",
  short: "Shortest first",
  long: "Longest first",
};

const state = { sort: "short" };

function ordered() {
  const by = {
    cheap: (a, b) => a.price - b.price,
    dear: (a, b) => b.price - a.price,
    short: (a, b) => a.nights - b.nights || a.price - b.price,
    long: (a, b) => b.nights - a.nights || a.price - b.price,
  }[state.sort];
  return by ? [...LISTINGS].sort(by) : [...LISTINGS];
}

const radio = (key) =>
  `<button type="button" role="radio" data-sort="${key}" aria-checked="${state.sort === key}" title="${NAMES[key]}" aria-label="${NAMES[key]}">${g(G[key])}</button>`;

function page() {
  const sort = `<div class="sg" role="radiogroup" aria-label="Sort">${Object.keys(NAMES).map(radio).join("")}</div>`;
  const head = `<div class="all-head"><h2 class="all-title">All trips</h2><div class="tools"><label class="srch">${g(GLYPH.search)}<input type="search" aria-label="Search trips"></label>${sort}</div></div>`;
  const list = ordered().slice(0, 7).map((t) => tile(t));
  const items = [...list.slice(0, 3), ownTile(), ...list.slice(3)];
  const ghost = `<div class="ghost typed">Above: the globe and this season's card, unchanged</div>`;
  return `${topBar()}${ghost}<section class="all">${head}<div class="all-body">${rail()}<div class="all-main">${finderBar(LISTINGS.length)}<ul class="tgrid">${items.join("")}</ul>${moreButton(LISTINGS.length - 7)}</div></div></section>`;
}

const stage = document.getElementById("stage");
const render = () => {
  stage.innerHTML = page();
};

stage.addEventListener("click", (e) => {
  const sort = e.target.closest("[data-sort]");
  if (sort) {
    state.sort = sort.dataset.sort;
    return render();
  }
  if (e.target.closest("a[href^='#']")) e.preventDefault();
});

variants([{ key: "A", code: "A", name: "Ruler: a short span and a long span", round: 1 }], render);
render();
