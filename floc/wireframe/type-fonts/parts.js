// The mock-up sections every view shares. Only the faces change, through --display, --sans and --type.
const PEOPLE = [
  { name: "Priya Raman", tone: 1 },
  { name: "You", tone: 5 },
  { name: "Tom Whitfield", tone: 4 },
  { name: "Sofia Alves", tone: 2 },
];
const initials = (name) => {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
};
const faceOf = (p) => `<span class="tf-face who-${p.tone}" title="${p.name}">${initials(p.name)}</span>`;

const chevrons = `<svg class="tf-chev" viewBox="0 0 28 22" aria-hidden="true"><path d="M3.4 16.5 7 12.9 10.6 16.5"/><path d="M10.4 10 14 6.4 17.6 10"/><path d="M17.4 16.5 21 12.9 24.6 16.5"/></svg>`;
export const wordmark = (cls = "") => `<span class="tf-wm ${cls}">${chevrons}<span>floc<i>.</i></span></span>`;

export const beads = () => `
  <header class="tf-beads" aria-label="Site">
    <span class="tf-bead">${wordmark("is-bar")}</span>
    <span class="tf-bead"><a href="#">Explore</a></span>
    <span class="tf-bead tf-pair"><a href="#">Log in</a><a class="go" href="#">Sign up</a></span>
  </header>`;

export function spec(s) {
  return `
  <section class="tf-spec">
    <p class="tf-code nums">${s.code || s.key}</p>
    <div>
      <h1 class="tf-spec-name">${s.name}</h1>
      <p class="tf-spec-note">${s.note}</p>
      <ul class="tf-faces">
        <li><span class="typed">Display</span><b class="f-display">${s.display} <span class="nums">${s.d}</span></b></li>
        <li><span class="typed">Sans</span><b class="f-sans">${s.sans}</b></li>
        <li><span class="typed">Mono</span><b class="f-mono">${s.mono}</b></li>
      </ul>
    </div>
  </section>`;
}

export function logo() {
  return `
  <section class="tf-sec">
    <h2 class="tf-sec-head typed">Logo</h2>
    <div class="tf-logo">
      <div class="tf-logo-big">${wordmark("is-xl")}</div>
      <div class="tf-logo-side">
        <div class="tf-logo-cell">${wordmark("is-bar")}<span class="typed">Top bar, 22px</span></div>
        <div class="tf-logo-cell">${wordmark("is-phone")}<span class="typed">Phone bar, 15px</span></div>
        <div class="tf-logo-cell is-slab">${wordmark("is-lg")}</div>
      </div>
    </div>
  </section>`;
}

export function hero() {
  return `
  <section class="tf-sec">
    <h2 class="tf-sec-head typed">Landing</h2>
    <div class="tf-browser">
      ${beads()}
      <div class="tf-hero">
        <p class="tf-h1">Trip planning, <span class="tf-typed-word">sorted.</span></p>
        <p class="tf-lede">Keep the destination, dates, route and costs in one place. Plan on your own, or with everyone who’s coming.</p>
        <div class="tf-ctas">
          <a class="tf-btn is-primary" href="#">Start a trip — free</a>
          <a class="tf-btn" href="#">See example trips</a>
        </div>
      </div>
    </div>
  </section>`;
}

export function trip() {
  return `
  <article class="tf-card">
    <div class="tf-card-head">
      <div>
        <p class="tf-h2">Portugal, late summer</p>
        <p class="tf-when nums">Thu 3 – Thu 10 Sep · 7 nights</p>
      </div>
      <span class="tf-faces-row">${PEOPLE.map(faceOf).join("")}</span>
    </div>
    <ol class="tf-rows">
      <li class="tf-row lift"><span class="tf-pin nums">1</span><span class="tf-row-main"><b>Lisbon, Portugal</b><span class="tf-sub">Airbnb in Alfama, booked</span></span><span class="tf-row-fig nums">3 nights<small>Thu 3 – Sun 6 Sep</small></span></li>
      <li class="tf-row lift"><span class="tf-pin nums">2</span><span class="tf-row-main"><b>Lagos, Portugal</b><span class="tf-sub">Nowhere to sleep yet</span></span><span class="tf-row-fig nums">4 nights<small>Sun 6 – Thu 10 Sep</small></span></li>
    </ol>
  </article>`;
}

