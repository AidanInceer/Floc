import { variants } from "/_house/switcher.js";
import { esc } from "/_house/kit/trip-frame.mjs";
import { LISTINGS, g, GLYPH, money, nightsOf, saved, heart, tileMap, toneOf } from "/624-season-picks/explore.js";

const ICON = {
  person: '<circle cx="7" cy="4.8" r="2.4"/><path d="M2.6 12.2c.5-2.4 2.2-3.8 4.4-3.8s3.9 1.4 4.4 3.8"/>',
  group: '<circle cx="4.4" cy="5.2" r="1.6"/><circle cx="9.6" cy="5.2" r="1.6"/><path d="M1.6 11c.3-1.6 1.4-2.5 2.8-2.5s2.5.9 2.6 2.5M7 11c.1-1.6 1.2-2.5 2.6-2.5s2.5.9 2.8 2.5"/>',
  wish: '<path d="M3.4 1.9h7.2v10.2L7 9.6l-3.6 2.5Z"/>',
  bag: '<path d="M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4M1.6 8h10.8"/>',
  ticket: '<path d="M3.2 1.8h7.6v10.4l-1.9-1.2-1.9 1.2-1.9-1.2-1.9 1.2Z"/><path d="M5.2 6.2l1.3 1.3 2.4-2.6"/>',
  more: '<circle class="dots" cx="3" cy="7" r=".9"/><circle class="dots" cx="7" cy="7" r=".9"/><circle class="dots" cx="11" cy="7" r=".9"/>',
  cross: '<path d="M3.6 3.6l6.8 6.8M10.4 3.6l-6.8 6.8"/>',
};

const ME = { name: "Aidan", tone: 3, likes: ["Food", "Hiking", "History"], nights: 8, price: 140000 };
const P = {
  so: { name: "Sofia Alves", tone: 1, likes: ["Food", "Cities", "History"], nights: 6, price: 120000 },
  tw: { name: "Tom Whitfield", tone: 4 },
  cr: { name: "Callum Reid", tone: 2, likes: ["Hiking", "Wildlife", "Food"], nights: 10, price: 200000 },
  jb: { name: "Jonas Berg", tone: 6 },
  mt: { name: "Mei Tanaka", tone: 5, likes: ["Food", "History", "Cities"], nights: 7, price: 160000 },
  no: { name: "Nadia Okafor", tone: 7, likes: ["Hiking", "Wildlife"], nights: 9, price: 180000 },
  el: { name: "Elif Demir", tone: 8, likes: ["Cities", "Food"], nights: 5, price: 110000 },
  ro: { name: "Rory Hale", tone: 1, likes: ["History", "Hiking"], nights: 7, price: 150000 },
};
const GROUPS = [
  { id: "uni", name: "Uni lot", people: [P.so, P.tw, P.cr, P.jb, P.mt] },
  { id: "ski", name: "Ski crew", people: [P.jb, P.no, P.tw, P.cr] },
  { id: "fam", name: "Family", people: [P.el, P.ro] },
];
const VOTED = { 0: 1, 2: 1 };

const state = { menu: null, open: null, phase: "idle", held: false, votes: new Set() };
const stage = document.getElementById("stage");
const calm = matchMedia("(prefers-reduced-motion: reduce)");
let dlg = null;

const groupOf = (id) => GROUPS.find((x) => x.id === id);
const initials = (name) => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
};
const face = (p) => `<span class="gp-face who-${p.tone}" title="${esc(p.name)}">${esc(initials(p.name))}</span>`;
const people = (n) => `${n} ${n === 1 ? "person" : "people"}`;

function fitFor(p, t) {
  const hits = t.tags.filter((x) => p.likes.includes(x)).length;
  const style = hits >= 2 ? 1 : hits ? 0.7 : 0.15;
  const length = Math.max(0, 1 - Math.abs(t.nights - p.nights) / 10);
  const cost = t.price <= p.price ? 1 : Math.max(0, 1 - (t.price - p.price) / 200000);
  return 0.5 * style + 0.25 * length + 0.25 * cost;
}

function picksFor(group) {
  const who = [ME, ...group.people.filter((p) => p.likes)];
  return LISTINGS.map((t) => {
    const fits = who.map((p) => fitFor(p, t));
    const mean = fits.reduce((a, b) => a + b, 0) / fits.length;
    const spread = Math.sqrt(fits.reduce((a, b) => a + (b - mean) ** 2, 0) / fits.length);
    return { t, pct: Math.max(0, Math.round(100 * (mean - 0.6 * spread))) };
  })
    .sort((a, b) => b.pct - a.pct || a.t.price - b.t.price)
    .slice(0, 10);
}

