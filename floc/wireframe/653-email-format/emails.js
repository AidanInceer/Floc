import { variants } from "/_house/switcher.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const FROM = "Floc <no-reply@floc.live>";
const ME = "priya@example.com";
const people = {
  Sam: { tone: 4, init: "Sa" }, Jo: { tone: 2, init: "Jo" }, Alex: { tone: 3, init: "Al" },
  Maya: { tone: 6, init: "Ma" }, Priya: { tone: 1, init: "Pr" },
};
const trip = { name: "Lisbon long weekend", dates: "Fri 12 – Mon 15 Mar 2027", tone: "green", going: ["Sam", "Jo", "Alex", "Maya"] };
const BOOKINGS = "bookings@floc.live";

const EMAILS = [
  {
    key: "verify", name: "Confirm email", subject: "Confirm your email for Floc", tone: "pen",
    heading: "Confirm your email",
    lines: ["Confirm this address to start joining trips on Floc."],
    cta: "Confirm email", note: "The link works once and expires within the hour.",
    why: "You got this because this address was used to sign up to Floc. If that wasn't you, ignore this email.",
  },
  {
    key: "reset", name: "Reset password", subject: "Reset your Floc password", tone: "pen",
    heading: "Choose a new password",
    lines: ["Someone asked to reset the password on this address."],
    cta: "Choose a new password",
    note: "The link works once and expires within the hour. If this wasn't you, ignore it — nothing has changed.",
    why: "You got this because a password reset was asked for on this address.",
  },
  {
    key: "invite", name: "Trip invite", subject: `Sam invited you to ${trip.name}`, trip: true, tone: "blue",
    heading: `Sam invited you to ${trip.name}`,
    lines: [`Sam is planning ${trip.name} on Floc and wants you in.`],
    facts: [["Trip", trip.name], ["Dates", trip.dates], ["Going", "Sam, Jo, Alex, Maya"]], added: ["Dates", "Going"],
    cta: "See the trip", note: "Anyone with this link can join the trip, so keep it to the group.",
    why: "Sam sent this from Floc. You get nothing more about this trip unless you join.",
  },
  {
    key: "unproven", name: "Booking: not proven", subject: "We couldn't confirm that email came from you", tone: "green",
    heading: "We couldn't confirm that email came from you",
    lines: [
      "Nothing was saved. Anyone can put your address on an email, so Floc only keeps files from mail your provider has signed as yours.",
      "If you sent it, upload the files in Bookings on Floc instead. If you didn't, you can ignore this.",
    ],
    facts: [["Sent to", BOOKINGS], ["Saved", "Nothing"]], status: "Not saved",
    steps: ["Open Bookings on Floc.", "Upload the files there."],
    cta: "Open Bookings", ctaAdded: true,
    why: `You got this because an email from this address reached ${BOOKINGS}.`,
  },
  {
    key: "nothing", name: "Booking: nothing saved", subject: "Nothing was saved from your email", tone: "green",
    heading: "Nothing was saved from your email",
    lines: ["That email had no PDF or image attached. Floc keeps the attached files, not the email itself."],
    facts: [["Sent to", BOOKINGS], ["Attached", "No files"]], status: "Nothing saved",
    steps: ["Forward it again with the PDF or image attached.", "Or upload the file in Bookings on Floc."],
    cta: "Open Bookings", ctaAdded: true,
    why: `You got this because you forwarded an email to ${BOOKINGS}.`,
  },
  {
    key: "partly", name: "Booking: partly saved", subject: "Some files weren't saved from your email", tone: "green",
    heading: "Some files weren't saved",
    lines: ["Saved 2 files to Floc. These were left out:"],
    rows: [
      { text: "TAP-TP1352-booking.pdf", tag: "Saved", tone: "green", added: true },
      { text: "Memmo-Alfama-invoice.pdf", tag: "Saved", tone: "green", added: true },
      { text: "itinerary.docx", sub: "Only PDFs and images can go here", tag: "Left out", tone: "red" },
      { text: "boarding-pass-scan.png", sub: "Files are capped at 8 MB", tag: "Left out", tone: "red" },
    ],
    cta: "Open Bookings", ctaAdded: true,
    why: `You got this because you forwarded an email to ${BOOKINGS}.`,
  },
  {
    key: "notice", name: "Notice (one)", subject: `You still owe £42.50 for ${trip.name}`, trip: true, tone: "red",
    heading: `You still owe £42.50 for ${trip.name}`,
    lines: [],
    facts: [["Owe", "£42.50"], ["Trip", trip.name]],
    cta: "Open in Floc",
    why: "Floc emails you only when push can't reach you.", settings: true,
  },
  {
    key: "digest", name: "Notice (several)", subject: `4 new things on ${trip.name}`, trip: true, tone: "blue",
    heading: `4 new things on ${trip.name}`,
    lines: [],
    rows: [
      { face: "Jo", short: "added an expense", text: `Jo added an expense to ${trip.name}`, tag: "Money", tone: "red", added: true },
      { face: "Alex", short: "changed the dates", text: `Alex changed the dates of ${trip.name}`, tag: "Dates", tone: "yellow", added: true },
      { face: "Maya", short: "commented", text: `Maya commented on ${trip.name}` },
      { face: "Sam", short: "nudged you", text: `Sam nudged you about ${trip.name}` },
    ],
    cta: "Open in Floc",
    why: "Floc emails you only when push can't reach you.", settings: true,
  },
  {
    key: "feedback", name: "Feedback to Floc", subject: "Feedback from Priya Shah", tone: "ink", to: "hello@floc.live", replyTo: "Priya Shah <priya@example.com>",
    heading: "Feedback from Priya Shah",
    quote: [
      "The Money tab is great, but I couldn't find where to change the currency on one expense.",
      "Tried on my phone and on the laptop.",
    ],
    lines: [],
    facts: [["From", "Priya Shah, priya@example.com"], ["User", "usr_8f2k1qz"], ["Page", "/trip/…/money"], ["Surface", "Web 0.237.0"]],
    why: "Sent by the feedback form. Reply to answer Priya.",
  },
];

