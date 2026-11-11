// The live hero's five cards and its clock, rebuilt in plain JS (components/landing/hero/*). Each card is built once; apply(step) sets its beat.
import { ico, face, group } from "/_house/switcher.js";

const VOTES = [["Priya", "Sicily"], ["Sam", "Lisbon"], ["Jo", "Sicily"], ["Alex", "Croatia"], ["Kit", "Lisbon"], ["Maya", "Sicily"]];
const PLACES = ["Lisbon", "Sicily", "Croatia"];
export const BEATS = [300, 780, 1260, 1740, 2220, 2700, 3400, 4900, 6700, 7175, 7650, 8450, 9700, 12900, 14600];
export const VOTED = 6, DATED = 7, ROUTED = 8, SPENT = 9, SETTLED = 12, SPUN = 13, CLAIMED = 14, DONE = 15;
export const END_MS = 13500;

// Which card the scene is playing at a step: the layouts that show one card at a time follow it.
export const playing = (step) => (step === 0 ? null : step >= DONE ? "ticket" : step <= VOTED ? "votes" : step === DATED ? "dates" : step === ROUTED ? "ticket" : step < SPUN ? "money" : "pack");
export const ORDER = ["votes", "dates", "ticket", "money", "pack"];

const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const swap = (from, to) => `<span class="dk-swap"><span>${from}</span><span>${to}</span></span>`;
const kicker = (w) => `<span class="dk-kicker">${w}</span>`;
const person = (name) => group.find((p) => p.name === name) || { name, tone: 5 };

function votes() {
  const node = el(`<div class="dk-card tone-yellow dk-votes">
    <div class="dk-row">${kicker("Where to")}<span class="dk-head-note"></span></div>
    <div class="dk-vote-list">${PLACES.map((p) => `<div class="dk-vote" data-place="${p}"><span>${p}</span><span class="dk-blocks">${"<i></i>".repeat(6)}</span><span class="nums dk-n">0</span></div>`).join("")}</div>
    <p class="dk-voter"></p></div>`);
  const note = node.querySelector(".dk-head-note");
  const voter = node.querySelector(".dk-voter");
  let shown = -1;
  return { el: node, apply(step) {
    const cast = Math.min(step, VOTED);
    if (cast === shown) return;
    shown = cast;
    const count = Object.fromEntries(PLACES.map((p) => [p, 0]));
    VOTES.slice(0, cast).forEach(([, p]) => count[p]++);
    const lead = cast ? PLACES.reduce((a, b) => (count[b] > count[a] ? b : a)) : null;
    node.querySelectorAll(".dk-vote").forEach((row) => {
      const p = row.dataset.place;
      row.classList.toggle("lead", lead === p && cast === VOTED);
      row.querySelectorAll("i").forEach((b, i) => b.classList.toggle("on", i < count[p]));
      const n = row.querySelector(".dk-n");
      if (n.textContent !== String(count[p])) { n.textContent = count[p]; n.classList.remove("dk-roll"); void n.offsetWidth; n.classList.add("dk-roll"); }
    });
    note.innerHTML = `<span class="dk-roll">${cast === VOTED ? `${ico("check")} All 6 · Sicily` : `${cast} of 6 voted`}</span>`;
    const last = VOTES[cast - 1];
    voter.innerHTML = last ? `<span class="dk-roll">${face(person(last[0]), 16)} <b>${last[0]}</b> voted ${last[1]}</span>` : "";
  } };
}

