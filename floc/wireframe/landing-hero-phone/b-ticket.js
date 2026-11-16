import { ctas, face, group, h1, play, PLANE, swap } from "./lib.js";

const FIELDS = [
  ["Dates", `<span class="nums">Sun 12 – Sun 19 Sep</span>`],
  ["Going", `<span class="b-faces">${group.map((p) => face(p, 20)).join("")}</span>`],
  ["Route", "4 stops, 7 nights"],
  ["Each", `<span class="nums">£200.00</span>`],
];

export function renderTicket(stage) {
  stage.innerHTML = `<article class="b-ticket">
      <div class="b-head">${h1("left")}
        <p class="hp-lede left">Keep the destination, dates, route and costs in one place. Plan on your own, or with everyone who’s coming.</p></div>
      <div class="b-perf"><span class="b-plane">${PLANE}</span></div>
      <div class="b-body" role="img" aria-label="A sample trip to Sicily: Sunday 12 to Sunday 19 September, six going, four stops over seven nights, £200.00 each, sorted">
        <div class="b-row"><p class="b-place">Sicily</p><span class="b-stamp">Sorted</span></div>
        <dl class="b-fields">${FIELDS.map(([k, v]) => `<div><dt class="typed">${k}</dt><dd>${swap(`<span class="b-open">Open</span>`, v)}</dd></div>`).join("")}</dl>
      </div>
      <div class="b-perf"></div>
      <div class="b-stub">${ctas()}</div>
    </article>`;
  const ticket = stage.querySelector(".b-ticket");
  const fields = [...stage.querySelectorAll(".b-fields .hp-swap")];
  return play(stage, [
    [150, () => ticket.classList.add("printed")],
    [1000, () => ticket.classList.add("flown")],
    ...fields.map((f, i) => [1500 + i * 450, () => f.classList.add("on")]),
    [3500, () => ticket.classList.add("stamped")],
    [4200, () => stage.classList.add("is-sorted")],
  ]);
}
