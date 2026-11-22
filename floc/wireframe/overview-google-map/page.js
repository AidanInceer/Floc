import { addDays, avatar, dom, esc, ico, monthShort, shortDate, tripFrame, weekday } from "/_house/kit/trip-frame.mjs";
import { LEGS } from "./legs.js";

const PLACE = {
  lisbon: { name: "Lisbon", land: "Portugal" },
  porto: { name: "Porto", land: "Portugal" },
  sintra: { name: "Sintra", land: "Portugal" },
  evora: { name: "Évora", land: "Portugal" },
  lagos: { name: "Lagos", land: "Portugal" },
  seville: { name: "Seville", land: "Spain" },
  madrid: { name: "Madrid", land: "Spain" },
};
const MODES = [["car", "Car"], ["train", "Train"], ["bus", "Bus"]];
const MODE = Object.fromEntries(MODES);
const EXAMPLE = { "lisbon-porto": [175, 210], "lisbon-sintra": [40, 50], "lisbon-evora": [95, 100], "lisbon-lagos": [245, 225] };
const START = "2026-12-29";
const DRAW = {
  pencil: '<path d="M2.4 11.6l.6-2.7 6.3-6.3 2.1 2.1-6.3 6.3Z"/>',
  moon: '<path d="M11.4 8.5A4.9 4.9 0 0 1 5.5 2.6a4.9 4.9 0 1 0 5.9 5.9Z"/>',
  upload: '<path d="M7 9.4V2.6M4.2 5.2 7 2.4l2.8 2.8M2.4 9.6v1.8h9.2V9.6"/>',
};
const GLYPH = {
  plus: '<path d="M7 2.8v8.4M2.8 7h8.4"/>',
  minus: '<path d="M2.8 7h8.4"/>',
  car: '<path d="M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10"/><circle cx="4.4" cy="10.9" r="1"/><circle cx="9.6" cy="10.9" r="1"/>',
  train: '<rect x="3" y="1.8" width="8" height="8.4" rx="1.8"/><path d="M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"/>',
  bus: '<rect x="2.4" y="2.2" width="9.2" height="7.8" rx="1.4"/><path d="M2.4 6.6h9.2M4.4 10v1.8M9.6 10v1.8M7 2.2v4.4"/>',
  flight: '<path d="M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z"/>',
};
const glyph = (name) => `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${GLYPH[name] ?? ""}</svg>`;
const km = (v) => (v < 10 ? `${v.toFixed(1)} km` : `${Math.round(v).toLocaleString("en-GB")} km`);
const mins = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`);
const GOING = [{ name: "Dev", tone: 3, initial: "DU" }, { name: "Priya", tone: 1, initial: "PR" }, { name: "Sofia", tone: 4, initial: "SA" }, { name: "Tom", tone: 6, initial: "TW" }];
const draw = (name) => `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${DRAW[name]}</svg>`;

const stage = document.getElementById("stage");
const S = { stops: [{ id: "lisbon", nights: 3, mode: "car" }, { id: "lagos", nights: 4, mode: "train" }], edit: null, q: "" };
let shown = "";

const nightsOf = (n) => `${n} night${n === 1 ? "" : "s"}`;
const legOf = (a, b) => LEGS[`${a}-${b}`] ?? LEGS[`${b}-${a}`];
const five = (n) => Math.round(n / 5) * 5;
const full = (id) => `${PLACE[id].name}, ${PLACE[id].land}`;
const plain = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const startOf = (i) => addDays(START, S.stops.slice(0, i).reduce((n, s) => n + s.nights, 0));
const range = (a, b) => (monthShort(a) === monthShort(b) ? `${dom(a)}–${dom(b)} ${monthShort(b)}` : `${dom(a)} ${monthShort(a)} – ${dom(b)} ${monthShort(b)}`);

function travel(a, b, mode) {
  const leg = legOf(a, b);
  if (mode === "car") return `${km(leg.km)} · ${mins(leg.min)}`;
  const pair = EXAMPLE[`${a}-${b}`] ?? EXAMPLE[`${b}-${a}`] ?? [five(leg.min * 1.2), five(leg.min * 1.25)];
  return mins(pair[mode === "train" ? 0 : 1]);
}

function plansFor(i, k) {
  const s = S.stops[i];
  if (k === 0 && i === 0) return { kind: "transport", mark: glyph("flight"), title: `Flight to ${PLACE[s.id].name}`, more: "+1" };
  if (k === 0) return { kind: "transport", mark: glyph(s.mode), title: `${MODE[s.mode]} to ${PLACE[s.id].name}` };
  if (k === 1 && s.id === "lisbon") return { kind: "activity", mark: ico("activity"), title: "Tram 28" };
  return null;
}

function dayRow(iso, plan) {
  return (
    `<li><div class="sd"><span class="nums sd-day"><span>${weekday(iso)}</span>${dom(iso)}</span>` +
    (plan ? `<span class="kind ${plan.kind}">${plan.mark}</span><span class="sd-title">${plan.title}</span>` : `<span class="kind none"></span><span class="sd-title none">…</span>`) +
    `<span class="nums sd-more">${plan?.more ?? ""}</span>${ico("chev")}</div></li>`
  );
}

function rowsHtml() {
  const fresh = S.edit === "new";
  const at = fresh ? S.stops.length : S.edit;
  const from = S.stops[at - 1] ?? S.stops[at + 1];
  const taken = S.stops.filter((_, i) => i !== at).map((s) => s.id);
  const list = Object.keys(PLACE)
    .filter((id) => !taken.includes(id) && plain(full(id)).includes(plain(S.q.trim())))
    .sort((x, y) => (from ? (x === from.id ? 0 : legOf(from.id, x).km) - (y === from.id ? 0 : legOf(from.id, y).km) : 0));
  if (!list.length) return `<p class="ch-none">This mock-up knows seven places. Try Seville, Porto or Madrid.</p>`;
  return list
    .map(
      (id) =>
        `<button type="button" class="ch-row" data-pick="${id}" aria-pressed="${!fresh && S.stops[at].id === id}"><span class="kind">${ico("pin")}</span>` +
        `<span class="ch-name"><b>${PLACE[id].name}</b><small>${PLACE[id].land}</small></span>` +
        (from ? `<span class="nums ch-far" title="By road, ${at > 0 ? "from" : "to"} ${PLACE[from.id].name}">${glyph("car")}${travel(from.id, id, "car")}</span>` : "") +
        `</button>`,
    )
    .join("");
}

const fieldHtml = () =>
  `<label class="ch-field"><span class="typed">Place</span><input type="text" id="q" autocomplete="off" value="${esc(S.q)}"></label><div class="ch-rows" id="rows" role="group" aria-label="Places">${rowsHtml()}</div>`;

function changeHtml(i) {
  const s = S.stops[i];
  const prev = S.stops[i - 1];
  const how = prev
    ? `<div class="ch-part"><p class="ch-title">From ${PLACE[prev.id].name}</p><div class="ch-modes" role="group" aria-label="How you travel">` +
      MODES.map(([m, label]) => `<button type="button" data-mode="${m}" aria-pressed="${s.mode === m}">${glyph(m)}<b>${label}</b><span class="nums">${travel(prev.id, s.id, m)}</span></button>`).join("") +
      `</div></div>`
    : "";
  return (
    `<div class="ch">${fieldHtml()}${how}` +
    `<div class="ch-part"><p class="ch-title">Nights</p><div class="step"><button type="button" data-night="-1" aria-label="One night fewer">${glyph("minus")}</button>` +
    `<b class="nums">${s.nights}</b><button type="button" data-night="1" aria-label="One night more">${glyph("plus")}</button></div></div>` +
    `<div class="ch-foot"><button type="button" class="btn btn-drop" data-drop>Remove stop</button><button type="button" class="btn" data-done>Done</button></div></div>`
  );
}

function stopsHtml() {
  const panels = S.stops
    .map((s, i) => {
      const a = startOf(i);
      const prev = S.stops[i - 1];
      const name = PLACE[s.id].name;
      const days = Array.from({ length: s.nights + (i === S.stops.length - 1 ? 1 : 0) }, (_, k) => dayRow(addDays(a, k), plansFor(i, k)));
      return (
        (prev ? `<p class="hop">${glyph(s.mode)}<span>${MODE[s.mode]} to ${name} · ${shortDate(a)}</span><span aria-hidden="true">·</span><b>${travel(prev.id, s.id, s.mode)}</b></p>` : "") +
        `<section class="sp" id="stop-${i + 1}"><header class="sp-head"><span class="sp-no">${i + 1}</span><h3>${name}</h3>` +
        `<span class="nums sp-when">${nightsOf(s.nights)} · ${range(a, addDays(a, s.nights))}</span>` +
        `<button type="button" class="ib sp-edit" data-edit="${i}" aria-expanded="${S.edit === i}" aria-label="Change ${name}" title="Change stop">${draw("pencil")}</button></header>` +
        (S.edit === i ? changeHtml(i) : "") +
        `<ol class="sp-days">${days.join("")}</ol></section>`
      );
    })
    .join("");
  const fresh =
    S.edit === "new"
      ? `<section class="sp sp-new" style="margin-top:14px"><header class="sp-head"><h3>Add a stop</h3><button type="button" class="ib sp-edit" data-done aria-label="Close">${ico("cross")}</button></header><div class="ch">${fieldHtml()}</div></section>`
      : `<button type="button" class="btn add-stop" data-new>${ico("plus")}Add a stop</button>`;
  return panels + fresh;
}

const bookHtml = () =>
  S.stops
    .map((s, i) => {
      const a = startOf(i);
      return `<li><span class="book-no">${i + 1}</span><b>${PLACE[s.id].name}</b><span class="nums">${range(a, addDays(a, s.nights))}</span><span class="frame row">${draw("upload")}</span></li>`;
    })
    .join("");

function mapSrc() {
  const names = S.stops.map((s) => encodeURIComponent(full(s.id)));
  const base = "https://www.google.com/maps?output=embed&";
  if (!names.length) return `${base}q=Portugal`;
  if (names.length === 1) return `${base}q=${names[0]}`;
  return `${base}saddr=${names[0]}&daddr=${names.slice(1).join("+to:")}${names.length === 2 && S.stops[1].mode !== "car" ? "&dirflg=r" : ""}`;
}

function paint() {
  stage.querySelector("#stops").innerHTML = stopsHtml();
  stage.querySelector("#book").innerHTML = bookHtml();
  const src = mapSrc();
  if (src !== shown) {
    stage.querySelector("#wait").hidden = false;
    stage.querySelector("#map").src = src;
  }
  shown = src;
}

function mount() {
  const me = GOING[0];
  stage.innerHTML =
    `<div class="proto-bar"><b>Overview with Google Maps</b><span class="idea">Google's keyless embed stands in for the Maps JavaScript API. A real build draws Floc's numbered pins and takes its times from Google. Train and bus times are examples.</span></div>` +
    tripFrame("overview", me) +
    `<div class="pg"><section class="todo" aria-label="To do"><span class="todo-sq" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i${i < 5 ? ' class="on"' : ""}></i>`).join("")}</span>` +
    `<span class="todo-n"><b class="nums">5</b> of 10 done</span><span class="todo-next">Next: <b>2 stops to book</b></span><button type="button" class="btn">Find a stay</button><span class="ib">${ico("chev")}</span></section>` +
    `<section class="card"><div class="band"><div class="gm"><iframe id="map" title="Google Maps: the route" referrerpolicy="no-referrer-when-downgrade"></iframe><p class="gm-wait typed" id="wait" hidden>Updating the map</p></div>` +
    `<div class="tc-wrap"><aside class="tc"><div><span class="stamp"><i></i><span class="nums">29 DEC</span></span><h1>Portugal, late summer${draw("pencil")}</h1>` +
    `<p class="nums tc-dates"><span>Tue 29 Dec – 5 Jan 2027</span><span aria-hidden="true">·</span><span>7${draw("moon")}</span><span class="ib">${draw("pencil")}</span></p></div>` +
    `<p class="tc-soon">In 37 days</p><div class="tags"><span class="tag">the usual four${ico("cross")}</span><span class="tag add">${ico("plus")}Add a tag</span></div>` +
    `<div class="tc-rows"><p class="tc-row">You owe<span class="nums">£36.43</span></p></div></aside></div></div>` +
    `<div class="go"><div class="go-who"><span class="avatar-row">${GOING.map((p) => avatar(p, 28)).join("")}</span><span class="go-names"><b>4 going</b><small>Dev, Priya, Sofia and Tom</small></span>` +
    `<button type="button" class="btn btn-primary">${ico("people")}Invite</button></div>` +
    `<section class="go-files"><h2>Files</h2><p>No tickets or bookings yet</p><span class="frame">${draw("upload")}</span></section></div></section>` +
    `<section class="stops"><h2>Stops</h2><div class="stops-grid"><div class="stops-col" id="stops"></div>` +
    `<aside class="book-wrap"><div class="book"><h3 class="typed">Bookings</h3><ul id="book"></ul><div class="book-all">Whole trip<span class="frame row">${draw("upload")}</span></div></div></aside></div></section></div>`;
  stage.querySelector("#map").addEventListener("load", () => { stage.querySelector("#wait").hidden = true; });
  paint();
}

