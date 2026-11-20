export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
export const CAP = 20;

export const TASKS = {
  days: { tab: "dates", todo: "mark your days", act: "Mark my days", done: "has marked their days" },
  ideas: { tab: "overview", todo: "vote on where to go", act: "Vote", done: "has voted" },
  money: { tab: "money", todo: "settle up", act: "Settle up", done: "has settled up" },
};

const P = (id, name, initial, tone, days, voted) => ({ id, name, initial, tone, days, voted, guest: false, muted: false });

const base = () => ({
  now: 0,
  viewer: "aidan",
  trip: { name: "Portugal, late summer", moment: "finding" },
  people: [
    P("aidan", "Aidan", "Ai", 1, 5, true),
    P("priya", "Priya", "Pr", 2, 4, true),
    P("sam", "Sam", "Sa", 4, null, false),
    P("jo", "Jo", "Jo", 3, null, false),
    P("alex", "Alex", "Al", 5, null, true),
    P("maya", "Maya", "Ma", 6, 3, true),
  ],
  ideas: [
    { id: 1, title: "Lisbon first, then Porto", votes: 3 },
    { id: 2, title: "Two nights in the Douro valley", votes: 2 },
    { id: 3, title: "Fly home from Faro", votes: 1 },
  ],
  debts: [
    { payer: "sam", payee: "aidan", amount: "£40.00" },
    { payer: "jo", payee: "aidan", amount: "£12.50" },
    { payer: "aidan", payee: "maya", amount: "£22.00" },
    { payer: "alex", payee: "priya", amount: "£18.00" },
  ],
  nudges: [],
  sentBefore: {},
  inbox: {},
  failNext: false,
  meanwhile: [],
});

const past = (state, from, to, task, hoursAgo) => {
  state.nudges.push({ from, to, task, at: -hoursAgo * HOUR });
  deliver(state, from, to, task, -hoursAgo * HOUR);
};

export const SCENARIOS = [
  { key: "three", label: "Several people waiting", make: base },
  {
    key: "other",
    label: "Priya nudged Sam 3 hours ago",
    make: () => { const s = base(); past(s, "priya", "sam", "days", 3); past(s, "priya", "sam", "ideas", 3); return s; },
  },
  {
    key: "all",
    label: "Everyone was nudged today",
    make: () => { const s = base(); ["sam", "jo", "alex"].forEach((id) => past(s, "priya", id, "days", 5)); ["sam", "jo"].forEach((id) => past(s, "maya", id, "ideas", 2)); return s; },
  },
  {
    key: "one",
    label: "One person left",
    make: () => { const s = base(); s.people.forEach((p) => { if (p.id !== "jo") { p.days = p.days ?? 3; p.voted = true; } }); s.debts = s.debts.filter((d) => d.payer !== "sam"); return s; },
  },
  {
    key: "many",
    label: "Nine waiting, long names",
    make: () => {
      const s = base();
      s.trip.name = "Bosnia and Herzegovina and the Dalmatian coast, late September";
      s.people.push(
        P("bart", "Bartholomew Featherstonehaugh", "BF", 7, null, false),
        P("anna", "Anna-Maria Castellanos Ruiz", "AC", 8, null, false),
        P("kit", "Kit", "Ki", 2, null, false),
        P("ola", "Oluwaseun Adebayo", "OA", 3, null, true),
        P("wen", "Wen", "We", 4, null, false),
        P("tess", "Tess", "Te", 5, null, true),
      );
      s.debts.push({ payer: "bart", payee: "aidan", amount: "£1,204.75" }, { payer: "anna", payee: "aidan", amount: "£8.00" });
      return s;
    },
  },
  {
    key: "crowd",
    label: "Twenty people waiting",
    make: () => {
      const s = base();
      const more = ["Ruth", "Callum", "Nadia", "Mei", "Jonas", "Elliot", "Hana", "Rory", "Zainab", "Theo", "Ines", "Luca", "Freya", "Dev", "Orla", "Kofi", "Bea"];
      more.forEach((name, i) => s.people.push(P(`x${i}`, name, name.slice(0, 2), (i % 8) + 1, null, i % 3 === 0)));
      return s;
    },
  },
  {
    key: "solo",
    label: "A trip of one",
    make: () => { const s = base(); s.people = s.people.slice(0, 1); s.people[0].days = null; s.people[0].voted = false; s.debts = []; return s; },
  },
  {
    key: "guest",
    label: "A guest has not answered",
    make: () => { const s = base(); s.people.push({ ...P("tom", "Tom", "To", 8, null, false), guest: true }, { ...P("iris", "Iris", "Ir", 7, 2, false), guest: true }); return s; },
  },
  {
    key: "cap",
    label: "19 of 20 nudges used today",
    make: () => { const s = base(); s.sentBefore = { aidan: CAP - 1 }; return s; },
  },
  {
    key: "meanwhile",
    label: "Sam did it since the page loaded",
    make: () => { const s = base(); s.meanwhile = ["sam:days", "sam:ideas", "sam:money"]; return s; },
  },
  { key: "fail", label: "The send fails", make: () => { const s = base(); s.failNext = true; return s; } },
  {
    key: "muted",
    label: "Sam muted this trip",
    make: () => { const s = base(); s.people.find((p) => p.id === "sam").muted = true; return s; },
  },
  {
    key: "set",
    label: "Dates set, a night has a place",
    make: () => { const s = base(); s.trip.moment = "set"; s.people.forEach((p) => { p.days = p.days ?? 0; }); return s; },
  },
];

