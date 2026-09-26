/** First letters of the first two words: "Aidan Inceer" is AI, "Ada" is A. The web and the phone draw the same. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
