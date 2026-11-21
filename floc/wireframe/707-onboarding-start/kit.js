import { ico, esc, addDays, addMonths, dom, formatRange, monthGrid, monthName, nights, shortDate, toast } from "/_house/kit/trip-frame.mjs";

export { esc, toast, addDays, addMonths, shortDate };

const EXTRA = {
  link: '<path d="M6 8.2a2.5 2.5 0 0 0 3.6 0l1.7-1.7a2.5 2.5 0 0 0-3.6-3.6l-.7.7"/><path d="M8 5.8a2.5 2.5 0 0 0-3.6 0L2.7 7.5a2.5 2.5 0 0 0 3.6 3.6l.7-.7"/>',
  bell: '<path d="M3.4 9.8V6.4a3.6 3.6 0 0 1 7.2 0v3.4l1 1.2H2.4ZM5.8 12.2a1.3 1.3 0 0 0 2.4 0"/>',
  copy: '<rect x="4.4" y="4.4" width="7.8" height="7.8" rx="1.4"/><path d="M9.6 4.4V3a1.2 1.2 0 0 0-1.2-1.2H3A1.2 1.2 0 0 0 1.8 3v5.4A1.2 1.2 0 0 0 3 9.6h1.4"/>',
};
const FLOCK = '<svg viewBox="0 0 28 22" aria-hidden="true"><path d="M3.4 16.5 7 12.9 10.6 16.5"/><path d="M10.4 10 14 6.4 17.6 10"/><path d="M17.4 16.5 21 12.9 24.6 16.5"/></svg>';

export const gl = (name, cls = "") =>
  EXTRA[name] ? `<svg class="g ${cls}" viewBox="0 0 14 14" aria-hidden="true">${EXTRA[name]}</svg>` : ico(name, cls);

export const INVITE = {
  name: "Portugal, late summer",
  start: "2027-08-28",
  end: "2027-09-04",
  people: [{ name: "Priya Nair", tone: 1 }, { name: "Sam Whitlock", tone: 4 }, { name: "Jo Brennan", tone: 2 }],
};
export const LISTING = {
  title: "Porto to Seville",
  nights: 12,
  from: "€1,320",
  stops: [["Porto", 2], ["Lisbon", 3], ["Évora", 1], ["Lagos", 3], ["Seville", 3]],
};

export const S = {};
export function reset(keep = {}) {
  Object.assign(S, { variant: "T1v4", flow: "start", arrive: "cold", door: "new" }, keep, {
    me: { name: "Maya Okafor", tone: 5, currency: "EUR", tags: [], airport: null, q: "", style: { plan: null, spend: null, sleep: null } },
    card: 0, pop: null, leave: null, dir: null,
    trip: { name: "", start: null, end: null, people: [], events: true, ideas: true, hasDates: null, hasWhere: null, places: [], q: "", poll: true, borrow: null },
    fresh: null, copied: false,
    step: 0, open: null, cal: "2027-05", created: false, joined: false, skipped: false, closed: false, folded: false, more: false, view: null, focus: null,
  });
  if (S.flow === "start" && S.door === "explore") S.trip.name = LISTING.title;
}

export const get = (path) => path.split(".").reduce((o, k) => o[k], S);
export const put = (path, value) => {
  const keys = path.split(".");
  const last = keys.pop();
  keys.reduce((o, k) => o[k], S)[last] = value;
};

const cap = (s) => s[0].toUpperCase() + s.slice(1);
export const listOf = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
export const firstName = (name) => name.trim().split(/\s+/)[0] ?? "";
export const hello = (word) => (firstName(S.me.name) ? `${word}, ${esc(firstName(S.me.name))}.` : `${word}.`);
export const guessed = () => S.me.currency === "EUR";
export const inviteNames = () => listOf(INVITE.people.map((p) => firstName(p.name)));

export const initials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : cap(parts[0].slice(0, 2));
};
export const face = (p, size = 26) =>
  `<span class="avatar who-${p.tone}" title="${esc(p.name)}" style="width:${size}px;height:${size}px;font-size:${size > 40 ? 20 : size > 28 ? 13 : 11}px">${esc(initials(p.name))}</span>`;
