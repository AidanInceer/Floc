export const TEXT_CAPS = {
  tripName: 50,
  noteBody: 2000,
  noteDoc: 400_000,
  expenseDescription: 200,
  expenseNotes: 2000,
  displayName: 80,
  avatarIcon: 500,
  placeName: 200,
  eventTitle: 200,
  eventNote: 2000,
  linkLabel: 120,
  packingLabel: 200,
  documentName: 200,
  packingKitName: 80,
  ideaTitle: 140,
  feedback: 2000,
} as const;

export type TextCap = keyof typeof TEXT_CAPS;

export function asText(value: unknown): string {
  if (typeof value === "string") return value;
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

export function capText(value: unknown, cap: TextCap): string | null {
  const trimmed = asText(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TEXT_CAPS[cap]);
}

export function capRequiredText(value: unknown, cap: TextCap): string {
  return asText(value).trim().slice(0, TEXT_CAPS[cap]);
}

export function properCase(value: string): string {
  return value
    .toLocaleLowerCase("en-GB")
    .replace(/(^|[\s"'/-])(\p{L})/gu, (_, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase("en-GB")}`,
    );
}
