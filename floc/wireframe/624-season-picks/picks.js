// #624 J3, the chosen top picks: a sun in the sort row brings them first; the sun on a tile names itself on hover.
import { variants } from "/_house/switcher.js";
import { esc, isNarrow } from "/_house/kit/trip-frame.mjs";
import {
  LISTINGS, SEASON, windowName, allPicksFor, g, GLYPH, money, saved,
  tile, ownTile, topBar, globe, rail, sortPicker, allHead, finderBar, moreButton,
} from "./explore.js";

const TOKYO = {
  id: "japan-golden-route", title: "Tokyo to Osaka", region: "Asia", country: "Japan", nights: 13, price: 265000,
  span: "March to May, October, November",
  summary: "Tokyo, a ryokan night in Hakone, four nights in Kyoto with Nara on the side, Hiroshima and Miyajima, then Osaka to eat. All on a rail pass, with two empty afternoons.",
  highlights: ["Shinkansen to Kyoto", "A night in a Hakone ryokan", "Miyajima's gate at high tide"],
  stops: [["Tokyo", 35.68, 139.69]],
};

const state = { sort: "match" };
const SHOWN = 8;
const pickName = `Top pick for ${windowName(SEASON)}`;
const badge = `<span class="pick-badge" title="${pickName}" aria-label="${pickName}" role="img">${g(GLYPH.sun)}</span>`;

function postcard(t) {
  return `<article class="postcard"><div class="pc-top"><div><span class="typed pc-kicker">${esc(t.region)} · ${esc(t.country)}</span><h2 class="pc-title">${esc(t.title)}</h2></div>
    <span class="pc-stamp typed"><span>${esc(t.country)}</span><b class="nums">${t.nights}</b><span>nights</span></span></div>
    <p class="pc-summary">${esc(t.summary)}</p>
    <dl class="pc-facts"><div><dt class="typed">From</dt><dd class="nums">${money(t.price)} each</dd></div><div><dt class="typed">Best in</dt><dd class="nums">${esc(t.span)}</dd></div></dl>
    <div class="pc-chips">${t.highlights.map((h) => `<span class="pc-chip">${esc(h)}</span>`).join("")}</div>
    <div class="pc-actions"><button type="button" class="btn-sm primary">Start this trip</button><button type="button" class="btn-sm">See the full trip</button></div></article>`;
}

function hero() {
  const narrow = isNarrow();
  const svg = globe({
    lon0: 135, lat0: 25, w: narrow ? 375 : 1280, h: narrow ? 340 : 560,
    r: narrow ? 210 : 430, cx: narrow ? 188 : 440, cy: narrow ? 200 : 400,
    highlight: [TOKYO.id], arc: [TOKYO.country, TOKYO.stops[0][1], TOKYO.stops[0][2]],
  });
  return `<section class="hero"><div class="globe-box">${svg}</div><div class="hero-inner"><div class="pc-slot">${postcard(TOKYO)}</div></div></section>`;
}

const rest = (exclude) => LISTINGS.filter((t) => !exclude.includes(t.id));
const grid = (items) => `<ul class="tgrid">${items.join("")}</ul>`;

function renderJ3() {
  const all = allPicksFor(SEASON);
  const ids = all.map((t) => t.id);
  const season = state.sort === "season";
  const fit = (t) => SEASON.filter((m) => t.months.includes(m)).length;
  let list;
  if (season) list = [...all, ...rest(ids).sort((a, b) => fit(b) - fit(a) || a.months.length - b.months.length)];
  else if (state.sort === "cheap") list = [...LISTINGS].sort((a, b) => a.price - b.price);
  else if (state.sort === "dear") list = [...LISTINGS].sort((a, b) => b.price - a.price);
  else if (state.sort === "short") list = [...LISTINGS].sort((a, b) => a.nights - b.nights);
  else if (state.sort === "long") list = [...LISTINGS].sort((a, b) => b.nights - a.nights);
  else list = [...all.slice(0, 3), ...rest(ids.slice(0, 3))];
  const marked = (t, i) => ids.includes(t.id) && (season || (state.sort === "match" && i < 3));
  const tiles = list.slice(0, season ? all.length + 2 : SHOWN - 1).map((t, i) => (marked(t, i) ? tile(t, { mark: badge, cls: "picked" }) : tile(t)));
  const lead = season ? all.length : state.sort === "match" ? 3 : 0;
  const items = [...tiles.slice(0, lead), ownTile(), ...tiles.slice(lead)];
  const sort = sortPicker(state.sort, [["season", "Top picks for this season first"]]);
  return `${topBar()}${hero()}<section class="all">${allHead(sort)}<div class="all-body">${rail()}<div class="all-main">${finderBar(LISTINGS.length)}${grid(items)}${moreButton(LISTINGS.length - items.length + 1)}</div></div></section>`;
}

const stage = document.getElementById("stage");
const render = () => { stage.innerHTML = renderJ3(); };

stage.addEventListener("click", (e) => {
  const save = e.target.closest("[data-save]");
  if (save) {
    const id = save.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    save.setAttribute("aria-pressed", String(saved.has(id)));
    return;
  }
  const sort = e.target.closest("[data-sort]");
  if (sort) { state.sort = sort.dataset.sort; return render(); }
  if (e.target.closest("a[href^='#']")) e.preventDefault();
});

variants([{ key: "J3", code: "J3", name: "Season in the sort row", round: 4 }], render);
render();
