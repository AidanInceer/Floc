// H1 — A postcard from Priya. The front is the trip as an Explore postcard, its route drawn in Explore's style; the back says who's going, when, the route, and keeps a line for you.
import { fineSicily, calmHeadline, lede, ctas, clock, reduce, onView, face, group, people, you, ico, STOPS } from "./common.js";
import { exploreSicily } from "./explore.js";

const P = people;

export function renderPostcard(stage) {
  const t = clock();
  const h = calmHeadline("hn-centre");
  stage.innerHTML = `<section class="hn r2 hh p1"><div class="hh-head"></div>${lede()}${ctas()}
    <div class="p1-pair">
      <article class="p1-front" aria-label="Postcard front: the route around Sicily">
        <div class="p1-head"><div><span class="kick">Europe · Italy</span><b class="p1-title">Sicily</b></div>
          <span class="stamp"><span>Italy</span><b class="nums">7</b><span>nights</span></span></div>
        <div class="ex-frame">${exploreSicily({ cls: "p1-map" })}</div>
      </article>
      <article class="p1-back" aria-label="Postcard back">
        <div class="p1-note">
          <p class="p1-msg">Sicily in June? The dates work for all of us and the villa is booked. There&rsquo;s a seat for you.</p>
          <p class="p1-sig">${face(P.Priya, 22)}<span>Priya</span></p>
        </div>
        <div class="p1-addr">
          <span class="p1-mark" aria-hidden="true"><span>12 Jun</span><b class="nums">2026</b></span>
          <dl>
            <div style="--i:0"><dt class="kick">Going</dt><dd><span class="avatar-row">${group.map((p) => face(p, 22)).join("")}</span></dd></div>
            <div style="--i:1" class="p1-seat"><dt class="kick">And</dt><dd><span class="r3-empty"></span><span class="p1-you">You</span></dd></div>
            <div style="--i:2"><dt class="kick">When</dt><dd class="nums">Fri 12 – Fri 19 June</dd></div>
            <div style="--i:3"><dt class="kick">Route</dt><dd class="p1-route">${STOPS.map((s) => `<span class="tone-${s.tone}"><i></i>${s.name}</span>`).join("")}</dd></div>
          </dl>
          <button type="button" class="pill-btn ghost r3-join">Join the trip</button>
          <p class="hh-in p1-in">${ico("check")}You&rsquo;re in</p>
        </div>
      </article>
    </div></section>`;
  stage.querySelector(".hh-head").append(h.el);
  const pair = stage.querySelector(".p1-pair");
  fineSicily(pair);
  h.set(0, true);

  pair.querySelector(".r3-join").addEventListener("click", () => {
    pair.querySelector(".r3-empty").outerHTML = face(you, 22);
    pair.classList.add("joined");
  });
  const run = () => {
    if (reduce) { pair.classList.add("front", "routed", "back", "waiting"); h.set(3, true); return; }
    t.at(200, () => { pair.classList.add("front"); h.set(1); });
    t.at(1100, () => { pair.classList.add("routed"); h.set(2); });
    t.at(2900, () => pair.classList.add("back"));
    t.at(4900, () => { pair.classList.add("waiting"); h.set(3); });
  };
  const off = onView(pair, run);
  return { stop() { t.stop(); h.stop(); off(); } };
}