const dial = (pct) =>
  g(`<circle class="dial-rest" cx="7" cy="7" r="5"/><circle class="dial-fill" cx="7" cy="7" r="5" pathLength="100" stroke-dasharray="${pct} 100" transform="rotate(-90 7 7)"/>`, "g dial");
const match = (r, group) => {
  const said = `${r.pct}% match for ${group.name}`;
  return `<span class="fit bare" role="img" aria-label="${esc(said)}" title="${esc(said)}">${dial(r.pct)}${r.pct}%</span>`;
};
const figs = (t) => `<span class="figs fit-figs"><span>${nightsOf(t.nights)}</span><span class="sep"> · </span><span>${money(t.price)}</span></span>`;
const loader = (group) =>
  `<div class="rec-load" role="status"><svg class="rec-dial" viewBox="0 0 56 56" aria-hidden="true"><circle class="dial-rest" cx="28" cy="28" r="24"/><circle class="load-fill${state.held ? " held" : ""}" cx="28" cy="28" r="24" pathLength="100" transform="rotate(-90 28 28)"/></svg><p>Finding trips for ${esc(group.name)}</p></div>`;

function flag(group) {
  const none = group.people.filter((p) => !p.likes).length;
  if (!none) return "";
  return `<p class="rec-flag">Based on you and ${group.people.length - none} of ${people(group.people.length)}. ${none} ${none === 1 ? "has" : "have"} no travel style yet, so these may fit them less well.</p>`;
}

const voteBox = (t, i) => {
  const mine = state.votes.has(t.id);
  return `<button type="button" class="rec-vote" data-vote="${t.id}" data-base="${VOTED[i] ?? 0}" aria-pressed="${mine}" aria-label="Vote for: ${esc(t.title)}">${g(GLYPH.check)}<span class="nums">${(VOTED[i] ?? 0) + Number(mine)}</span></button>`;
};
const row = (r, group, end) =>
  `<li class="rr"><a class="rr-link" href="#${r.t.id}" data-listing><span class="rr-art">${tileMap(r.t)}</span>
    <span class="rr-main"><b class="tile-title">${esc(r.t.title)}</b><span class="rr-sub"><span class="tag tone-${toneOf(r.t)}">${esc(r.t.country)}</span>${figs(r.t)}</span></span>${match(r, group)}</a>${end}</li>`;

function dialogHtml() {
  const group = groupOf(state.open);
  const sent = state.phase === "sent";
  const head = `<div class="rec-head"><h2>Trips for ${esc(group.name)}</h2><button type="button" class="gp-ib" data-close aria-label="Close">${g(ICON.cross)}</button></div>`;
  if (state.phase === "loading") return `${head}${loader(group)}`;
  const top = sent ? `<p class="rec-flag">Sent to ${people(group.people.length)}. 1 of ${group.people.length + 1} has voted.</p>` : flag(group);
  const list = picksFor(group).map((r, i) => row(r, group, sent ? voteBox(r.t, i) : heart(r.t))).join("");
  const foot = sent ? "" : `<div class="rec-foot"><span>Everyone in the group can vote.</span><button type="button" class="btn-sm primary" data-ask>Ask ${esc(group.name)} to vote</button></div>`;
  return `${head}<div class="rec-body">${top}<ul class="rr-list">${list}</ul></div>${foot}`;
}

function menu(group) {
  if (state.menu !== group.id) return "";
  return `<div class="gp-pop" role="menu"><button type="button" role="menuitem" data-trip="${group.id}">Start a trip</button><button type="button" role="menuitem">Edit group</button><button type="button" role="menuitem" class="danger">Delete group</button></div>`;
}

const groupRow = (group) =>
  `<li class="gp-row"><div class="gp-line"><button type="button" class="gp-open"><span class="gp-id"><span class="gp-name">${esc(group.name)}</span><span class="nums gp-count">${people(group.people.length)}</span></span>
    <span class="gp-faces">${group.people.map(face).join("")}</span></button>
    <button type="button" class="btn-sm gp-rec" data-rec="${group.id}" aria-label="Trip ideas for ${esc(group.name)}">${dial(72)}<span>Trip ideas</span></button>
    <span class="gp-more"><button type="button" class="gp-ib" data-menu="${group.id}" aria-expanded="${state.menu === group.id}" aria-label="More for ${esc(group.name)}">${g(ICON.more)}</button>${menu(group)}</span></div></li>`;

