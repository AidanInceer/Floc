/**
 * Which cube a typed thing goes in, so adding to your bag is one field. Pure
 * and word-based: whole words only, singular or plural, and anything it does
 * not know is Other, never a wrong guess dressed up as a right one.
 */
import type { PackCategory } from "./packing";

const WORDS: [PackCategory, string[]][] = [
  ["essentials", ["passport", "visa", "wallet", "card", "cash", "money", "phone", "charger", "key", "adapter", "adaptor", "plug", "ticket", "insurance", "ehic", "ghic", "id", "licence", "license", "boarding", "powerbank"]],
  ["toiletries", ["toothbrush", "toothpaste", "shampoo", "conditioner", "deodorant", "medication", "medicine", "pill", "tablet", "cream", "suncream", "sunscreen", "spf", "aftersun", "razor", "soap", "lotion", "moisturiser", "plaster", "floss", "perfume", "makeup", "washbag", "lens", "hairbrush", "comb", "tampon", "contact"]],
  ["clothes", ["underwear", "sock", "shirt", "tshirt", "top", "trouser", "short", "jumper", "sweater", "cardigan", "hoodie", "fleece", "coat", "jacket", "swimwear", "swimsuit", "bikini", "trunk", "sleepwear", "pyjama", "pajama", "shoe", "trainer", "boot", "sandal", "flop", "dress", "skirt", "jean", "legging", "hat", "cap", "scarf", "glove", "belt", "bra", "vest", "blouse"]],
  ["accessories", ["sunglass", "glass", "bottle", "bag", "backpack", "rucksack", "towel", "umbrella", "watch", "book", "kindle", "headphone", "earphone", "earbud", "camera", "pillow", "mask", "earplug", "jewellery", "lock"]],
];

const LOOKUP = new Map(WORDS.flatMap(([category, words]) => words.map((w) => [w, category] as const)));

function singular(word: string): string {
  if (/(s|x|sh|ch)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** "T-shirt" and "after-sun" are one word to a packer, so a hyphen joins as well as splits. */
function wordsOf(label: string): string[] {
  const chunks = label.toLowerCase().match(/[a-z-]+/g) ?? [];
  return chunks.flatMap((chunk) => {
    const parts = chunk.split("-").filter(Boolean);
    return parts.length > 1 ? [parts.join(""), ...parts] : parts;
  });
}

export function guessPackCategory(label: string): PackCategory {
  for (const word of wordsOf(label)) {
    const hit = LOOKUP.get(word) ?? LOOKUP.get(singular(word));
    if (hit) return hit;
  }
  return "other";
}
