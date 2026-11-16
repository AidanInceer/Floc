export function nounFor(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

export function countWord(n: number, word: string): string {
  return `${n} ${nounFor(n, word)}`;
}
