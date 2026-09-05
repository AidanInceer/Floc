/**
 * Pure rules for trip documents (ticket 239) — what may be uploaded, how big,
 * and how a file is described on screen. No I/O: the store and the aggregate
 * both validate through here, so "is this allowed?" has one answer.
 */
import { TEXT_CAPS } from "./text";


/** 10 MB. A boarding pass is kilobytes; this is generous for a scanned visa. */
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/**
 * Allow-list, not a deny-list. Keyed by MIME type because that is what the
 * browser sends and what the serve route echoes back — an extension is a
 * user-supplied string and decides nothing.
 */
const ALLOWED: Record<string, { ext: string; kind: DocumentKind }> = {
  "application/pdf": { ext: "pdf", kind: "pdf" },
  "image/png": { ext: "png", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/heic": { ext: "heic", kind: "image" },
};

export type DocumentKind = "pdf" | "image";

/**
 * What a file is filed under (ticket 239). Five buckets, because a booking
 * is one of a small number of things and a free-text folder name is a
 * taxonomy nobody maintains. `other` is the bucket, not a failure.
 */
export const DOC_CATEGORIES = [
  "travel",
  "stay",
  "tickets",
  "admin",
  "other",
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  travel: "Travel",
  stay: "Stay",
  tickets: "Tickets",
  admin: "Admin",
  other: "Other",
};

/** One pastel per bucket, the same one-per-domain rule the rest of the app follows. */
export const DOC_CATEGORY_SKINS: Record<DocCategory, string> = {
  travel: "bg-blush text-blush-ink",
  stay: "bg-peri text-peri-ink",
  tickets: "bg-butter text-butter-ink",
  admin: "bg-mint text-mint-ink",
  other: "bg-sheet-3 text-ink-soft",
};

/** Anything off the list falls to `other` — filing is not data worth refusing a file over. */
export function parseDocCategory(value: unknown): DocCategory {
  const s = String(value ?? "");
  return (DOC_CATEGORIES as readonly string[]).includes(s)
    ? (s as DocCategory)
    : "other";
}

/** "all" is a real answer, not a missing one (rule 11). */
export function parseCategoryFilter(value: unknown): DocCategory | "all" {
  const s = String(value ?? "");
  return (DOC_CATEGORIES as readonly string[]).includes(s)
    ? (s as DocCategory)
    : "all";
}

export type AllowedType = { mimeType: string; ext: string; kind: DocumentKind };

/** The `accept` attribute, so the file picker and the server agree. */
export const DOCUMENT_ACCEPT = Object.keys(ALLOWED).join(",");

export function allowedType(mimeType: unknown): AllowedType | null {
  const found = ALLOWED[String(mimeType ?? "").toLowerCase()];
  return found ? { mimeType: String(mimeType).toLowerCase(), ...found } : null;
}

function documentKind(mimeType: string): DocumentKind {
  return allowedType(mimeType)?.kind ?? "pdf";
}

/** The 3-letter badge on a row. Not colour alone — it is the word too. */
export function kindLabel(mimeType: string): string {
  return documentKind(mimeType) === "image" ? "IMG" : "PDF";
}

/**
 * A file's own name, made safe to print and to store: no path separators, no
 * quotes, no control characters, capped, and never empty. It is only ever
 * a label — the bytes are addressed by `storageKey` — but a name that
 * looks like a path invites a reader to treat it as one, and the serve
 * route puts it in a quoted header, where a stray quote or backslash ends
 * the value early.
 */
export function cleanFileName(raw: unknown, fallback = "Document"): string {
  const name = String(raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["\\/]/g, " ")
    .trim()
    .slice(0, TEXT_CAPS.documentName);
  return name || fallback;
}

/** "240 KB", "1.1 MB" — sized for a row, never more than one decimal. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Why an upload was refused, in the words the form shows. Null = fine. */
export function rejectUpload(
  mimeType: unknown,
  bytes: number,
): string | null {
  if (bytes <= 0) return "That file is empty";
  if (bytes > MAX_DOCUMENT_BYTES) return "Files are capped at 10 MB";
  if (!allowedType(mimeType)) return "Only PDFs and images can go here";
  return null;
}
