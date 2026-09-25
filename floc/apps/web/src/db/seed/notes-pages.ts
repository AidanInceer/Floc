/**
 * Scenario A's notes pages (#408): a filled-in Notes with sub-pages, icons, a
 * table, lists three deep, trip links to the seeded days, events, money and
 * packing, and one comment thread — every part of the editor has something to draw.
 */
import { eq } from "drizzle-orm";

import { db } from "../index.ts";
import { day, dayEvent, expense, note, packingLine, tripPage } from "../schema.ts";
import { serialisePage, type Inline, type Mark, type PageBlock, type TableCell } from "@floc/core/notes/pages/page-blocks";

type Ids = { day: number[]; event: Record<string, number>; expense: Record<string, number>; packing: Record<string, number> };

const t = (text: string, marks?: Mark[]): Inline => (marks ? { type: "text", text, marks } : { type: "text", text });
const line = (type: "paragraph" | "bullet" | "numbered" | "quote", content: Inline[], indent = 0): PageBlock => ({ type, indent, content });
const check = (content: Inline[], checked = false, indent = 0): PageBlock => ({ type: "check", indent, checked, content });
const heading = (id: string, text: string): PageBlock => ({ type: "heading", id, level: 2, indent: 0, content: [t(text)] });
const cell = (text: string, tone: TableCell["tone"] = null): TableCell => ({ tone, content: text ? [t(text)] : [] });

async function ids(tripId: number): Promise<Ids> {
  const days = await db.select({ id: day.id }).from(day).where(eq(day.tripId, tripId)).orderBy(day.date);
  const events = await db.select({ id: dayEvent.id, title: dayEvent.title }).from(dayEvent).innerJoin(day, eq(day.id, dayEvent.dayId)).where(eq(day.tripId, tripId));
  const spent = await db.select({ id: expense.id, label: expense.description }).from(expense).where(eq(expense.tripId, tripId));
  const packed = await db.select({ id: packingLine.id, label: packingLine.label }).from(packingLine).where(eq(packingLine.tripId, tripId));
  return {
    day: days.map((row) => row.id),
    event: Object.fromEntries(events.map((row) => [row.title ?? "", row.id])),
    expense: Object.fromEntries(spent.map((row) => [row.label, row.id])),
    packing: Object.fromEntries(packed.map((row) => [row.label, row.id])),
  };
}

function notesPage(found: Ids, threadId: number): PageBlock[] {
  const link = (kind: "day" | "event" | "expense" | "packing", id: number | undefined, label: string): Inline =>
    id ? { type: "tripLink", kind, id, label } : t(label);
  return [
    line("paragraph", [t("Portugal, eight days. Lisbon first, then down to Lagos. Book the big things first, then fill the days.")]),
    heading("seed-to-book", "To book"),
    check([t("Flights", [{ type: "bold" }]), t(" — Tom has these")], true),
    check([t("First night in Lisbon for "), link("day", found.day[0], "Day 1")]),
    check([t("Near Alfama if we can")], false, 1),
    check([t("Table for "), link("event", found.event["Dinner in Alfama"], "Dinner in Alfama")]),
    check([t("Seats on the "), link("event", found.event["Train to Lagos"], "Train to Lagos")]),
    heading("seed-ideas", "Ideas"),
    line("bullet", [link("event", found.event["Tram 28"], "Tram 28"), t(" — go before nine or it is standing room only")]),
    line("bullet", [t("Get on at Martim Moniz, the first stop")], 1),
    line("bullet", [t("Keep one day in Lagos with no plans at all", [{ type: "highlight", tone: "butter" }]), t(" 🏖️")]),
    line("bullet", [t("Maybe "), t("hire a car", [{ type: "comment", id: threadId }]), t(" for the Algarve days")]),
    line("quote", [t("Everyone brings one thing they want to do. We fit the rest round it.")]),
    { type: "divider" },
    line("paragraph", [t("Money is on the Money tab. The "), link("expense", found.expense["Airbnb, three nights in Lisbon"], "Lisbon flat"), t(" is paid; settle as we go.")]),
  ];
}

const EAT: PageBlock[] = [
  line("paragraph", [t("Put your name down if you want it. Book anything marked Book.")]),
  {
    type: "table",
    header: true,
    rows: [
      [cell("Place"), cell("Good for"), cell("Who wants it"), cell("Booked")],
      [cell("Taberna da Rua das Flores"), cell("Last night in Lisbon"), cell("Priya, Tom"), cell("Book", "butter")],
      [cell("Time Out Market"), cell("Lunch, any day"), cell("Everyone"), cell("No need", "mint")],
      [cell("A Petisqueira"), cell("First night in Lagos"), cell("Sofia"), cell("Book", "butter")],
    ],
  },
  line("paragraph", []),
];

const AROUND: PageBlock[] = [
  heading("seed-airport", "From the airport"),
  line("numbered", [t("Buy a Viva Viagem card at the machines")]),
  line("numbered", [t("Top it up with €10")], 1),
  line("numbered", [t("It works on the metro and the trams")], 1),
  line("numbered", [t("Metro red line to Saldanha, about 20 minutes")]),
  line("numbered", [t("Change to the yellow line")]),
  heading("seed-lagos", "To Lagos"),
  line("paragraph", [t("The train changes at Tunes. Sit on the left for the view.")]),
];

export async function seedNotesPages(tripId: number, people: { you: string; priya: string; tom: string; sofia: string }): Promise<void> {
  const found = await ids(tripId);
  const page = async (title: string, blocks: PageBlock[], extra: { parentId?: number; icon?: "food" | "sun" | "train" | "packing"; position: number }) => {
    const [row] = await db.insert(tripPage).values({ tripId, title, body: serialisePage(blocks), updatedBy: people.priya, parentId: extra.parentId ?? null, icon: extra.icon ?? null, position: extra.position }).returning({ id: tripPage.id });
    return row.id;
  };
  const notes = await page("Notes", [], { position: 0 });
  const [thread] = await db.insert(note).values({ tripId, createdBy: people.sofia, scope: "page", scopeId: notes, body: "Only if two of us can drive. Otherwise trains and one taxi." }).returning({ id: note.id });
  await db.insert(note).values({ tripId, createdBy: people.tom, scope: "page", scopeId: notes, parentId: thread.id, body: "I can drive. Who else?" });
  await db.update(tripPage).set({ body: serialisePage(notesPage(found, thread.id)) }).where(eq(tripPage.id, notes));
  await page("Where to eat", EAT, { parentId: notes, icon: "food", position: 0 });
  await page("Lagos beaches", [line("bullet", [t("Praia do Camilo — the steps")]), line("bullet", [t("Ponta da Piedade by kayak 🛶")])], { parentId: notes, icon: "sun", position: 1 });
  await page("Getting around", AROUND, { icon: "train", position: 1 });
  await page("Packing ideas", [
    line("paragraph", [t("Shoes you can walk up hills in. Lisbon is all hills.")]),
    line("bullet", [t("Two-pin plugs — "), found.packing["Travel adapters"] ? { type: "tripLink", kind: "packing", id: found.packing["Travel adapters"], label: "Travel adapters" } : t("adapters")]),
    line("bullet", [found.packing["Suncream"] ? { type: "tripLink", kind: "packing", id: found.packing["Suncream"], label: "Suncream" } : t("Suncream"), t(" for everyone")]),
  ], { icon: "packing", position: 2 });
}