export function days() {
  const ev = [
    ["09:00", "10:00", "Tram 28", "Activity"],
    ["13:30", "15:00", "Lunch at Time Out Market", "Food"],
    ["20:00", "22:30", "Dinner in Alfama", "Food"],
  ];
  return `
  <article class="tf-card">
    <div class="tf-card-head">
      <div>
        <p class="tf-h3">Lisbon</p>
        <p class="tf-when nums">Fri 4 Sep · Day 2 of 8</p>
      </div>
      <span class="tf-tag typed">Sunny, 27°</span>
    </div>
    <ul class="tf-rows">
      ${ev.map(([a, b, t, k]) => `
        <li class="tf-row lift"><span class="tf-time nums">${a}<small>${b}</small></span><span class="tf-row-main"><b>${t}</b><span class="tf-sub">${k}</span></span></li>`).join("")}
    </ul>
  </article>`;
}

export function money() {
  const rows = [
    ["Airbnb, three nights in Lisbon", "Priya paid", "£480.00", "£120.00"],
    ["Train tickets, Lisbon to Lagos", "Tom paid", "€124.00", "€31.00"],
    ["Dinner in Alfama (Sofia had the tasting menu)", "You paid", "€163.50", "€32.70"],
  ];
  return `
  <article class="tf-card">
    <div class="tf-card-head">
      <p class="tf-h3">Spent so far</p>
      <a class="tf-btn is-primary" href="#">Add a cost</a>
    </div>
    <ul class="tf-rows">
      ${rows.map(([d, who, amt, share]) => `
        <li class="tf-row"><span class="tf-row-main"><b>${d}</b><span class="tf-sub">${who}</span></span><span class="tf-row-fig nums">${amt}<small>Your share ${share}</small></span></li>`).join("")}
    </ul>
    <div class="tf-owe">
      <span class="tf-face who-1" title="Priya Raman">PR</span>
      <p>You owe Priya <b class="nums">£120.00</b></p>
      <a class="tf-btn" href="#">Settle up</a>
    </div>
  </article>`;
}

export function band() {
  return `
  <article class="tf-card tf-band">
    <p class="tf-band-title">The plan in your pocket.</p>
    <p class="tf-lede">Today’s plan, who owes who and what to bring. On the web now; the apps are coming.</p>
    <div class="tf-explore lift">
      <div class="tf-explore-top">
        <p class="tf-explore-name">Sicily</p>
        <span class="tf-stamp">Routed</span>
      </div>
      <p class="tf-when nums">Sun 12 – Sun 19 Sep · 7 nights</p>
      <p class="tf-sub">Palermo, Cefalù, Taormina and Syracuse, by car.</p>
    </div>
  </article>`;
}

export function scale() {
  const lines = [
    [39, "display", "Where to, then?"],
    [31, "display", "Everything in one place"],
    [25, "display", "Portugal, late summer"],
    [20, "display", "Spent so far"],
    [17, "sans", "Pro adds four things to your own screen; the trip stays free for the whole group."],
    [15, "sans", "Keep the destination, dates, route and costs in one place."],
    [13, "sans", "Tom can’t make the first two days."],
    [11, "mono", "THU 3 SEP · 7 NIGHTS · £480.00 · €163.50 · 0123456789"],
  ];
  return `
  <section class="tf-sec">
    <h2 class="tf-sec-head typed">Type scale</h2>
    <div class="tf-card tf-scale">
      ${lines.map(([px, f, t]) => `<div class="tf-scale-row"><span class="typed nums">${px}</span><p class="f-${f}" style="font-size:${px}px">${t}</p></div>`).join("")}
    </div>
  </section>`;
}

