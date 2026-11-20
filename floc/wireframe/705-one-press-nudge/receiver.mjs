import { TASKS, person } from "./model.mjs";

export const NOTES = {
  three: "Press Nudge anywhere. The same person and task then reads Nudged on every surface. View as Sam to see what arrives, and press the inbox line.",
  other: "Priya nudged Sam for days and ideas 3 hours ago. Aidan sees Nudged beside Sam and cannot send a second one. Nudge on Left to sort reaches only the others.",
  all: "Everyone named was nudged today. Left to sort and Ideas show the word Nudged where the button was. Clock + 24 hours brings Nudge back.",
  one: "One person left: the line names them and the press reaches one person.",
  many: "Nine people and long names. A line that names more than three says the first two, then how many others. Rows wrap; nothing clips.",
  solo: "A trip of one has nobody to nudge, so there is no Nudge anywhere. What Left to sort says instead belongs to #704.",
  guest: "A guest has no account, so there is no Nudge beside them and Left to sort does not name them.",
  cap: "Aidan has 1 nudge left today. Nudge on Left to sort reaches the first person, stops, and says why. The others stay on Nudge.",
  meanwhile: "Sam marked days, voted and paid after this page loaded. A press sends nothing, the row corrects itself and a line says so.",
  fail: "The next send fails. The button goes back to Nudge and a line says it did not send. Nothing is stored.",
  muted: "Sam muted this trip. Aidan sees Nudged as usual. Sam gets the inbox line only: no push and no email.",
  set: "Dates are set and a night has a place, so days and ideas are closed (ADR-028). Only the settle-up nudge is left.",
};

export function receiver(state, h) {
  const v = person(state, state.viewer);
  const items = state.inbox[v.id] ?? [];
  const latest = items[0];
  const rows = items.map((n, i) =>
    `<li><button type="button" class="note${n.read ? "" : " new"}" data-inbox="${i}">${h.avatar(person(state, n.from), 26)}` +
    `<span class="note-text">${h.esc(n.text)}</span><span class="note-end">${n.read ? "" : '<em class="badge pen">New</em>'}<span class="nums quiet">${h.ago(state, n.at)}</span></span></button></li>`).join("");
  const inbox = `<div class="out-card"><header class="card-head mono"><h2 class="typed">Inbox</h2><span class="nums count">${items.filter((n) => !n.read).length} new</span></header>` +
    (rows ? `<ul class="notes">${rows}</ul>` : '<p class="out-none">No nudges</p>') + `</div>`;
  const from = latest ? person(state, latest.from).name : "";
  const push = !latest
    ? '<p class="out-none dashed">No nudge yet</p>'
    : latest.quiet
      ? `<p class="out-none dashed">No push and no email: ${h.esc(v.name)} muted this trip. The inbox line still arrives.</p>`
      : `<div class="push"><span class="push-mark">floc<i>.</i></span><span class="push-words"><b>${h.esc(state.trip.name)}</b><span>${h.esc(from)} nudged you to ${TASKS[latest.task].todo}</span></span><span class="nums quiet">now</span></div>`;
  const email = !latest || latest.quiet
    ? ""
    : `<div class="out-card mail"><p class="mail-subject"><span class="typed">Subject</span>${h.esc(latest.text)}</p>` +
      `<div class="mail-card"><p class="typed">${h.esc(state.trip.name)}</p><p class="mail-line">${h.esc(from)} nudged you to ${TASKS[latest.task].todo}.</p><span class="b b-pri">${TASKS[latest.task].act}</span></div></div>`;
  return `<section class="out" aria-label="What ${h.esc(v.name)} gets"><p class="out-cap typed">Outside the trip: what ${h.esc(v.name)} gets</p>` +
    `<div class="out-cols"><div><p class="typed out-label">In Floc</p>${inbox}</div><div><p class="typed out-label">Push</p>${push}</div>` +
    `<div><p class="typed out-label">Email, if push cannot reach them</p>${email || '<p class="out-none dashed">Nothing sent</p>'}</div></div></section>`;
}

export function stateReadout(state, h) {
  const v = h.person(state, state.viewer);
  const hours = Math.round(state.now / (60 * 60 * 1000));
  const nudges = state.nudges.map((n) => {
    const live = state.now - n.at < 24 * 60 * 60 * 1000;
    return `<li>${h.person(state, n.from).name} to ${h.person(state, n.to).name} · ${TASKS[n.task].todo} · ${h.ago(state, n.at)} · ${live ? "holds the button on Nudged" : "older than 24 hours"}</li>`;
  }).join("");
  const waitingOn = state.meanwhile.length ? `<li>Done since the page loaded, not yet shown: ${state.meanwhile.join(", ")}</li>` : "";
  return `<p class="typed">Prototype state, not part of the design</p><ul>` +
    `<li>Clock: ${hours} h after the start</li><li>${v.name} has sent ${h.usedToday(state, v.id)} of ${h.CAP} nudges in the last 24 hours</li>` +
    (state.failNext ? "<li>The next send will fail</li>" : "") + waitingOn + (nudges || "<li>No nudges stored</li>") + `</ul>`;
}