const state = { email: "all", fallback: false, variant: "G" };


const word = () =>
  `<span class="m-word m-display"><svg viewBox="0 0 28 22" aria-hidden="true"><path d="M3.4 16.5 7 12.9 10.6 16.5"/><path d="M10.4 10 14 6.4 17.6 10"/><path d="M17.4 16.5 21 12.9 24.6 16.5"/></svg><span>floc<i>.</i></span></span>`;
const face = (n) => `<span class="m-face who-${people[n].tone}" title="${n}">${people[n].init}</span>`;
const faces = (list) => `<span class="m-faces">${list.map(face).join("")}</span>`;
const pin = `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 12.4S2.8 8.6 2.8 5.8a4.2 4.2 0 0 1 8.4 0c0 2.8-4.2 6.6-4.2 6.6Z"/><circle cx="7" cy="5.7" r="1.4"/></svg>`;
const btn = (e) => (e.cta ? `<a class="m-btn" href="#" onclick="return false">${esc(e.cta)}</a>` : "");
const note = (e) => (e.note ? `<p class="m-note">${esc(e.note)}</p>` : "");
const lines = (e, from = 0) => e.lines.slice(from).map((l) => `<p>${esc(l)}</p>`).join("");
const quote = (e) => (e.quote ? `<div class="m-quote">${e.quote.map((l) => `<p>${esc(l)}</p>`).join("")}</div>` : "");
const rows = (e) =>
  e.rows
    ? `<ul class="m-rows">${e.rows
        .map(
          (r) =>
            `<li>${r.face ? face(r.face) : ""}<span class="grow">${esc(r.text)}${r.sub ? `<br><span class="typed">${esc(r.sub)}</span>` : ""}</span>${
              r.tag ? `<span class="m-tag tone-${r.tone}">${esc(r.tag)}</span>` : ""
            }</li>`,
        )
        .join("")}</ul>`
    : "";
const factRows = (e, skip = []) => {
  const list = (e.facts || []).filter(([k]) => !skip.includes(k));
  return list.length
    ? `<ul class="m-rows">${list.map(([k, v]) => `<li><span class="typed" style="min-width:64px">${esc(k)}</span><span class="grow nums">${esc(v)}</span></li>`).join("")}</ul>`
    : "";
};
const foot = (e) =>
  `<p>${esc(e.why)}${e.settings ? ` <a href="#" onclick="return false">Turn off email in Settings</a>.` : ""}</p><p class="typed">Floc · floc.live</p>`;
const head = (e) => esc(e.heading).replace(/£[\d.,]+/g, (m) => `<span class="nums" style="font-weight:500">${m}</span>`);
const tripTone = (e) => (e.trip ? trip.tone : e.tone);


