import { esc, ico, toast, tripFrame } from "/_house/kit/trip-frame.mjs";

const STOPS = [
  {
    n: 1,
    place: "Lisbon",
    note: "3 nights · 31 Dec – 3 Jan",
    hop: "Train to Lagos · Sun 3 Jan",
    days: [
      {
        wd: "Thu",
        d: 31,
        open: true,
        events: [
          { time: "08:15", type: "transport", glyph: "flight", name: "Flight to Lisbon" },
          { time: "15:00", type: "other", glyph: "bed", name: "Check in at Casa do Alfama" },
          { time: "20:00", type: "food", glyph: "food", name: "New Year's dinner at Taberna da Rua" },
        ],
      },
      {
        wd: "Fri",
        d: 1,
        events: [
          { time: "08:30", type: "activity", glyph: "activity", name: "Tram 28" },
          { time: "13:00", type: "food", glyph: "food", name: "Lunch at Time Out Market" },
        ],
      },
      { wd: "Sat", d: 2, events: [] },
    ],
  },
  {
    n: 2,
    place: "Lagos",
    note: "4 nights · 3–7 Jan",
    days: [
      { wd: "Sun", d: 3, events: [{ time: "09:05", type: "transport", glyph: "train", name: "Train to Lagos" }] },
      { wd: "Mon", d: 4, open: true, events: [] },
      { wd: "Tue", d: 5, events: [{ time: "10:30", type: "activity", glyph: "activity", name: "Benagil caves by boat" }] },
    ],
  },
];

const verbOf = (day) => (day.events.length ? "Open on" : "Plan it on");

function dayLink(day) {
  const label = `${verbOf(day)} Days, ${day.wd} ${day.d}`;
  return `<a class="go" href="#" data-go="${esc(label)}" aria-label="${esc(label)}">${ico("days")}<span><span class="go-verb">${verbOf(day)} </span>Days</span></a>`;
}

function eventList(day) {
  if (!day.events.length) return `<p class="nothing">Nothing planned</p>`;
  const rows = day.events.map(
    (event) =>
      `<li class="ev"><span class="t">${event.time}</span><span class="kind" data-type="${event.type}">${ico(event.glyph)}</span><span class="ev-name">${esc(event.name)}</span></li>`,
  );
  return `<ol class="events">${rows.join("")}</ol>`;
}

function dayRow(day) {
  const [first] = day.events;
  const kind = first ? `<span class="kind" data-type="${first.type}">${ico(first.glyph)}</span>` : `<span class="kind kind-open"></span>`;
  const title = first
    ? `<span class="day-name">${esc(first.name)}</span>`
    : `<span class="day-name day-empty"><span aria-hidden="true">…</span><span class="sr-only">Nothing planned</span></span>`;
  const more = day.events.length > 1 ? `+${day.events.length - 1}` : "";
  return `<li><details class="day"${day.open ? " open" : ""}>
    <summary class="day-row">
      <span class="date"><span class="wd">${day.wd}</span><span class="dn">${day.d}</span></span>
      ${kind}${title}
      <span class="ends"><span class="more nums">${more}</span><span class="chev">${ico("chev")}</span></span>
    </summary>
    <div class="panel">${eventList(day)}${dayLink(day)}</div>
  </details></li>`;
}

document.getElementById("frame").innerHTML = tripFrame("overview", { name: "Dev", initial: "De", tone: 5 });
document.getElementById("stops").innerHTML = STOPS.map(
  (stop) => `<article class="stop">
    <header class="stop-head"><span class="stop-n">${stop.n}</span><h3>${esc(stop.place)}</h3><span class="stop-note">${esc(stop.note)}</span></header>
    <ol class="days">${stop.days.map(dayRow).join("")}</ol>
  </article>${stop.hop ? `<p class="hop">${ico("train")}${esc(stop.hop)}</p>` : ""}`,
).join("");

document.getElementById("stops").addEventListener("click", (event) => {
  const link = event.target.closest("[data-go]");
  if (!link) return;
  event.preventDefault();
  toast(link.dataset.go);
});
