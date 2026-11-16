export const LIVE_NOTES_PATH = "/live/notes";

export const pageDocumentName = (tripId: number, pageId: number) => `trip-page:${tripId}:${pageId}`;
export const pagesDocumentName = (tripId: number) => `trip-pages:${tripId}`;
export const tripDocumentName = (tripId: number) => `trip-live:${tripId}`;

export type LiveDocument =
  | { kind: "page"; tripId: number; pageId: number }
  | { kind: "pages"; tripId: number }
  | { kind: "trip"; tripId: number };

const id = (text: string | undefined) => {
  const n = Number(text);
  return text && /^\d+$/.test(text) && Number.isSafeInteger(n) && n > 0 ? n : null;
};

export function readDocumentName(name: string): LiveDocument | null {
  const parts = name.split(":");
  const [kind, trip, page] = parts;
  const tripId = id(trip);
  if (tripId === null || parts.length > 3) return null;
  if (parts.length === 2) {
    if (kind === "trip-pages") return { kind: "pages", tripId };
    return kind === "trip-live" ? { kind: "trip", tripId } : null;
  }
  const pageId = id(page);
  return kind === "trip-page" && pageId !== null ? { kind: "page", tripId, pageId } : null;
}
