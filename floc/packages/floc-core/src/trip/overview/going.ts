const NAMED_PAST_FOUR = 3;

export function goingNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length <= 4) return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${names.slice(0, NAMED_PAST_FOUR).join(", ")} and ${names.length - NAMED_PAST_FOUR} more`;
}

export function goingNotes({ toAddDates, invited }: { toAddDates: number; invited: number }): string[] {
  return [toAddDates ? `${toAddDates} to add dates` : "", invited ? `${invited} invited` : ""].filter(Boolean);
}
