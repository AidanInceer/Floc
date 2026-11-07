/** "Aidan Inceer" is AI, "Aidan" is Ai, "Ada Mary Lovelace" is AM. The web and the phone draw the same. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const word = words[0] ?? "";
    return word.slice(0, 1).toUpperCase() + word.slice(1, 2).toLowerCase();
  }
  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toUpperCase())
    .join("");
}