export const person = (state, id) => state.people.find((p) => p.id === id);

export const names = (list) =>
  list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;

export function waiting(state, task, viewerId = state.viewer) {
  if (task === "money") return state.debts.filter((d) => d.payee === viewerId).map((d) => person(state, d.payer));
  if (state.trip.moment !== "finding") return [];
  const members = state.people.filter((p) => !p.guest && p.id !== viewerId);
  if (task === "days") return members.filter((p) => p.days === null);
  return state.ideas.length ? members.filter((p) => !p.voted) : [];
}

export const nudgedRecently = (state, to, task) =>
  state.nudges.some((n) => n.to === to && n.task === task && state.now - n.at < DAY);

export const usedToday = (state, from) =>
  (state.sentBefore[from] ?? 0) + state.nudges.filter((n) => n.from === from && state.now - n.at < DAY).length;

export const lineFor = (state, from, task) =>
  `${person(state, from).name} nudged you to ${TASKS[task].todo} on the trip ${state.trip.name}`;

function deliver(state, from, to, task, at) {
  const p = person(state, to);
  const reach = p.muted ? "Inbox only: they muted this trip" : "Inbox, then push, or email if push cannot reach them";
  (state.inbox[to] ??= []).unshift({ from, task, at, read: false, text: lineFor(state, from, task), reach, quiet: p.muted });
}

export function complete(state, id, task) {
  const p = person(state, id);
  if (task === "days") p.days = 4;
  if (task === "ideas") { p.voted = true; state.ideas[0].votes += 1; }
  if (task === "money") state.debts = state.debts.filter((d) => d.payer !== id);
  state.meanwhile = state.meanwhile.filter((k) => k !== `${id}:${task}`);
}

export function send(state, from, toIds, task) {
  const out = { sent: [], done: [], already: [], refused: null };
  if (state.failNext) { state.failNext = false; out.refused = "failed"; return out; }
  for (const to of toIds) {
    if (state.meanwhile.includes(`${to}:${task}`)) { complete(state, to, task); out.done.push(to); continue; }
    if (nudgedRecently(state, to, task)) { out.already.push(to); continue; }
    if (usedToday(state, from) >= CAP) { out.refused = "cap"; break; }
    state.nudges.push({ from, to, task, at: state.now });
    deliver(state, from, to, task, state.now);
    out.sent.push(to);
  }
  return out;
}

export const ago = (state, at) => {
  const h = Math.round((state.now - at) / HOUR);
  return h < 1 ? "Just now" : h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
};