stage.addEventListener("click", (e) => {
  const on = (sel) => e.target.closest(sel);
  if (on("[data-edit]")) {
    const i = Number(on("[data-edit]").dataset.edit);
    S.edit = S.edit === i ? null : i;
  } else if (on("[data-new]")) S.edit = "new";
  else if (on("[data-done]")) S.edit = null;
  else if (on("[data-pick]")) {
    const id = on("[data-pick]").dataset.pick;
    if (S.edit === "new") {
      S.stops.push({ id, nights: 1, mode: "car" });
      S.edit = S.stops.length - 1;
    } else S.stops[S.edit].id = id;
  } else if (on("[data-mode]")) S.stops[S.edit].mode = on("[data-mode]").dataset.mode;
  else if (on("[data-night]")) S.stops[S.edit].nights = clamp(S.stops[S.edit].nights + Number(on("[data-night]").dataset.night), 1, 14);
  else if (on("[data-drop]")) {
    S.stops.splice(S.edit, 1);
    S.edit = null;
  } else return;
  S.q = "";
  paint();
  if (S.edit === "new") stage.querySelector("#q").focus();
});

stage.addEventListener("input", (e) => {
  if (e.target.id !== "q") return;
  S.q = e.target.value;
  stage.querySelector("#rows").innerHTML = rowsHtml();
});

mount();
