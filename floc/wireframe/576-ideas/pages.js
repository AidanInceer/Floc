import { addDays, avatar, dom, esc, monthShort, weekday } from "/_house/kit/trip-frame.mjs";
import { DAYS, PEOPLE, inTrip } from "./store.js";
import { gl } from "./shared.js";

const TABS = [
  [["overview", "Overview", "blue"]],
  [["dates", "Dates", "yellow"], ["days", "Days", "green"]],
  [["money", "Money", "red"], ["packing", "Packing", "blue"]],
  [["notes", "Notes", "yellow"], ["files", "Files", "green"]],
];
const FLOCK = '<svg viewBox="0 0 28 22" aria-hidden="true"><path d="M3.4 16.5 7 12.9 10.6 16.5"/><path d="M10.4 10 14 6.4 17.6 10"/><path d="M17.4 16.5 21 12.9 24.6 16.5"/></svg>';
const TYPE_GLYPH = { transport: "train", activity: "activity", food: "food", other: "note" };
const FULL_DAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FULL_MONTH = { Dec: "December", Jan: "January" };
const HOUR = 44;
const FIRST = 7;
const LAST = 23;

export function frame(view) {
  const clusters = TABS.map((group) => `<span class="tt-group">${group.map(([key, label, tone]) => {
    const live = ["overview", "dates", "days"].includes(key);
    return `<a href="#" data-a="${live ? "nav" : "noop"}" data-view="${key}" class="tone-${tone}"${view === key ? ' aria-current="page"' : ""}><span class="tt-gl">${gl(key)}</span><span>${label}</span></a>`;
  }).join("")}</span>`).join('<i class="tt-rule"></i>');
  return `<header class="tb"><div class="tb-beads">
    <a href="#" class="tb-bead tb-word" data-a="nav" data-view="overview" aria-label="Floc home">${FLOCK}<span>floc<i>.</i></span></a>
    <nav class="tb-bead tb-places" aria-label="Your places"><a href="#" data-a="noop">${gl("explore")}<span>Explore</span></a><a href="#" data-a="noop" class="on">${gl("trips")}<span>Trips</span></a></nav>
    <span class="tb-bead tb-you"><button type="button" class="ibtn" data-a="noop" aria-label="Inbox">${gl("bell")}</button>${avatar(PEOPLE[0], 26)}<span class="tb-name">Dev</span></span>
  </div></header>
  <nav class="tt" aria-label="Trip sections">${clusters}<i class="tt-rule tt-end"></i><a href="#" data-a="noop" aria-label="Trip settings"><span class="tt-gl">${gl("gear")}</span></a></nav>`;
}

function map() {
  return `<svg class="ov-map" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path class="land" d="M250 -10 L800 -10 L800 560 L470 560 C430 520 380 492 330 486 C286 480 244 492 214 474 C232 430 226 392 236 350 C214 322 190 306 176 276 C206 244 214 204 222 168 C232 120 240 60 250 -10Z"/>
    <path class="border" d="M470 -10 C452 60 498 110 474 170 C452 226 500 268 486 330 C476 386 500 430 484 500 L470 560"/>
    <path class="route" d="M206 276 C250 340 262 420 246 468"/>
    <g class="pin" transform="translate(206 276)"><circle r="13"/><text y="4">1</text></g><text class="pin-name" x="226" y="281">Lisbon</text>
    <g class="pin" transform="translate(246 468)"><circle r="13"/><text y="4">2</text></g><text class="pin-name" x="266" y="473">Lagos</text>
  </svg>`;
}

function ideasRow(ctx) {
  const n = ctx.store.live().length;
  const top = ctx.store.top();
  if (!n) return `<button type="button" class="pc-row" data-a="open-ideas">${gl("bulb", "bulb")}<span class="pc-t"><span>Ideas</span><small>Add the first one</small></span>${gl("chevR")}</button>`;
  return `<button type="button" class="pc-row" data-a="open-ideas">${gl("bulb", "bulb")}<span class="pc-t"><span>${n === 1 ? "1 idea" : `${n} ideas`}</span><small>Top: ${esc(top.title)}</small></span>${gl("chevR")}</button>`;
}

