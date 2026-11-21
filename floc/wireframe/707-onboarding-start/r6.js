import { dom, monthGrid, monthName, nights } from "/_house/kit/trip-frame.mjs";
import { S, INVITE, closeX, esc, face, faces, gl, hello, inviteNames, live, modal, press, quiet, row, startPlace, tile } from "./kit.js";
import { airportPicker, head, og } from "./ob.js";
import { SUMMARY, WHO, nameInput, styleRows, vibeGrid } from "./r5.js";
import { borrowed, current, stepBody } from "./trip.js";

const dots = (n, i) =>
  `<span class="dots" role="img" aria-label="Step ${i + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<i${k === i ? ' class="is-on"' : k < i ? ' class="is-done"' : ""}></i>`).join("")}</span>`;

const shell = ({ label, close, place = "trips", body, left, right, mid = "", cls = "", size = "sm fixed", top = "" }) =>
  modal({
    size,
    label,
    close,
    place,
    body: `${closeX(close)}${top}<div class="g-body step-in ${cls}">${body}</div><footer class="m-foot g-foot"><span class="g-side">${left}</span>${mid}<span class="g-side g-right">${right}</span></footer>`,
  });

const introV2 = () => {
  const invited = S.arrive === "invite";
  return `<div class="intro">${live("face:72")}<h2>${invited ? hello("You are in") : "Welcome to Floc."}</h2>${quiet(invited ? `${inviteNames()} are on ${INVITE.name}. First, a few quick questions so Floc fits you.` : "A few quick questions before we get started, so Floc fits you. Skip any of them.")}</div>`;
};
const introV3 = () => {
  const invited = S.arrive === "invite";
  const ahead = [["flight", "blue", "Where you fly from"], ["star", "plain", "How you like to travel"], ["explore", "plain", "What you’re into"]];
  return `<div class="intro">${live("face:72")}<h2>${invited ? hello("You are in") : "Welcome to Floc."}</h2>${quiet(invited ? `You are on ${INVITE.name}. Three quick questions first.` : "Three quick questions, then you are in.")}</div>
    <ol class="ahead">${ahead.map(([icon, tone, label]) => `<li>${tile(icon, tone)}<span>${label}</span></li>`).join("")}</ol>`;
};

const MARK = '<svg class="mark" viewBox="0 0 28 22" aria-hidden="true"><path d="M3.4 16.5 7 12.9 10.6 16.5"/><path d="M10.4 10 14 6.4 17.6 10"/><path d="M17.4 16.5 21 12.9 24.6 16.5"/></svg>';
const wordmark = () => '<span class="wm">floc<i>.</i></span>';
const introV4 = () => {
  const invited = S.arrive === "invite";
  const ahead = [["flight", "blue", "Where you fly from"], ["star", "plain", "How you like to travel"], ["explore", "plain", "What you’re into"]];
  return `<div class="intro intro4"><span class="brand">${MARK}</span><h2>${invited ? `${hello("You are in").replace(/.$/, "")}, on ${wordmark()}` : `Welcome to ${wordmark()}`}</h2>${quiet(invited ? `You are on ${INVITE.name}. Three quick questions first.` : "Three quick questions, then you are in.")}</div>
    <ol class="ahead">${ahead.map(([icon, tone, label]) => `<li>${tile(icon, tone)}<span>${label}</span></li>`).join("")}</ol>`;
};

const SKETCH = '<svg class="sketch" viewBox="0 0 96 48" aria-hidden="true"><path d="M8 38 C 28 8, 52 44, 88 12" /><circle cx="8" cy="38" r="3.5"/><circle cx="46" cy="28" r="3.5"/><circle cx="88" cy="12" r="3.5"/></svg>';

const finishV2 = () => {
  const invited = S.arrive === "invite";
  const slots = `<span class="fc-faces">${face(S.me, 28)}<span class="slot">${gl("plus")}</span><span class="slot">${gl("plus")}</span></span>`;
  const open = invited ? row({ lead: tile("trips", "green"), label: `Open ${INVITE.name}`, hint: `${inviteNames()} are on it`, act: "door:trip", end: faces(INVITE.people, 20) }) : "";
  const link = invited ? "" : row({ lead: tile("link"), label: "Got a link?", hint: "Paste an invite and you are on the trip", act: "door:link" });
  return `<div class="g-centre"><h2>Where to first?</h2></div>
    <button type="button" class="first-card" data-act="door:new"><span class="fc-text"><span class="fc-t">${invited ? "Start a trip of your own" : "Start a trip"}</span><span class="fc-h">Name it, then invite your people</span></span>${slots}</button>
    ${open || link ? `<div class="rows ruled">${open}${link}</div>` : ""}
    <button type="button" class="explore-card" data-act="door:explore"><span class="fc-text"><span class="ex-t">${gl("explore")}Browse ready-made trips</span><span class="fc-h">Borrow one from Explore and make it yours</span></span>${SKETCH}</button>`;
};
const finishV3 = () => {
  const invited = S.arrive === "invite";
  const open = invited ? row({ lead: tile("trips", "green"), label: `Open ${INVITE.name}`, hint: `${inviteNames()} are on it`, act: "door:trip", end: faces(INVITE.people, 20) }) : "";
  const link = invited ? "" : row({ lead: tile("link"), label: "Got a link?", hint: "Paste an invite and you are on the trip", act: "door:link" });
  return `<div class="g-centre"><h2>Where to first?</h2></div>
    <div class="first-field"><label class="fld"><span class="typed">${invited ? "Name a trip of your own" : "Name your first trip"}</span><span class="ff-row"><input data-bind="trip.name" data-enter="door:new" value="${esc(S.trip.name)}" autocomplete="off" maxlength="60"><button type="button" class="b b-primary" data-act="door:new">Start</button></span></label><span class="ff-next">${face(S.me, 22)}<span class="slot sm">${gl("plus")}</span><span class="slot sm">${gl("plus")}</span><span>Invite people next</span></span></div>
    <div class="rows ruled">${open}${link}</div>
    <button type="button" class="explore-link" data-act="door:explore">${gl("explore")}<span>Not sure where yet? <b>Browse Explore</b></span>${gl("chevR")}</button>`;
};

const WELCOME_NAV = (i) => ({
  left: i === 0 ? press("step:4", "Skip for now", "ghost") : press(`step:${i - 1}`, "Back", "ghost"),
  right: i === 0 ? press("step:1", "Let’s go", "primary") : i === 4 ? press("skip", "Look around", "ghost") : press(`step:${i + 1}`, i === 3 ? "Done" : "Next", "primary"),
});

export function welcomeV(v) {
  const i = Math.min(S.step, 4);
  const steps = [
    v === 2 ? introV2() : v === 4 ? introV4() : introV3(),
    head("flight", "blue", "Where do you usually fly from?", "") + airportPicker(),
    head("", "", "How do you like to travel?", "One in each row, or none.") + styleRows("tick"),
    head("", "", "What are you into?", "Pick as many as you like.") + vibeGrid("tick"),
    v === 2 ? finishV2() : finishV3(),
  ];
  return shell({ label: "Welcome", close: "skip", body: steps[i], ...WELCOME_NAV(i), mid: i < 4 ? dots(4, i) : "", cls: `sel-tick${i === 0 ? " is-intro" : ""}`, size: v === 4 ? "sm glide" : "sm fixed", top: v === 4 && i > 0 ? `<span class="m-brand">${MARK}</span>` : "" });
}

function cal2() {
  const { start, end } = S.trip;
  const cells = monthGrid(S.cal).flat().map((d) => {
    if (!d) return "<span></span>";
    const edge = d === start || d === end;
    const inside = start && end && d > start && d < end;
    return `<button type="button" class="cal-d${edge ? " is-edge" : inside ? " is-in" : ""}" data-act="day:${d}">${dom(d)}</button>`;
  });
  return `<div class="cal cal2"><div class="cal-head"><button type="button" class="iconbtn" data-act="month:-1" aria-label="Month before">${gl("chevL")}</button><span class="nums">${monthName(S.cal)}</span><button type="button" class="iconbtn" data-act="month:1" aria-label="Month after">${gl("chevR")}</button></div>` +
    `<div class="cal-grid">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<span class="cal-wd">${d}</span>`).join("")}${cells.join("")}</div>` +
    `<div class="cal2-foot"><button type="button" class="b b-ghost" data-act="ans:dates=no">No dates yet</button></div></div>`;
}
const datesSub = () => {
  const lst = borrowed();
  const { start, end } = S.trip;
  if (lst) return start ? `${lst.nights} nights` : `Pick a start day. The ${lst.nights} nights follow.`;
  if (start && end) return `${nights(start, end)} nights`;
  return start ? "Now tap the last day." : "Tap the first day, then the last.";
};

export function startV({ glide = false } = {}) {
  const { steps, i } = current();
  const kind = steps[i];
  let body;
  if (kind === "dates") body = head("dates", "yellow", "When do you go?", datesSub()) + `<div class="g-cal">${cal2()}</div>`;
  else if (kind === "who") body = head("people", "", "Who’s coming?", "") + WHO.grid();
  else if (kind === "name") body = head("", "", "Choose a name for the trip", "") + SUMMARY.ticket() + nameInput();
  else body = stepBody(kind);
  const left = i === 0 ? press("close", "Cancel", "ghost") : press(`step:${i - 1}`, "Back", "ghost");
  const right = i === steps.length - 1
    ? `<button type="button" class="b b-primary" data-act="create" data-needs="trip.name"${S.trip.name.trim() ? "" : " disabled"}>Create trip</button>`
    : press(`step:${i + 1}`, "Next", "primary");
  return shell({ label: "Start a trip", close: "close", place: startPlace(), body, left, right, mid: dots(steps.length + 1, i + 1), cls: "sel-fade", size: glide ? "sm glide" : "sm fixed" });
}

export { og };