export const faces = (people, size = 24) => `<span class="avatar-row">${people.map((p) => face(p, size)).join("")}</span>`;
export const tripFolk = () => [S.me, ...INVITE.people.filter((p) => S.trip.people.includes(p.name))];

export const whenText = () => {
  const { start, end } = S.trip;
  if (!start) return "No dates yet";
  if (!end) return `From ${shortDate(start)}`;
  return `${formatRange(start, end)} · ${nights(start, end)} nights`;
};
export const whoText = () => (S.trip.people.length ? listOf(S.trip.people.map(firstName)) : "Just you for now");
export const LIVE = {
  "me.name": () => esc(S.me.name),
  "trip.name": () => esc(S.trip.name),
};
export const liveHtml = (key) => (key.startsWith("face:") ? face(S.me, Number(key.slice(5))) : LIVE[key]?.() ?? "");
export const live = (key, cls = "") => `<span data-live="${key}"${cls ? ` class="${cls}"` : ""}>${liveHtml(key)}</span>`;

export const stateLine = () => {
  const t = S.trip;
  const trip = S.joined ? `on ${INVITE.name}` : S.created ? `${t.name} · ${whenText()} · ${whoText()}` : "none of your own yet";
  const likes = S.me.tags.length ? S.me.tags.join(", ") : "none";
  const style = Object.values(S.me.style).filter(Boolean).join(", ") || "none";
  return `Floc now holds: name ${esc(S.me.name) || "none"} · home currency ${S.me.currency}${guessed() ? " (guessed from Ireland)" : ""} · home airport ${S.me.airport ?? "none"} · style ${style} · likes ${esc(likes)} · trip ${esc(trip)}`;
};

export const quiet = (text) => `<p class="quiet">${text}</p>`;
export const tile = (name, tone = "plain") => `<span class="tile t-${tone}">${gl(name)}</span>`;
export const row = ({ lead, label, hint, act, end }) =>
  `<button type="button" class="row" data-act="${act}">${lead}<span class="row-text"><span class="row-label">${label}</span>${hint ? `<span class="row-hint">${hint}</span>` : ""}</span><span class="row-end">${end ?? gl("chevR")}</span></button>`;
export const fact = (key, { lead, label, hint, body }) => {
  const open = S.open === key;
  return `<div class="fact"><button type="button" class="row" data-act="open:${key}" aria-expanded="${open}">${lead}<span class="row-text"><span class="row-label">${label}</span>${hint ? `<span class="row-hint">${hint}</span>` : ""}</span><span class="row-end">${gl(open ? "chev" : "chevR")}</span></button>${open ? `<div class="fact-body">${body}</div>` : ""}</div>`;
};

export const openTrip = () => ({
  lead: tile("trips", "green"),
  label: `Open ${INVITE.name}`,
  hint: `${inviteNames()} are on it`,
  act: "door:trip",
});
export function doors() {
  if (S.arrive === "invite") {
    return [
      { lead: tile("explore"), label: "Get ideas on Explore", hint: "Ready-made routes to borrow and change", act: "door:explore" },
    ];
  }
  return [
    { lead: tile("explore"), label: "Borrow one from Explore", hint: "A ready-made route to make your own", act: "door:explore" },
    { lead: tile("link"), label: "Got a link?", hint: "Paste an invite and you are on the trip", act: "door:link" },
  ];
}

