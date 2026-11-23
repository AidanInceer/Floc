import { dateRange } from "/_house/kit/trip-frame.mjs";

export const ME = "d";

export const PEOPLE = [
  { id: "d", name: "Dev", initial: "DU", tone: 4 },
  { id: "p", name: "Priya", initial: "PR", tone: 2 },
  { id: "s", name: "Sofia", initial: "SA", tone: 3 },
  { id: "t", name: "Tom", initial: "TW", tone: 1 },
];

export const person = (id) => PEOPLE.find((p) => p.id === id);

export const DAYS = dateRange("2026-12-29", "2027-01-05").map((date, i) => ({
  date,
  place: i < 3 ? "Lisbon" : "Lagos",
}));

export const inTrip = (date) => DAYS.some((d) => d.date === date);

const CATEGORIES = [
  { id: "travel", label: "Travel", type: "transport", glyph: "train" },
  { id: "activities", label: "Activities", type: "activity", glyph: "activity" },
  { id: "food", label: "Food", type: "food", glyph: "food" },
  { id: "drinks", label: "Drinks", type: "food", glyph: "drink" },
  { id: "other", label: "Other", type: "other", glyph: "note" },
];

const IDEAS = [
  ["travel", "Day train to Sintra", "p", ["p", "s", "t"]],
  ["travel", "Hire a car in Lagos", "d", ["d", "s"]],
  ["travel", "Ferry across to Cacilhas", "t", ["t"]],
  ["activities", "Fireworks at Praça do Comércio", "d", ["d", "p", "s", "t"], "2026-12-31", "23:30"],
  ["activities", "Pena Palace", "s", ["p", "s", "t"]],
  ["activities", "Fado night in Alfama", "p", ["p", "d"]],
  ["activities", "Kayak to the Benagil caves", "t", ["t", "s"]],
  ["activities", "Surf lesson at Meia Praia", "s", ["s"]],
  ["food", "Pastéis de Belém", "p", ["p", "s", "t"]],
  ["food", "Cervejaria Ramiro", "t", ["t", "d"]],
  ["food", "A Forja in Lagos", "d", ["d", "p"]],
  ["food", "Time Out Market", "s", ["s"]],
  ["drinks", "Park rooftop bar", "p", ["p", "s", "t"]],
  ["drinks", "Ginjinha by Rossio", "s", ["s", "p"]],
  ["drinks", "Sunset at Ponta da Piedade", "t", ["t"]],
  ["other", "Group photo at Miradouro da Graça", "s", ["s", "t"]],
  ["other", "Get Navegante travel cards", "d", ["d"]],
];

const EVENTS = [
  { day: "2026-12-29", type: "transport", title: "Flight to Lisbon", time: "10:15", end: "12:45" },
  { day: "2026-12-29", type: "food", title: "Dinner in Alfama", time: "19:30", end: null },
  { day: "2026-12-30", type: "activity", title: "Tram 28", time: "08:30", end: "10:00" },
  { day: "2027-01-01", type: "transport", title: "Train to Lagos", time: "09:05", end: "13:10" },
];

export function createStore() {
  let next = 1;
  const s = {
    cats: CATEGORIES.map((c) => ({ ...c })),
    ideas: IDEAS.map(([cat, title, by, votes, day = null, time = null]) => ({
      id: next++, cat, title, by, votes: [...votes], day, time, removed: false, eventId: null,
    })),
    events: EVENTS.map((e) => ({ ...e, id: next++ })),
  };
  const idea = (id) => s.ideas.find((i) => i.id === id);
  const cat = (id) => s.cats.find((c) => c.id === id);
  const live = (c = "all") => s.ideas.filter((i) => !i.removed && !i.eventId && (c === "all" || i.cat === c));
  return {
    s,
    idea,
    cat,
    live,
    top: () => [...live()].sort((a, b) => b.votes.length - a.votes.length)[0],
    vote(id) {
      const i = idea(id);
      i.votes = i.votes.includes(ME) ? i.votes.filter((v) => v !== ME) : [...i.votes, ME];
    },
    setVote(id, on) {
      const i = idea(id);
      const has = i.votes.includes(ME);
      if (on && !has) i.votes = [...i.votes, ME];
      if (!on && has) i.votes = i.votes.filter((v) => v !== ME);
    },
    add(title, c, day = null, time = null) {
      const row = { id: next++, cat: c, title, by: ME, votes: [ME], day, time, removed: false, eventId: null };
      s.ideas.unshift(row);
      return row.id;
    },
    remove(id) { idea(id).removed = true; },
    restore(id) { idea(id).removed = false; },
    addCat(label) {
      const id = `c${next++}`;
      s.cats.push({ id, label, type: "other", glyph: "star" });
      return id;
    },
    setWhen(id, day, time) {
      const i = idea(id);
      i.day = day;
      i.time = time;
    },
    promote(id, day, time, title, type) {
      const i = idea(id);
      const ev = {
        id: next++, day, type: type ?? cat(i.cat).type, title: title || i.title, time: time || null, end: null, fromIdea: id,
      };
      s.events.push(ev);
      i.eventId = ev.id;
      i.day = day;
      i.time = time || null;
      return ev;
    },
    unpromote(id) {
      const i = idea(id);
      s.events = s.events.filter((e) => e.id !== i.eventId);
      i.eventId = null;
    },
  };
}