function page() {
  const top = `<div class="gp-top"><header class="topbar"><span class="pill wordmark"><svg viewBox="0 0 22 14" aria-hidden="true"><path d="M1.5 11 6 4.5l3.5 5L13 5l3.5 4.5L20.5 3"/></svg>floc<b>.</b></span>
    <nav class="pill navs" aria-label="Main"><span class="nav">${g(GLYPH.globe)}<span>Explore</span></span><span class="nav">${g(GLYPH.plane)}<span>Trips</span></span></nav>
    <span class="pill acct">${face(ME)}<span class="acct-name">Aidan</span></span></header></div>`;
  const tabs = [
    [["Profile", ICON.person]],
    [["Friends", GLYPH.people], ["Groups", ICON.group]],
    [["Saved", GLYPH.heart], ["Wish lists", ICON.wish], ["Packing", ICON.bag]],
    [["Bookings", ICON.ticket]],
  ];
  const bar = `<div class="gp-abar"><nav aria-label="Your account">${tabs
    .map((set, i) => `${i ? '<span class="gp-sep" aria-hidden="true"></span>' : ""}${set.map(([name, icon]) => `<a class="gp-tab" href="#" aria-label="${name}"${name === "Groups" ? ' aria-current="page"' : ""}>${g(icon)}<span>${name}</span></a>`).join("")}`)
    .join("")}</nav><span class="gp-now" aria-hidden="true">Groups</span></div>`;
  const note = `<p class="fit-note"><b>Made-up groups.</b> In Uni lot, Tom and Jonas have no travel style yet. Start a trip is new to the menu: the live page has only Edit group and Delete group there. Every match figure is made up.</p>`;
  return `${top}${bar}<main class="gp-wrap"><h1 class="sr-only">Groups</h1><section class="gp-card"><div class="gp-head"><span class="nums">${GROUPS.length} groups</span><button type="button" class="btn-sm">New group</button></div>
    <ul class="gp-rows">${GROUPS.map(groupRow).join("")}</ul></section>${note}</main>`;
}

function say(text) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("p");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  (dlg ?? document.body).appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function shut() {
  state.open = null;
  state.phase = "idle";
  state.votes.clear();
  if (dlg) {
    const old = dlg;
    dlg = null;
    old.close();
    old.remove();
  }
}

function settle() {
  if (state.phase !== "loading") return;
  state.phase = "done";
  paint();
}

function paint() {
  stage.innerHTML = page();
  if (state.open) {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "rec";
      document.body.appendChild(dlg);
      dlg.addEventListener("cancel", (e) => {
        e.preventDefault();
        shut();
        paint();
      });
    }
    dlg.innerHTML = dialogHtml();
    if (!dlg.open) {
      dlg.showModal();
      document.activeElement?.blur();
    }
  }
  const fill = document.querySelector(".load-fill:not(.held)");
  if (!fill) return;
  if (calm.matches) settle();
  else fill.addEventListener("animationend", settle, { once: true });
}

document.addEventListener("click", (e) => {
  const on = (name) => e.target.closest(`[data-${name}]`);
  if (on("close") || e.target === dlg) {
    shut();
    return paint();
  }
  const save = on("save");
  if (save) {
    const id = save.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    save.setAttribute("aria-pressed", String(saved.has(id)));
    return;
  }
  if (on("rec")) {
    shut();
    state.menu = null;
    state.open = on("rec").dataset.rec;
    state.phase = "loading";
    return paint();
  }
  if (on("menu")) {
    state.menu = state.menu === on("menu").dataset.menu ? null : on("menu").dataset.menu;
    return paint();
  }
  if (on("vote")) {
    const el = on("vote");
    const id = el.dataset.vote;
    state.votes.has(id) ? state.votes.delete(id) : state.votes.add(id);
    el.setAttribute("aria-pressed", String(state.votes.has(id)));
    el.querySelector(".nums").textContent = String(Number(el.dataset.base) + Number(state.votes.has(id)));
    return;
  }
  if (on("ask")) {
    state.phase = "sent";
    return paint();
  }
  if (on("trip")) {
    state.menu = null;
    paint();
    return say(`Opens Start a trip with ${groupOf(on("trip").dataset.trip).name} picked`);
  }
  if (on("listing")) {
    e.preventDefault();
    return say("Opens the trip's page");
  }
  if (state.menu) {
    state.menu = null;
    paint();
  }
});

function render() {
  const show = new URLSearchParams(location.search).get("show");
  shut();
  state.menu = show === "menu" ? "uni" : null;
  state.held = show === "loading";
  if (show && show !== "menu") {
    state.open = "uni";
    state.phase = show === "loading" ? "loading" : show === "sent" ? "sent" : "done";
  }
  paint();
}

variants([{ key: "E", code: "E", name: "Trip ideas; send the ten to the group to vote", round: 1 }], render);
