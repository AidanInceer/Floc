/**
 * Pure rules for trip documents (ticket 239) — what may be uploaded, how big,
 * and how a file is described on screen. No I/O: the store and the aggregate
 * both validate through here, so "is this allowed?" has one answer.
 */
import { asText, TEXT_CAPS } from "../text/text";


/** 8 MB. A boarding pass is kilobytes; this is generous for a scanned visa. */
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENT_BASE64_LENGTH = Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4;

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
  travel: "bg-pastel-red text-pastel-red-ink",
  stay: "bg-pastel-blue text-pastel-blue-ink",
  tickets: "bg-pastel-yellow text-pastel-yellow-ink",
  admin: "bg-pastel-green text-pastel-green-ink",
  other: "bg-sheet-3 text-ink-soft",
};

/** Anything off the list falls to `other` — filing is not data worth refusing a file over. */
export function parseDocCategory(value: unknown): DocCategory {
  const s = asText(value);
  return (DOC_CATEGORIES as readonly string[]).includes(s)
    ? (s as DocCategory)
    : "other";
}

/** "all" is a real answer, not a missing one (rule 11). */
export function parseCategoryFilter(value: unknown): DocCategory | "all" {
  const s = asText(value);
  return (DOC_CATEGORIES as readonly string[]).includes(s)
    ? (s as DocCategory)
    : "all";
}

export type AllowedType = { mimeType: string; ext: string; kind: DocumentKind };

/** The `accept` attribute, so the file picker and the server agree. */
export const DOCUMENT_ACCEPT = Object.keys(ALLOWED).join(",");

export function allowedType(mimeType: unknown): AllowedType | null {
  const found = ALLOWED[asText(mimeType).toLowerCase()];
  return found ? { mimeType: asText(mimeType).toLowerCase(), ...found } : null;
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
  const name = asText(raw)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["\\/]/g, " ")
    .trim()
    .slice(0, TEXT_CAPS.documentName);
  return name || fallback;
}

/**
 * A new display name for a file already stored (#364). The bytes never change,
 * so a name typed without the extension gets the old one back — a download
 * called "Ferry to Mull" opens as nothing on a desktop.
 */
export function renamedFileName(raw: unknown, previous: string): string | null {
  const cleaned = cleanFileName(raw, "");
  if (!cleaned) return null;
  const extension = /\.[a-z0-9]{1,5}$/i.exec(previous)?.[0] ?? "";
  if (!extension || cleaned.toLowerCase().endsWith(extension.toLowerCase())) return cleaned;
  return cleaned.slice(0, TEXT_CAPS.documentName - extension.length).trimEnd() + extension;
}

/** "240 KB", "1.1 MB" — sized for a row, never more than one decimal. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  const oneDecimal = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (mb < 1024) return `${oneDecimal(mb)} MB`;
  return `${oneDecimal(mb / 1024)} GB`;
}

/**
 * What one trip may hold, shared and private together (#285). Deleted files
 * give their bytes back. Pro's number is not printed on the landing page — it
 * sells "extra storage", so this can move without the copy going wrong.
 */
export const FREE_TRIP_STORAGE_BYTES = 200 * 1024 ** 2;
export const PRO_TRIP_STORAGE_BYTES = 1024 ** 3;

export function tripStorageBytes(pro: boolean): number {
  return pro ? PRO_TRIP_STORAGE_BYTES : FREE_TRIP_STORAGE_BYTES;
}

/** Refuses an upload that would take the trip past its quota, naming what is left. */
export function rejectForSpace(usedBytes: number, incomingBytes: number, quotaBytes: number): string | null {
  const left = quotaBytes - usedBytes;
  const quota = formatBytes(quotaBytes);
  if (left <= 0) return `This trip has used all of its ${quota}. Remove a file to make room.`;
  if (incomingBytes <= left) return null;
  return `This trip has ${formatBytes(left)} of its ${quota} left, and that file is ${formatBytes(incomingBytes)}.`;
}

const HEIC_BRANDS = ["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"];

const startsWith = (data: Uint8Array, prefix: number[], offset = 0) =>
  prefix.every((byte, i) => data[offset + i] === byte);

const ascii = (text: string) => Array.from(new TextEncoder().encode(text));

const SIGNATURES: Record<string, (data: Uint8Array) => boolean> = {
  "application/pdf": (d) => startsWith(d, ascii("%PDF-")),
  "image/png": (d) => startsWith(d, [0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/jpeg": (d) => startsWith(d, [0xff, 0xd8, 0xff]),
  "image/heic": (d) =>
    startsWith(d, ascii("ftyp"), 4) && HEIC_BRANDS.some((b) => startsWith(d, ascii(b), 8)),
};

/** Why: the MIME type is the client's claim; the served Content-Type echoes it, so the bytes must agree. */
export function bytesMatchType(mimeType: unknown, data: Uint8Array): boolean {
  const type = allowedType(mimeType);
  return !!type && (SIGNATURES[type.mimeType]?.(data) ?? false);
}

/** Why an upload was refused, in the words the form shows. Null = fine. */
export function rejectUpload(
  mimeType: unknown,
  bytes: number,
): string | null {
  if (bytes <= 0) return "That file is empty";
  if (bytes > MAX_DOCUMENT_BYTES) return "Files are capped at 8 MB";
  if (!allowedType(mimeType)) return "Only PDFs and images can go here";
  return null;
}