function stopRow(ctx, day) {
  const list = ctx.s.events.filter((e) => e.day === day.date).sort((a, b) => (a.time ?? "00").localeCompare(b.time ?? "00"));
  const first = list[0];
  const lead = first
    ? `<span class="st-ic t-${first.type}">${gl(TYPE_GLYPH[first.type])}</span><span class="st-title">${esc(first.title)}</span>`
    : `<span class="st-ic st-empty"></span><span class="st-none">…</span>`;
  const more = list.length > 1 ? `<span class="st-more nums">+${list.length - 1}</span>` : "";
  return `<button type="button" class="st-row" data-a="stop-day" data-day="${day.date}"><span class="st-d typed">${weekday(day.date)}<b>${dom(day.date)}</b></span>${lead}${more}${gl("chev")}</button>`;
}

function stops(ctx) {
  const part = (place, n, range, index) => `<section class="st"><h3 class="st-h"><span class="st-n">${index}</span><span class="st-name">${place}</span><small class="typed">${n} nights · ${range}</small></h3>${DAYS.filter((d) => d.place === place).map((d) => stopRow(ctx, d)).join("")}</section>`;
  return `<div class="ov-low"><div class="ov-stops"><h2 class="sec">Stops</h2>${part("Lisbon", 3, "29 Dec – 1 Jan", 1)}<p class="st-hop typed">${gl("train")} Train to Lagos · Fri 1 Jan</p>${part("Lagos", 4, "1–5 Jan", 2)}</div>
    <aside class="ov-book"><p class="typed">Bookings</p><div><span><b>1</b>Lisbon</span><small class="typed">29 Dec – 1 Jan</small><button type="button" class="ibtn edge" data-a="noop" aria-label="Upload for Lisbon">${gl("upload")}</button></div><div><span><b>2</b>Lagos</span><small class="typed">1–5 Jan</small><button type="button" class="ibtn edge" data-a="noop" aria-label="Upload for Lagos">${gl("upload")}</button></div><div class="whole"><span>Whole trip</span><button type="button" class="ibtn edge" data-a="noop" aria-label="Upload for whole trip">${gl("upload")}</button></div></aside></div>`;
}

