export const ME = { name: "Dev", initial: "De", tone: 5 };

export const PEOPLE = {
  priya: { name: "Priya", initial: "Pr", tone: 1 },
  sam: { name: "Sam", initial: "Sa", tone: 4 },
  maya: { name: "Maya", initial: "Ma", tone: 6 },
  dev: ME,
};

export const TABS = {
  overview: { label: "Overview", glyph: "overview", tone: "grey" },
  people: { label: "People", glyph: "people", tone: "grey" },
  dates: { label: "Dates", glyph: "dates", tone: "yellow" },
  days: { label: "Days", glyph: "days", tone: "green" },
  money: { label: "Money", glyph: "money", tone: "red" },
  packing: { label: "Packing", glyph: "packing", tone: "blue" },
  notes: { label: "Notes", glyph: "notes", tone: "yellow" },
  files: { label: "Files", glyph: "files", tone: "grey" },
};

export const SOME = [
  { id: "c1", tab: "days", who: "priya", when: "Sun 22 Nov", text: "moved New Year's dinner", place: "Thu 31 Dec", before: "20:00", after: "20:30", tag: "Moved", key: "dinner", mine: true },
  { id: "c2", tab: "money", who: "sam", when: "Sun 22 Nov", text: "added Casa do Alfama, 3 nights", amount: "£462.00", share: "£115.50", mine: true },
  { id: "c3", tab: "files", who: "sam", when: "Sun 22 Nov", text: "added the Casa do Alfama booking", tag: "New" },
  { id: "c4", tab: "days", who: "sam", when: "Sat 21 Nov", text: "added Benagil caves by boat", place: "Tue 5 Jan, 10:30", tag: "New", key: "caves" },
  { id: "c5", tab: "dates", who: "priya", when: "Sat 21 Nov", text: "added a night in Lagos", before: "3–6 Jan", after: "3–7 Jan", tag: "Longer", key: "lagos", mine: true },
  { id: "c6", tab: "money", who: "maya", when: "Fri 20 Nov", text: "added Train to Lagos", amount: "£96.00", share: "£24.00", mine: true },
  { id: "c7", tab: "people", who: "maya", when: "Thu 19 Nov", text: "joined the trip", tag: "New" },
  { id: "c8", tab: "packing", who: "sam", when: "Thu 19 Nov", text: "is bringing the first aid kit", tag: "New" },
  { id: "c9", tab: "notes", who: "priya", when: "Wed 18 Nov", text: "edited Restaurants to try", tag: "Edited" },
];

const extra = [
  ["days", "priya", "Sun 22 Nov", "added Lunch at Time Out Market", "Fri 1 Jan, 13:00"],
  ["days", "maya", "Sat 21 Nov", "added Sunset at Ponta da Piedade", "Mon 4 Jan, 17:15"],
  ["days", "sam", "Fri 20 Nov", "added Surf lesson at Meia Praia", "Wed 6 Jan, 09:30"],
  ["days", "priya", "Thu 19 Nov", "added Fado night in Alfama", "Sat 2 Jan, 21:00"],
  ["money", "priya", "Sat 21 Nov", "added Airport transfer", "£38.00", "£9.50"],
  ["money", "sam", "Fri 20 Nov", "added Benagil boat deposit", "£60.00", "£15.00"],
  ["money", "maya", "Thu 19 Nov", "added Lagos apartment, 4 nights", "£520.00", "£130.00"],
  ["money", "priya", "Wed 18 Nov", "added New Year's dinner deposit", "£80.00", "£20.00"],
  ["packing", "maya", "Sat 21 Nov", "is bringing the travel adaptor"],
  ["packing", "priya", "Fri 20 Nov", "is bringing the speaker"],
  ["packing", "sam", "Wed 18 Nov", "is bringing the beach towels"],
  ["notes", "maya", "Fri 20 Nov", "edited Things to do in Lagos"],
  ["notes", "sam", "Thu 19 Nov", "edited Getting from the airport"],
  ["files", "priya", "Fri 20 Nov", "added the Lisbon flight tickets"],
  ["files", "maya", "Thu 19 Nov", "added the Lagos apartment booking"],
  ["dates", "sam", "Wed 18 Nov", "marked Sat 2 Jan as free"],
  ["days", "maya", "Wed 18 Nov", "added Tram 28", "Fri 1 Jan, 08:30"],
];

export const EXTRA = extra.map(([tab, who, when, text, a, b], i) => {
  const money = tab === "money";
  return {
    id: `x${i}`,
    tab,
    who,
    when,
    text,
    tag: tab === "notes" ? "Edited" : "New",
    ...(money ? { amount: a, share: b, mine: true } : a ? { place: a } : {}),
  };
});

export const DOLOMITES = [
  { id: "d1", tab: "money", who: "sam", when: "Sat 21 Nov", text: "added Ski passes, 5 days", amount: "£1,140.00", share: "£190.00", mine: true },
  { id: "d2", tab: "dates", who: "priya", when: "Thu 19 Nov", text: "set the trip dates", place: "12–19 Feb", tag: "New", key: "cortina" },
];

export const DOLOMITES_STOPS = [
  {
    n: 1,
    place: "Cortina",
    nights: "7 nights",
    range: "12–19 Feb",
    key: "cortina",
    days: [
      { wd: "Fri", d: 12, time: "11:40", type: "transport", glyph: "flight", name: "Flight to Venice" },
      { wd: "Sat", d: 13, time: "09:00", type: "activity", glyph: "activity", name: "First day on the slopes" },
      { wd: "Sun", d: 14 },
    ],
  },
];

export const STOPS = [
  {
    n: 1,
    place: "Lisbon",
    nights: "3 nights",
    range: "31 Dec – 3 Jan",
    hop: "Train to Lagos, Sun 3 Jan",
    days: [
      { wd: "Thu", d: 31, time: "20:30", type: "food", glyph: "food", name: "New Year's dinner at Taberna da Rua", more: 2, key: "dinner" },
      { wd: "Fri", d: 1, time: "08:30", type: "activity", glyph: "activity", name: "Tram 28", more: 1 },
      { wd: "Sat", d: 2 },
    ],
  },
  {
    n: 2,
    place: "Lagos",
    nights: "4 nights",
    range: "3–7 Jan",
    key: "lagos",
    days: [
      { wd: "Sun", d: 3, time: "09:05", type: "transport", glyph: "train", name: "Train to Lagos" },
      { wd: "Mon", d: 4 },
      { wd: "Tue", d: 5, time: "10:30", type: "activity", glyph: "activity", name: "Benagil caves by boat", key: "caves" },
      { wd: "Wed", d: 6 },
    ],
  },
];
