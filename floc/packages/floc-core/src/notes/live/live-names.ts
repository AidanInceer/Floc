export const LIVE_NOTES_PATH = "/live/notes";

/** One live doc per notes page (#408), and one per trip that carries who is where and "the list changed". */
export const pageDocumentName = (tripId: number, pageId: number) => `trip-page:${tripId}:${pageId}`;
export const pagesDocumentName = (tripId: number) => `trip-pages:${tripId}`;

export type LiveDocument = { kind: "page"; tripId: number; pageId: number } | { kind: "pages"; tripId: number };

const id = (text: string | undefined) => {
  const n = Number(text);
  return text && /^\d+$/.test(text) && Number.isSafeInteger(n) && n > 0 ? n : null;
};

export function readDocumentName(name: string): LiveDocument | null {
  const [kind, trip, page, ...rest] = name.split(":");
  const tripId = id(trip);
  if (tripId === null || rest.length) return null;
  if (kind === "trip-pages" && page === undefined) return { kind: "pages", tripId };
  const pageId = id(page);
  return kind === "trip-page" && pageId !== null ? { kind: "page", tripId, pageId } : null;
}