export function calendar() {
  const { start, end } = S.trip;
  const cells = monthGrid(S.cal).flat().map((d) => {
    if (!d) return "<span></span>";
    const edge = d === start || d === end;
    const inside = start && end && d > start && d < end;
    return `<button type="button" class="cal-d${edge ? " is-edge" : inside ? " is-in" : ""}" data-act="day:${d}">${dom(d)}</button>`;
  });
  return `<div class="cal"><div class="cal-head"><button type="button" class="iconbtn" data-act="month:-1" aria-label="Month before">${gl("chevL")}</button><span class="nums">${monthName(S.cal)}</span><button type="button" class="iconbtn" data-act="month:1" aria-label="Month after">${gl("chevR")}</button></div>` +
    `<div class="cal-grid">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<span class="cal-wd">${d}</span>`).join("")}${cells.join("")}</div>` +
    `<div class="cal-foot"><span class="nums">${whenText()}</span>${start ? `<button type="button" class="b b-ghost" data-act="nodates">No dates yet</button>` : ""}</div></div>`;
}

export function who() {
  if (S.arrive !== "invite") return quiet("Just you for now. The trip comes with a link to share.");
  return `<div class="chips">${INVITE.people.map((p) => `<button type="button" class="chip" aria-pressed="${S.trip.people.includes(p.name)}" data-act="person:${p.name}">${face(p, 20)}${esc(firstName(p.name))}</button>`).join("")}</div>${quiet("People from your trips. Anyone else joins on the link.")}`;
}
export const route = () =>
  `<ol class="route">${LISTING.stops.map(([place, n], i) => `<li><span class="pinno nums">${i + 1}</span><span>${place}</span><span class="nums route-n">${n} ${n === 1 ? "night" : "nights"}</span></li>`).join("")}</ol>`;
export const listingLine = () => `<span class="nums">${LISTING.nights} nights · ${LISTING.stops.length} stops · from ${LISTING.from}</span>`;

export const createBtn = (label = "Create trip") =>
  `<button type="button" class="b b-primary" data-act="create" data-needs="trip.name"${S.trip.name.trim() ? "" : " disabled"}>${label}</button>`;
export const again = () => `<button type="button" class="b b-ghost again" data-act="restart">Start over</button>`;

export const newTripField = (act = "door:new") =>
  `<div class="ntf"><label class="ntf-field"><span class="typed">Name</span><input data-bind="trip.name" data-enter="${act}" value="${esc(S.trip.name)}" autocomplete="off" maxlength="60" aria-label="Trip name"></label><button type="button" class="b ntf-btn${S.trip.name.trim() ? " b-primary" : ""}" data-act="${act}" data-pen="trip.name">${gl("plus")}New trip</button></div>`;

export const tripBar = () =>
  `<button type="button" class="tripbar" data-act="door:trip"><span class="tripbar-swatch">${gl("trips")}</span><span class="tripbar-text"><span class="tripbar-name">${esc(INVITE.name)}</span><span class="nums tripbar-when">${formatRange(INVITE.start, INVITE.end)} · joined today</span></span>${faces([...INVITE.people, S.me])}<span class="tripbar-go">Open${gl("arrow")}</span></button>`;

const PLACES = [["explore", "Explore"], ["trips", "Trips"]];
export const topBar = (place = "trips") =>
  `<header class="tf-bar"><div class="tf-beads"><span class="tf-bead"><span class="tf-word">${FLOCK}<span>floc<i>.</i></span></span></span>` +
  `<nav class="tf-bead tf-places" aria-label="Places">${PLACES.map(([key, label]) => `<a href="#"${key === place ? ' aria-current="page"' : ""}><span class="tf-gl">${gl(key)}</span><span>${label}</span></a>`).join("")}</nav>` +
  `<span class="tf-bead"><span class="tf-gl">${gl("bell")}</span><span class="tf-you">${live("face:32")}</span></span></div></header>`;

const TABS = [["overview", "Overview"], ["dates", "Dates"], ["days", "Days"], ["money", "Money"], ["packing", "Packing"], ["notes", "Notes"], ["files", "Files"]];
const tabs = () =>
  `<nav class="tf-tabs" aria-label="Trip sections">${TABS.map(([key, label]) => `<a href="#"${key === "overview" ? ' aria-current="page"' : ""}><span class="tf-gl">${gl(key)}</span><span>${label}</span></a>`).join("")}</nav>`;

export function tripOpened() {
  const t = S.trip;
  const borrowed = !S.joined && (S.door === "explore" || !!t.borrow);
  const lst = t.borrow ?? LISTING;
  const name = S.joined ? INVITE.name : t.name;
  const when = S.joined ? formatRange(INVITE.start, INVITE.end) : whenText();
  const folk = S.joined ? [...INVITE.people, S.me] : tripFolk();
  const rows = [];
  if (S.joined) {
    rows.push(fact("lts-flight", { lead: tile("flight"), label: "Add your flight", hint: "So the group knows when you land", body: quiet("Opens Files, unchanged.") }));
  } else {
    if (!t.end) rows.push(fact("lts-when", { lead: tile("dates", "yellow"), label: t.hasDates === false && t.poll ? "Mark when you are free" : borrowed ? "Pick a start day" : "Pick dates", hint: t.hasDates === false && t.poll ? "Everyone marks theirs on Dates" : borrowed ? `The ${lst.nights} nights follow` : "Or leave it until the group agrees", body: calendar() }));
    if (!t.people.length) rows.push(fact("lts-who", { lead: tile("people"), label: "Get everyone in", hint: "Share the link. They join in one step", body: `${S.arrive === "invite" ? who() : ""}<div><button type="button" class="b" data-act="copy">${gl("copy")}Copy invite link</button></div>` }));
    if (!borrowed && !t.places.length) rows.push(fact("lts-where", { lead: tile("pin", "blue"), label: t.hasWhere === false ? "Pin some ideas" : "Choose where", hint: t.hasWhere === false ? "Everyone adds places and votes" : "Pin some ideas for the group to vote on", body: quiet("Opens Ideas, unchanged.") }));
  }
  return `${topBar()}${tabs()}<main class="page ov"><p class="ghost-note">The Overview. Every door opens here, and Left to sort gives the next step (#704).</p>` +
    `<section class="ov-card"><h1>${esc(name)}</h1><p class="nums ov-when">${when}</p>${faces(folk, 26)}${borrowed ? `<p class="quiet">${lst.stops.map(([p]) => p).join(", ")}</p>` : t.places.length && !S.joined ? `<p class="quiet">${t.places.join(", ")}</p>` : ""}</section>` +
    `<section class="surface lts"><header class="lts-head"><h2>Left to sort</h2></header><div class="rows">${rows.length ? rows.join("") : `<p class="quiet pad">Nothing left to sort for now.</p>`}</div></section>${again()}</main>`;
}

