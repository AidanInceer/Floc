import { avatar, esc, ico, tripFrame } from "/_house/kit/trip-frame.mjs";
import { draw, PEOPLE, STOPS, TRIP } from "./shared.js";

const tripHead = () =>
  `<section class="head card"><div class="head-top"><div><h1>${esc(TRIP.name)}</h1><p class="nums head-when">${TRIP.when}</p></div>` +
  `<span class="faces">${Object.values(PEOPLE).map((p) => avatar(p, 26)).join("")}</span></div></section>`;

const dayRows = (stop) =>
  `<ul class="rows">${stop.days
    .map(([wd, d, kind, glyph, title]) =>
      `<li class="day-row"><span class="nums day"><small>${wd}</small>${d}</span><span class="kind ${kind}">${glyph ? ico(glyph) : ""}</span><span class="row-t${kind === "none" ? " none" : ""}">${esc(title)}</span>${ico("chev")}</li>`)
    .join("")}</ul>`;

const stopCard = (s) =>
  `<article class="sp"><header class="sp-head"><span class="sp-no">${s.no}</span><h3>${s.name}</h3><span class="nums sp-when">${s.nights} nights, ${s.when}</span><span class="ib sp-edit">${draw("pencil")}</span></header>${dayRows(s)}</article>`;

const hop = `<p class="hop nums">${ico("train")}<span>Train to Lagos, Tue 8 Sep</span><b>3h 10</b></p>`;

const bookings =
  `<section class="side-card"><h3 class="typed side-title">Bookings</h3><ul class="book">${STOPS.map((s) =>
    `<li><span class="book-no">${s.no}</span><b>${s.name}</b><span class="nums">${s.when}</span><span class="frame small">${draw("upload")}</span></li>`).join("")}</ul>` +
  `<div class="book-all">Whole trip<span class="frame small">${draw("upload")}</span></div></section>`;

export const overview = (me, photos) =>
  tripFrame("overview", me) +
  `<div class="pg">${tripHead()}<section class="stops"><h2>Stops</h2><div class="stops-grid"><div class="stops-col">${STOPS.map(stopCard).join(hop)}</div>` +
  `<aside class="side">${bookings}${photos}</aside></div></section></div>`;
