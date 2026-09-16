/**
 * The first-trip tour (#315): which stops it shows, whether it starts, and how
 * it moves. Both clients draw it; neither decides it.
 */
export type TourStopKey =
  | "roster"
  | "dates"
  | "days"
  | "money"
  | "packing"
  | "notes"
  | "files";

export type TourStop = { key: TourStopKey; title: string; line: string };

const STOPS: TourStop[] = [
  { key: "roster", title: "Your group", line: "Invite the people you are going with, or plan it on your own." },
  { key: "dates", title: "Dates", line: "Find a window everyone can do." },
  { key: "days", title: "Days", line: "Sketch what happens on each day." },
  { key: "money", title: "Money", line: "Log costs, and see who owes who." },
  { key: "packing", title: "Packing", line: "Your own bag, and what the group brings." },
  { key: "notes", title: "Notes", line: "Anything the group wants written down." },
  { key: "files", title: "Files", line: "Bookings and tickets, in one place." },
];

export function tourStopsFor(input: { hasFiles: boolean }): TourStop[] {
  return STOPS.filter(
    (stop) =>
      stop.key !== "files" || input.hasFiles,
  );
}

export function shouldStartTour(input: { seen: boolean }): boolean {
  return !input.seen;
}

export type TourState = { index: number; done: boolean };

export function tourStep(
  state: TourState,
  move: "next" | "back" | "skip",
  stopCount: number,
): TourState {
  if (move === "skip") return { ...state, done: true };
  if (move === "back") return { ...state, index: Math.max(0, state.index - 1) };
  if (state.index >= stopCount - 1) return { ...state, done: true };
  return { ...state, index: state.index + 1 };
}