const HEAT = [2, 3, 1, 2, 4, 3, 2, 3, 4, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 3, 2, 4, 3, 1, 2, 3, 2, 1, 2, 3];
function dates() {
  const node = el(`<div class="dk-card tone-blue dk-dates">
    <div class="dk-row">${kicker("September")}<span class="dk-head-note">${swap("4 of 6 free", `${ico("check")} All 6 free`)}</span></div>
    <div class="dk-month">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<b>${d}</b>`).join("")}<i></i><i></i>${HEAT.map((h, i) => {
      const d = i + 1;
      return `<span class="${d >= 12 && d <= 19 ? "pick" : ""}" style="--heat:${h * 5}%;--delay:${d >= 12 ? (d - 12) * 0.0875 : 0}s">${d}</span>`;
    }).join("")}</div></div>`);
  return { el: node, apply(step) {
    const on = step >= DATED;
    node.querySelector(".dk-month").classList.toggle("agreed", on);
    node.querySelector(".dk-swap").classList.toggle("on", on);
  } };
}

const STOPS = [["Palermo", 2], ["Cefalù", 1], ["Taormina", 2], ["Syracuse", 2]];
function ticket() {
  const node = el(`<div class="dk-card dk-ticket">
    <div class="dk-ticket-top">
      <div class="dk-row dk-top"><p class="dk-name">Sicily</p><span class="dk-stamp">${ico("check")} Agreed</span></div>
      <p class="dk-when">${swap("<span>Dates open</span><i> · </i><span>6 asked</span>", "<span>Sun 12 – Sun 19 Sep</span><i> · </i><span>7 nights</span>")}</p>
      <ol class="dk-route">${STOPS.map(([n, d], i) => `<li style="--delay:${0.19 + i * 0.35}s"><i></i>${n}<span>${d} ${d === 1 ? "night" : "nights"}</span></li>`).join("")}</ol>
    </div>
    <div class="dk-perf"></div>
    <div class="dk-row dk-foot"><span class="dk-going"><span class="avatar-row">${group.map((p) => face(p, 20)).join("")}</span>6 going</span>
      <span class="nums">${swap("Priya is owed £760.00", `<b class="dk-square">Square</b>`)}</span></div></div>`);
  return { el: node, apply(step) {
    const routed = step >= ROUTED;
    node.querySelector(".dk-stamp").classList.toggle("on", routed);
    node.querySelector(".dk-when .dk-swap").classList.toggle("on", routed);
    node.querySelector(".dk-route").classList.toggle("drawn", routed);
    node.querySelector(".dk-foot .dk-swap").classList.toggle("on", step >= SETTLED);
  } };
}

const SPEND = [["Flat, Palermo", "£960.00", "£160.00"], ["Car hire", "£102.00", "£177.00"], ["Dinner, Ortigia", "£138.00", "£200.00"]];
function money() {
  const node = el(`<div class="dk-card tone-green dk-money">
    <div class="dk-row">${kicker("Each")}<span class="dk-head-note">${swap("&nbsp;", `${ico("check")} Square`)}</span></div><p class="dk-each nums"><span class="dk-roll">£0.00</span></p>
    <div class="dk-spend">${SPEND.map(([w, c]) => `<div><span>${w}</span><span class="nums">${c}</span></div>`).join("")}</div>
    <span class="dk-settled"><span class="dk-tick"><svg viewBox="0 0 14 14" aria-hidden="true"><path pathLength="1" d="M2.6 7.4 5.6 10.4 11.4 4"/></svg></span>Settled up</span></div>`);
  let shown = 0;
  return { el: node, apply(step) {
    const landed = Math.max(0, Math.min(step - SPENT + 1, 3));
    node.querySelectorAll(".dk-spend > div").forEach((d, i) => d.classList.toggle("on", i < landed));
    if (landed !== shown) { shown = landed; node.querySelector(".dk-each").innerHTML = `<span class="dk-roll">${SPEND[landed - 1]?.[2] ?? "£0.00"}</span>`; }
    node.classList.toggle("settled", step >= SETTLED);
    node.querySelector(".dk-swap").classList.toggle("on", step >= SETTLED);
  } };
}

const CLAIMS = [["Speaker", "Sam"], ["Adapters", "Jo"], ["Sun cream", "You"]];
const POOL = ["Towels", "Snorkel", "Cards", "Hat", "Charger", "Bug spray", "First aid", "Frisbee", "Books", "Goggles", "Torch", "Tote bag"];
const PEOPLE = ["Priya", "Alex", "Maya", "Kit", "Sam", "Jo"];
const reel = (words, end, s, cls = "") => `<span class="dk-reel ${cls}"><span class="dk-strip" style="--end:calc(${words.length} * var(--rl, 22px));--spin:${s}s">${[...words, end].map((w) => `<span>${w}</span>`).join("")}</span></span>`;
function pack() {
  const node = el(`<div class="dk-card tone-red dk-pack">
    <div class="dk-row">${kicker("Packing")}<span class="dk-head-note">${swap("&nbsp;", `${ico("check")} 3 claimed`)}</span></div>
    <ul class="dk-reels">${CLAIMS.map(([item, who], row) => {
      const spins = Array.from({ length: 9 + row * 3 }, (_, k) => k);
      const s = 1.875 + row * 0.5625;
      return `<li class="${who === "You" ? "you" : ""}" style="--lock:${s + 0.19}s">${reel(spins.map((k) => POOL[(k * 5 + row * 3) % POOL.length]), item, s)}${reel(spins.map((k) => PEOPLE[(k + row * 2) % PEOPLE.length]), who, s + 0.19, "right")}</li>`;
    }).join("")}</ul></div>`);
  return { el: node, apply(step) {
    node.querySelector(".dk-reels").classList.toggle("on", step >= SPUN);
    node.querySelector(".dk-swap").classList.toggle("on", step >= CLAIMED);
  } };
}

export function buildCards() {
  return { votes: votes(), dates: dates(), ticket: ticket(), money: money(), pack: pack() };
}

// The plane on its dashed trail: one clock moves the plane and uncovers the trail, from the first vote to the end.
let masks = 0;
export function flight(shape) {
  const id = `dk-mask-${++masks}`;
  const node = el(`<div class="dk-flight" aria-hidden="true"><svg class="dk-trail"><defs><mask id="${id}" maskUnits="userSpaceOnUse"><path class="dk-reveal"/></mask></defs><path class="dk-dash" mask="url(#${id})"/></svg>
    <span class="dk-plane"><svg viewBox="0 0 24 24"><path d="M21 15.5v-1.6l-8-5V3.4a1.5 1.5 0 0 0-3 0v5.5l-8 5v1.6l8-2.5v5.5l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5v-5.5Z"/></svg></span></div>`);
  const svg = node.querySelector(".dk-trail");
  const dash = node.querySelector(".dk-dash");
  const reveal = node.querySelector(".dk-reveal");
  const plane = node.querySelector(".dk-plane");
  let w = 0, h = 0, len = 0;
  const size = () => {
    const r = node.getBoundingClientRect();
    if (r.width === w && r.height === h) return;
    [w, h] = [r.width, r.height];
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const d = shape(w, h);
    dash.setAttribute("d", d);
    reveal.setAttribute("d", d);
    len = reveal.getTotalLength();
    reveal.style.strokeDasharray = `${len} ${len}`;
  };
  return { el: node, at(t) {
    size();
    if (!len) return;
    reveal.style.strokeDashoffset = `${len * (1 - t)}`;
    const p = reveal.getPointAtLength(len * t);
    const q = reveal.getPointAtLength(Math.min(len, len * t + 1));
    plane.style.left = `${p.x}px`;
    plane.style.top = `${p.y}px`;
    plane.style.rotate = `${Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI + 90}deg`;
    plane.style.opacity = t > 0 && t < 1 ? 1 : 0;
  } };
}

// Runs the beats once the scene is in view; onStep gets every new step. Reduced motion jumps to the end.
export function runScene(root, onStep, onTick) {
  let start = 0, step = -1, raf = 0, stopped = false;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frame = (now) => {
    if (stopped) return;
    const t = now - start;
    const next = BEATS.filter((b) => t >= b).length;
    if (next !== step) { step = next; onStep(step); }
    onTick?.(Math.min(1, Math.max(0, (t - BEATS[0]) / (END_MS - BEATS[0]))));
    if (t < BEATS[BEATS.length - 1] + 200) raf = requestAnimationFrame(frame);
  };
  onStep(0);
  const watch = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    watch.disconnect();
    if (calm) { onStep(BEATS.length); onTick?.(1); return; }
    start = performance.now();
    raf = requestAnimationFrame(frame);
  }, { threshold: 0.25 });
  watch.observe(root);
  return () => { stopped = true; cancelAnimationFrame(raf); watch.disconnect(); };
}
