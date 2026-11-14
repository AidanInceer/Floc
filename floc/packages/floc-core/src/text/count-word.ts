/** "night" for one, "nights" for any other count. For JSX that draws the number as its own text node. */
export function nounFor(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

/** A number with its noun: "1 night", "4 nights". Web and phone both say counts through this one rule. */
export function countWord(n: number, word: string): string {
  return `${n} ${nounFor(n, word)}`;
}