export const skippedPage = () =>
  `${topBar()}<main class="page"><p class="ghost-note">Skipped. Nothing is lost: My trips keeps the doors while you have no trip of your own, and Profile holds the same rows.</p>${newTripField()}${S.arrive === "invite" ? tripBar() : ""}<div class="surface rows">${doors().map(row).join("")}</div>${again()}</main>`;

export const press = (act, label, kind = "") => `<button type="button" class="b${kind ? ` b-${kind}` : ""}" data-act="${act}">${label}</button>`;

export const listingStrip = () => `<div class="band listing"><b>${LISTING.title}</b>${listingLine()}</div>`;
export const listingPage = () =>
  `<section class="surface d-listing"><h1>${LISTING.title}</h1>${listingLine()}${route()}<div class="btns"><button type="button" class="b b-primary" data-act="quick:explore">Start this trip</button></div></section>`;

const behind = (place) =>
  place === "explore"
    ? `${topBar("explore")}<main class="page d-page">${listingPage()}</main>`
    : `${topBar()}<main class="page">${newTripField()}${S.arrive === "invite" ? tripBar() : ""}<div class="surface rows">${doors().map(row).join("")}</div></main>`;
export const closeX = (act = "skip", cls = "m-x") => `<button type="button" class="iconbtn ${cls}" data-act="${act}" aria-label="Close">${gl("cross")}</button>`;
export const modal = ({ size = "md", close = "skip", label, body, place = "trips" }) =>
  `<div class="m-scene"><div class="m-behind" inert>${behind(place)}</div><div class="m-shade" data-act="${close}"></div><div class="m-wrap"><section class="m m-${size}" role="dialog" aria-modal="true" aria-label="${label}" data-close="${close}">${body}</section></div></div>`;
export const startPlace = () => (S.door === "explore" ? "explore" : "trips");
export const closedPage = () =>
  `${topBar(startPlace())}<main class="page${S.door === "explore" ? " d-page" : ""}"><p class="ghost-note">Closed. No trip was made, and nothing was lost.</p>${S.door === "explore" ? listingPage() : newTripField() + (S.arrive === "invite" ? tripBar() : "")}${again()}</main>`;
