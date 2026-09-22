import type { TripEditPayload } from "./trip-write";

export type SheetExit =
  | { kind: "close" }
  | { kind: "blank" }
  | { kind: "save"; payload: TripEditPayload };

/** What shutting the trip sheet should do with the draft it holds. */
export function sheetExit(before: TripEditPayload, after: TripEditPayload): SheetExit {
  const name = after.name.trim();
  if (name === "") return { kind: "blank" };
  const same =
    name === before.name &&
    after.color === before.color &&
    after.mark === before.mark &&
    after.tags.join("\n") === before.tags.join("\n");
  return same ? { kind: "close" } : { kind: "save", payload: { ...after, name } };
}
