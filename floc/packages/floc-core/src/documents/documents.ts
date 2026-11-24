import { asText, TEXT_CAPS } from "../text/text";


const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENT_BASE64_LENGTH = Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4;

const ALLOWED: Record<string, { ext: string; kind: DocumentKind }> = {
  "application/pdf": { ext: "pdf", kind: "pdf" },
  "image/png": { ext: "png", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/heic": { ext: "heic", kind: "image" },
};

export type DocumentKind = "pdf" | "image";

export const DOC_CATEGORIES = [
  "travel",
  "hotel",
  "tickets",
  "admin",
  "other",
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  travel: "Travel",
  hotel: "Hotel",
  tickets: "Tickets",
  admin: "Admin",
  other: "Other",
};

export const DOC_CATEGORY_SKINS: Record<DocCategory, string> = {
  travel: "bg-pastel-blue text-pastel-blue-ink",
  hotel: "bg-pastel-green text-pastel-green-ink",
  tickets: "bg-pastel-yellow text-pastel-yellow-ink",
  admin: "bg-pastel-red text-pastel-red-ink",
  other: "bg-sheet-3 text-ink-soft",
};

export const DOC_CATEGORY_CHIPS: Record<DocCategory, string> = {
  travel: "border border-pastel-blue-edge bg-pastel-blue text-pastel-blue-ink hover:border-pastel-blue-ink",
  hotel: "border border-pastel-green-edge bg-pastel-green text-pastel-green-ink hover:border-pastel-green-ink",
  tickets: "border border-pastel-yellow-edge bg-pastel-yellow text-pastel-yellow-ink hover:border-pastel-yellow-ink",
  admin: "border border-pastel-red-edge bg-pastel-red text-pastel-red-ink hover:border-pastel-red-ink",
  other: "border border-rule-strong bg-sheet-3 text-ink-soft hover:border-ink-faint",
};

export const DOC_CATEGORY_TONES: Record<DocCategory, "blue" | "green" | "yellow" | "red" | null> = {
  travel: "blue",
  hotel: "green",
  tickets: "yellow",
  admin: "red",
  other: null,
};

const LEGACY_CATEGORY: Record<string, DocCategory> = { stay: "hotel" };

function knownCategory(value: unknown): DocCategory | null {
  const s = asText(value);
  if ((DOC_CATEGORIES as readonly string[]).includes(s)) return s as DocCategory;
  return LEGACY_CATEGORY[s] ?? null;
}

export const DOC_CATEGORY_INPUTS = [...DOC_CATEGORIES, ...Object.keys(LEGACY_CATEGORY)] as [string, ...string[]];

export function parseDocCategory(value: unknown): DocCategory {
  return knownCategory(value) ?? "other";
}

export function parseCategoryFilter(value: unknown): DocCategory | "all" {
  return knownCategory(value) ?? "all";
}

export type AllowedType = { mimeType: string; ext: string; kind: DocumentKind };

export const DOCUMENT_ACCEPT = Object.keys(ALLOWED).join(",");

export function allowedType(mimeType: unknown): AllowedType | null {
  const found = ALLOWED[asText(mimeType).toLowerCase()];
  return found ? { mimeType: asText(mimeType).toLowerCase(), ...found } : null;
}

function documentKind(mimeType: string): DocumentKind {
  return allowedType(mimeType)?.kind ?? "pdf";
}

export function kindLabel(mimeType: string): string {
  return documentKind(mimeType) === "image" ? "IMG" : "PDF";
}

export function cleanFileName(raw: unknown, fallback = "Document"): string {
  const name = asText(raw)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["\\/]/g, " ")
    .trim()
    .slice(0, TEXT_CAPS.documentName);
  return name || fallback;
}

export function renamedFileName(raw: unknown, previous: string): string | null {
  const cleaned = cleanFileName(raw, "");
  if (!cleaned) return null;
  const extension = /\.[a-z0-9]{1,5}$/i.exec(previous)?.[0] ?? "";
  if (!extension || cleaned.toLowerCase().endsWith(extension.toLowerCase())) return cleaned;
  return cleaned.slice(0, TEXT_CAPS.documentName - extension.length).trimEnd() + extension;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  const oneDecimal = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (mb < 1024) return `${oneDecimal(mb)} MB`;
  return `${oneDecimal(mb / 1024)} GB`;
}

export const FREE_TRIP_STORAGE_BYTES = 200 * 1024 ** 2;
export const PRO_TRIP_STORAGE_BYTES = 1024 ** 3;

export function tripStorageBytes(pro: boolean): number {
  return pro ? PRO_TRIP_STORAGE_BYTES : FREE_TRIP_STORAGE_BYTES;
}

export const FREE_ACCOUNT_STORAGE_BYTES = 1024 ** 3;

export function rejectForSpace(usedBytes: number, incomingBytes: number, quotaBytes: number, own = false): string | null {
  const left = quotaBytes - usedBytes;
  const quota = formatBytes(quotaBytes);
  if (left <= 0) {
    return own
      ? `Your files on this trip have used all of your ${quota}. Remove a file to make room.`
      : `This trip has used all of its ${quota}. Remove a file to make room.`;
  }
  if (incomingBytes <= left) return null;
  const size = formatBytes(incomingBytes);
  return own
    ? `You have ${formatBytes(left)} of your ${quota} left on this trip, and that file is ${size}.`
    : `This trip has ${formatBytes(left)} of its ${quota} left, and that file is ${size}.`;
}

export function rejectForAccount(usedBytes: number, incomingBytes: number): string | null {
  const left = FREE_ACCOUNT_STORAGE_BYTES - usedBytes;
  const quota = formatBytes(FREE_ACCOUNT_STORAGE_BYTES);
  if (left <= 0) return `Your free account has used all of its ${quota}. Remove a file to make room.`;
  if (incomingBytes <= left) return null;
  return `Your free account has ${formatBytes(left)} of its ${quota} left, and that file is ${formatBytes(incomingBytes)}.`;
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

export function bytesMatchType(mimeType: unknown, data: Uint8Array): boolean {
  const type = allowedType(mimeType);
  return !!type && (SIGNATURES[type.mimeType]?.(data) ?? false);
}

export function rejectUpload(
  mimeType: unknown,
  bytes: number,
): string | null {
  if (bytes <= 0) return "That file is empty";
  if (bytes > MAX_DOCUMENT_BYTES) return "Files are capped at 8 MB";
  if (!allowedType(mimeType)) return "Only PDFs and images can go here";
  return null;
}
