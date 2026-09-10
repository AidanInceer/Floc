/**
 * Dietary requirements (ticket 46) — a *functional* attribute: stored on the
 * profile, never rendered on a profile page. Nobody browses a friend's profile
 * to read their allergies; a trip picking a restaurant genuinely needs them.
 *
 * Two halves, one switch. The presets are the diets a menu can be filtered by;
 * the free text is allergies and intolerances, which no preset list covers.
 * `share_dietary` governs both together — you cannot publish half a dietary
 * record.
 */

/** The preset diets. Values are what's stored; labels are what's shown. */
export const DIET_FLAGS = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  halal: "Halal",
  kosher: "Kosher",
  "no-pork": "No pork",
  "no-beef": "No beef",
  "no-alcohol": "No alcohol",
} as const;

export type DietFlag = keyof typeof DIET_FLAGS;

/** Long enough for "coeliac, severe nut allergy — carries an EpiPen". */
export const MAX_DIETARY_NOTES = 280;

function isDietFlag(value: unknown): value is DietFlag {
  return typeof value === "string" && value in DIET_FLAGS;
}

/** Checkbox values → the column, order fixed by `DIET_FLAGS` so it's stable. */
export function parseDietFlags(input: (string | null | undefined)[]): DietFlag[] {
  const picked = new Set(input.filter(isDietFlag));
  return (Object.keys(DIET_FLAGS) as DietFlag[]).filter((f) => picked.has(f));
}

/** The column back into a list — degrade, don't crash (rule 11). */
export function readDietFlags(value: unknown): DietFlag[] {
  if (!Array.isArray(value)) return [];
  return (Object.keys(DIET_FLAGS) as DietFlag[]).filter((f) =>
    value.includes(f),
  );
}

/** One line summarising a dietary record, for the places it does work. */
export function dietarySummary(
  flags: DietFlag[],
  notes: string | null,
): string | null {
  const parts = [
    ...flags.map((f) => DIET_FLAGS[f]),
    ...(notes?.trim() ? [notes.trim()] : []),
  ];
  return parts.length ? parts.join(" · ") : null;
}