export function overview(ctx, v) {
  const faces = PEOPLE.map((p) => avatar(p, 28)).join("");
  return `<div class="pg">
    <section class="prog"><span class="prog-bar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < 5 ? "on" : ""}"></i>`).join("")}</span><span><b class="nums">5</b> of 10 done</span><span class="prog-next">Next: <b>2 stops to book</b></span><button type="button" class="btn" data-a="noop">Find a stay</button><button type="button" class="ibtn" data-a="noop" aria-label="Open the list">${gl("chev")}</button></section>
    <section class="hero"><div class="hero-map">${map()}
      <div class="pc"><h1>Portugal, late summer</h1><p class="typed pc-date">Tue 29 Dec – 5 Jan 2027 · 7 nights</p><p class="pc-when">In 37 days</p><p class="pc-tags"><span>the usual four</span></p><p class="pc-owe"><small>You owe</small><span class="nums">£36.43</span></p>${v.postcard ? v.postcard(ctx) : ideasRow(ctx)}</div>
    </div><div class="hero-foot"><span class="avatar-row">${faces}</span><span class="hero-who"><b>4 going</b><small>Dev, Priya, Sofia and Tom</small></span><button type="button" class="btn btn-primary" data-a="noop">${gl("invite")} Invite</button><span class="hero-files"><b>Files</b><small>No tickets or bookings yet</small><button type="button" class="ibtn edge" data-a="noop" aria-label="Upload a file">${gl("upload")}</button></span></div></section>
    ${v.belowHero ? v.belowHero(ctx) : ""}
    ${stops(ctx)}
  </div>`;
}

export function dates(ctx, v) {
  const stay = (place, range) => `<div class="db-stay"><span><b>${place}, Portugal</b><small class="typed">${range}</small></span><span class="db-links"><button type="button" class="btn" data-a="noop">Booking.com ${gl("out")}</button><button type="button" class="btn" data-a="noop">Trip.com ${gl("out")}</button><button type="button" class="ibtn" data-a="noop" aria-label="More">${gl("more")}</button></span></div>`;
  return `<div class="pg pg-dates">
    <p class="dt-now"><span class="typed">Tue 29 Dec – 5 Jan 2027</span> · 7 nights</p>
    <div class="dt-acts"><button type="button" class="btn" data-a="noop">Change the dates</button><span><button type="button" class="btn" data-a="noop">Clear availability</button><button type="button" class="btn btn-red" data-a="noop">Reset dates</button></span>${v.datesAction ? v.datesAction(ctx) : ""}</div>
    <section class="db"><header><h2>Get booking</h2><button type="button" class="btn" data-a="noop">${gl("sliders")} Booking sites</button></header>
      <div class="db-row"><b>${gl("flight")} Flights</b><span class="db-links"><button type="button" class="btn" data-a="noop">Google Flights ${gl("out")}</button><button type="button" class="btn" data-a="noop">Skyscanner ${gl("out")}</button></span></div>
      <div class="db-stays"><b>${gl("bed")} Stays</b>${stay("Lisbon", "Tue 29 Dec – 1 Jan 2027 · 3 nights")}${stay("Lagos", "Fri 1 Jan – 5 Jan 2027 · 4 nights")}<small>Opens another site. Floc isn't paid for these links.</small></div>
    </section>
  </div>`;
}

const top = (t) => (Number(t.slice(0, 2)) + Number(t.slice(3)) / 60 - FIRST) * HOUR;
const widths = (week, sel) => week.map((d) => (d === sel ? "2.2fr" : inTrip(d) ? "1fr" : ".56fr")).join(" ");

function bands(week) {
  const col = (place) => week.map((d, i) => (DAYS.find((x) => x.date === d)?.place === place ? i + 2 : 0)).filter(Boolean);
  return ["Lisbon", "Lagos"].map((place) => {
    const c = col(place);
    if (!c.length) return "";
    const n = place === "Lisbon" ? 3 : 4;
    return `<span class="dg-band" style="grid-column:${c[0]} / ${c[c.length - 1] + 1}">${gl("bed")}${place}<small class="nums" aria-label="${n} nights">${n}</small>${gl("moon")}</span>`;
  }).join("");
}

function headCell(ctx, d, sel) {
  const list = ctx.s.events.filter((e) => e.day === d);
  const state = list.length ? `${list.length} planned` : "Nothing planned";
  if (!inTrip(d)) return `<div class="dg-hc out"><span class="typed">${weekday(d)}</span> <b class="nums">${dom(d)}</b><small>${d < DAYS[0].date ? "Before the trip" : "After the trip"}</small></div>`;
  if (d !== sel) return `<button type="button" class="dg-hc" data-a="day-sel" data-day="${d}"><span class="typed">${weekday(d)}</span> <b class="nums">${dom(d)}</b><small>${state}</small></button>`;
  const i = DAYS.findIndex((x) => x.date === d);
  const wd = FULL_DAY[(new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7];
  return `<div class="dg-hc sel"><h2>${wd} ${dom(d)} ${FULL_MONTH[monthShort(d)]}</h2><small>Day ${i + 1} of 8 · ${DAYS[i].place} · ${state}</small></div>`;
}

function eventBlock(e) {
  const y = top(e.time);
  const h = e.end ? Math.max(top(e.end) - y, 34) : HOUR;
  const clock = e.end ? `${e.time}–${e.end}` : e.time;
  return `<article class="dg-ev t-${e.type}${e.fresh ? " fresh" : ""}" style="top:${y}px;height:${h - 2}px"><span class="nums">${clock}</span><b>${esc(e.title)}</b></article>`;
}

export function days(ctx, v) {
  const week = Array.from({ length: 7 }, (_, i) => addDays(ctx.ui.week, i));
  const sel = week.includes(ctx.ui.selDay) ? ctx.ui.selDay : week.find(inTrip);
  const cols = `60px ${widths(week, sel)}`;
  const placing = ctx.ui.placing;
  const hours = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
  const columns = week.map((d) => {
    const slots = placing && inTrip(d)
      ? hours.map((h) => `<button type="button" class="dg-slot" style="top:${(h - FIRST) * HOUR}px" data-a="place-slot" data-day="${d}" data-time="${String(h).padStart(2, "0")}:00" aria-label="Put it on ${weekday(d)} ${dom(d)} at ${h}:00"></button>`).join("")
      : "";
    const evs = ctx.s.events.filter((e) => e.day === d && e.time).map(eventBlock).join("");
    return `<div class="dg-col${d === sel ? " sel" : ""}${inTrip(d) ? "" : " out"}">${slots}${evs}</div>`;
  }).join("");
  const allDay = week.map((d) => `<div class="dg-ad${d === sel ? " sel" : ""}${inTrip(d) ? "" : " out"}">${ctx.s.events.filter((e) => e.day === d && !e.time).map((e) => `<span class="dg-chip t-${e.type}">${esc(e.title)}</span>`).join("")}</div>`).join("");
  const strip = DAYS.map((d) => `<button type="button" data-a="day-sel" data-day="${d.date}" aria-pressed="${d.date === sel}"><span class="typed">${weekday(d.date)}</span><b class="nums">${dom(d.date)}</b></button>`).join("");
  const span = `${weekday(week[0])} ${dom(week[0])} ${monthShort(week[0])} – ${weekday(week[6])} ${dom(week[6])} ${monthShort(week[6])}`;
  return `<div class="pg pg-days${placing ? " is-placing" : ""}">
    <div class="dd-top">${v.daysAction ? v.daysAction(ctx) : ""}<button type="button" class="btn" data-a="noop">Add to calendar</button></div>
    <section class="dg" style="--cols:${cols}">
      <header class="dg-bar"><button type="button" class="ibtn edge" data-a="week" data-by="-7" aria-label="Previous week"${ctx.ui.week <= "2026-12-28" ? " disabled" : ""}>${gl("chevL")}</button><button type="button" class="ibtn edge" data-a="week" data-by="7" aria-label="Next week"${ctx.ui.week >= "2027-01-04" ? " disabled" : ""}>${gl("chevR")}</button><span class="typed dg-span">${span}</span><button type="button" class="btn btn-ghost dg-hours" data-a="noop">${gl("fold")} Every hour</button><button type="button" class="btn btn-primary" data-a="noop">${gl("plus")} Add event</button></header>
      <div class="dg-strip" data-scroll="dg-strip">${strip}</div>
      <div class="dg-grid dg-bands"><i></i>${bands(week)}</div>
      <div class="dg-grid dg-head"><i></i>${week.map((d) => headCell(ctx, d, sel)).join("")}</div>
      <div class="dg-grid dg-allday"><span class="typed">All day</span>${allDay}</div>
      <div class="dg-scroll" data-scroll="dg-body"><div class="dg-grid dg-body" style="height:${hours.length * HOUR}px"><div class="dg-gut">${hours.map((h) => `<span class="nums" style="top:${(h - FIRST) * HOUR}px">${String(h).padStart(2, "0")}:00</span>`).join("")}</div>${columns}</div></div>
    </section>
  </div>`;
}
