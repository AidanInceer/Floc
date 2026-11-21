import { variants } from "/_house/switcher.js";
import { tripFrame, toast, addMonths, esc } from "/_house/kit/trip-frame.mjs";
import { ME, state, span, nightsOf } from "./shared.js";
import * as A from "./v-a.js";
import * as B from "./v-b.js";
import * as C from "./v-c.js";
import * as D from "./v-d.js";
import * as E from "./v-e.js";
import * as F from "./v-f.js";
import * as G from "./v-g.js";
import * as H from "./v-h.js";
import * as I from "./v-i.js";
import * as J from "./v-j.js";
import * as G2 from "./v-g2.js";
import * as G3 from "./v-g3.js";
import * as G4 from "./v-g4.js";
import * as G3b from "./v-g3b.js";
import * as R2 from "./r2.js";

const V = { A, B, C, D, E, F, G, H, I, J, G2, G3, G4, G3b };
const LIST = [
  { key: "G3b", round: 2, name: "One answer, blue marks", idea: "G3 with new day marks. A day you can do has a dashed blue edge. A day you prefer is filled blue. No star, no yellow." },
  { key: "G2", round: 2, name: "Short list", idea: "G with fewer words. Best dates is three lines. Press one to see why and set it." },
  { key: "G3", round: 2, name: "One answer", idea: "G with fewer words. Best dates shows one window, best first. The arrows step to the next and mark it on your calendar." },
  { key: "G4", round: 2, name: "Under the calendar", idea: "G with fewer words and no side column. Press a window under the calendar to mark it on your days." },
  { key: "F", round: 2, name: "Steps down the side", idea: "The Dates rail becomes the steps: How long, Your days, The group. Each says what you have answered. One step on screen at a time." },
  { key: "G", round: 2, name: "One page", idea: "C with length as its own quiet section above the calendar. Best dates and who is in stay beside it, so every press shows its effect." },
  { key: "H", round: 2, name: "Group calendar", idea: "You mark your days on the group calendar. Press a window in the list to see it on the calendar and why it ranks there, person by person." },
  { key: "I", round: 2, name: "Checklist", idea: "Five rows that open in place: how long, days you can do, days you would rather, who is in, best dates. Closed rows show your answer." },
  { key: "J", round: 2, name: "Side by side", idea: "The top three windows as columns and the people as rows, so you can read who each window works for. Your answers sit with it." },
  { key: "A", round: 1, name: "Shortlist of options", idea: "Anyone adds whole windows. Everyone answers Yes, If need be or No on each. The leader can be set as the dates." },
  { key: "B", round: 1, name: "Length, then week", idea: "Two coarse questions: how long, and which week. Floc turns the most picked of each into one window you can nudge by a day." },
  { key: "C", round: 1, name: "Preferred days", idea: "Your days gains a second mark, Prefer, a one-press Free all month, and a nights choice. Best fit ranks by who prefers the days." },
  { key: "D", round: 1, name: "What suits you", idea: "Each person gives limits, not dates: nights, days off work, part of the month. Floc ranks the windows and says who each one misses." },
  { key: "E", round: 1, name: "Pencil it in", idea: "One person pencils in a window on The trip. Everyone else answers with one press: works, or rather earlier, later, shorter, longer." },
];

function seedAll() {
  for (const k of Object.keys(V)) state[k] = V[k].seed(state.group);
  state.R = R2.seed(state.group);
  state.trip = null;
  state.ym = "2027-02";
}

function protoBar() {
  const v = LIST.find((x) => x.key === state.variant);
  const knob = (value, label) => `<button type="button" data-act="group" data-v="${value}" data-k="group-${value}" aria-pressed="${state.group === value}">${label}</button>`;
  return `<div class="proto-bar"><b>${v.key}: ${esc(v.name)}</b><span class="idea">The Dolomites, February. Six people, no dates yet. ${esc(v.idea)}</span>` +
    `<div class="knob"><span>Group</span>${knob("none", "Nobody yet")}${v.round === 2 ? knob("open", "Wide open") + knob("busy", "Busy") : knob("open", "Most answered")}</div>` +
    `<div class="knob"><button type="button" data-act="restart" data-k="restart">Start over</button></div></div>`;
}

function head() {
  const t = state.trip;
  return `<div class="dhead"><h1 class="sr-only">Dates</h1><p class="big">${t ? `${span(t.a, t.b)}, ${nightsOf(t.a, t.b)}` : "No dates yet"}</p>` +
    (t ? `<button type="button" class="btn" data-act="unset" data-k="unset">Reset dates</button>` : "") + `</div>`;
}

function render() {
  const keep = document.activeElement?.dataset?.k;
  const v = V[state.variant].view(state);
  document.getElementById("proto").innerHTML = protoBar();
  document.getElementById("page").innerHTML = head() +
    `<div class="board${v.wide ? " wide" : ""}${v.sideFirst ? " side-first" : ""}${v.solo ? " solo" : ""}${v.full ? " full" : ""}${v.cls ? ` ${v.cls}` : ""}"><nav class="rail" aria-label="Dates views">${v.rail}</nav>` +
    `<div class="main">${v.main}</div>${v.side ? `<aside class="side">${v.side}</aside>` : ""}</div>` +
    `<section class="ghost">Below: Clear availability, Reset dates and Get booking, unchanged</section>`;
  if (keep) document.querySelector(`[data-k="${CSS.escape(keep)}"]`)?.focus();
}

const route = (d) => (d.act.startsWith("r-") ? R2 : V[state.variant]).act(d, state);

let pointer = "mouse";
let painted = null;
document.addEventListener("pointerdown", (e) => {
  pointer = e.pointerType;
  const t = e.target.closest?.("[data-paint]");
  if (!t || pointer !== "mouse" || e.button !== 0) return;
  painted = t.dataset.iso;
  route({ ...t.dataset, start: true });
  render();
});
document.addEventListener("pointerover", (e) => {
  const t = e.target.closest?.("[data-paint]");
  if (!t || e.pointerType !== "mouse" || e.buttons !== 1 || t.dataset.iso === painted) return;
  painted = t.dataset.iso;
  route({ ...t.dataset });
  render();
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act],.tf-tabs a,.tf-places a");
  if (!t) return;
  if (t.matches("a")) { e.preventDefault(); toast("Not in this prototype"); return; }
  const d = t.dataset;
  if ("paint" in d) {
    if (e.detail !== 0 && pointer === "mouse") return;
    route({ ...d, start: true });
  } else if (d.act === "month") state.ym = addMonths(state.ym, Number(d.step));
  else if (d.act === "set") { state.trip = { a: d.a, b: d.b }; toast(`Dates set: ${span(d.a, d.b)}`); }
  else if (d.act === "unset") state.trip = null;
  else if (d.act === "group") { state.group = d.v; seedAll(); }
  else if (d.act === "restart") seedAll();
  else if (d.act === "tab-off") { toast("Unchanged in this prototype"); return; }
  else route(d);
  render();
});

seedAll();
document.getElementById("frame").innerHTML = tripFrame("dates", ME);
variants(LIST, (key) => { state.variant = key; render(); });