const layouts = {
  C: (e) => `
    <div class="page">
      ${word()}
      ${e.lines.length ? `<p class="lede">${esc(e.lines[0])}</p>${lines(e, 1)}` : `<p class="lede">${head(e)}</p>`}
      ${e.trip ? `<div class="tile"><span class="m-mark tone-${trip.tone}">${pin}</span><span><span class="name">${esc(trip.name)}</span><span class="typed">${esc(trip.dates)}</span></span>${faces(trip.going)}</div>` : ""}
      ${quote(e)}${rows(e)}${factRows(e, ["Trip", "Dates", "Going"])}
      ${e.cta ? `<p>${btn(e)}</p>` : ""}${note(e)}
      <p class="sign">— Floc</p>
      <div class="m-foot">${foot(e)}</div>
    </div>`,

  D: (e) => {
    const facts = [...(e.facts || [])];
    if (e.trip && !facts.some(([k]) => k === "Trip")) facts.unshift(["Trip", trip.name]);
    if (e.trip && !facts.some(([k]) => k === "Dates")) facts.splice(1, 0, ["Dates", trip.dates]);
    const stub = facts.length
      ? `<div class="stub tone-${e.tone}"><dl>${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>`
      : "";
    return `
    <div class="card">
      <div class="head">${word()}<span class="typed">Sun 15 Nov 2026</span></div>
      <h2 class="m-display">${head(e)}</h2>
      ${stub}${lines(e)}${quote(e)}${rows(e)}
      ${e.cta ? `<p class="cta">${btn(e)}</p>` : ""}${note(e)}
    </div>
    <div class="m-foot">${foot(e)}</div>`;
  },

  D3: (e) => `
    <div class="card">
      <div class="head">${word()}<span class="typed">Sun 15 Nov 2026</span></div>
      <h2 class="m-display">${head(e)}</h2>
      <div class="outline">
        <div class="outline-head"><span class="nums">${esc(bookingFacts(e)[0][1])}</span><span class="status typed">${statusMark}${esc(e.status)}</span></div>
        <dl>${bookingFacts(e).slice(1).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      </div>
      <p>${esc(e.lines[0])}</p>
      <p class="next-head m-display">What to do</p>
      <ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${e.cta ? `<p class="cta">${btn(e)}</p>` : ""}
    </div>
    <div class="m-foot">${foot(e)}</div>`,
};

const statusMark = `<svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.2"/><path d="M4.6 7h4.8"/></svg>`;
const bookingFacts = (e) => [["Received", "Sun 15 Nov, 14:20"], ...e.facts];

const MIX = {
  G: { verify: "D", reset: "D", invite: "C", notice: "C", digest: "C", unproven: "D3", nothing: "D3", partly: "D", feedback: "D" },
};
const layoutFor = (e) => (MIX[state.variant] ? MIX[state.variant][e.key] : state.variant);


const client = (e, phone) => `
  <div class="client-head">
    <p class="client-subject">${esc(e.subject)}</p>
    <div class="client-meta"><span>${esc(FROM)}</span><span>to ${esc(e.to || ME)}</span>${e.replyTo ? `<span>reply to ${esc(e.replyTo)}</span>` : ""}</div>
  </div>
  <div class="client-body"><div class="mail v-${layoutFor(e)[0]} v-${layoutFor(e)}${state.fallback ? " fallback" : ""}">${layouts[layoutFor(e)](e)}</div></div>`;

const added = (e) => {
  const l = layoutFor(e);
  const byLayout = {
    D3: ["time received", "what to do"],
  }[l] || [];
  const bits = [...(e.added || []), ...(e.ctaAdded ? [`“${e.cta}” button`] : []), ...((e.rows || []).some((r) => r.added) ? [e.rows.some((r) => r.face) ? "feature tags" : "saved files listed"] : []), ...byLayout];
  return bits.length ? ` <span class="typed" style="color:var(--ink-2);font-size:11px;font-weight:400;margin-left:8px">New: ${esc(bits.join(", "))}</span>` : "";
};

function render() {
  const shown = state.email === "all" ? EMAILS : EMAILS.filter((e) => e.key === state.email);
  document.getElementById("app").innerHTML = `
    <main class="desk">
      <div class="desk-head"><h1>Every Floc email</h1><p>${MIX[state.variant] ? `Mix ${state.variant}` : `Layout ${state.variant}`} · ${shown.length} of ${EMAILS.length}</p></div>
      <div class="picker" role="group" aria-label="Email">
        ${[{ key: "all", name: "All" }, ...EMAILS].map((e) => `<button type="button" data-email="${e.key}" aria-pressed="${state.email === e.key}">${esc(e.name)}</button>`).join("")}
      </div>
      <div class="faces" role="group" aria-label="Faces">
        <span class="typed">Faces</span>
        <button type="button" data-faces="house" aria-pressed="${!state.fallback}">Red Hat (Apple Mail)</button>
        <button type="button" data-faces="fallback" aria-pressed="${state.fallback}">Fallback (Gmail, Outlook)</button>
      </div>
      ${shown
        .map(
          (e) => `
        <section class="pair">
          <h2 class="pair-name">${esc(e.name)} <span class="typed pair-layout">Layout ${layoutFor(e)}</span>${added(e)}</h2>
          <div class="desk-col"><p class="desk-label typed">Desktop · reading pane</p><div class="client">${client(e)}</div></div>
          <div><p class="phone-label typed">Phone · 375</p><div class="phone">${client(e, true)}</div></div>
        </section>`,
        )
        .join("")}
    </main>`;
}

document.addEventListener("click", (ev) => {
  const pick = ev.target.closest("[data-email]");
  if (pick) { state.email = pick.dataset.email; render(); return; }
  const f = ev.target.closest("[data-faces]");
  if (f) { state.fallback = f.dataset.faces === "fallback"; render(); }
});

variants(
  [
    { key: "G", name: "Picked — D account and partly saved, C trip mail, D3 not proven and nothing saved", round: 3 },
  ],
  (key) => { state.variant = key; render(); },
);
state.variant = "G";
state.email = new URLSearchParams(location.search).get("email") || "all";
render();
