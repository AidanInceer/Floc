import { AMERICAN_SPELLINGS, QUOTED_PRICES } from "./facts.ts";

const MAX_LENGTH = 2200;
const MAX_HASHTAGS = 30;

export function checkCaption(caption: string): string[] {
  const text = caption.trim();
  if (!text) return ["Caption is empty."];
  const problems: string[] = [];

  const length = text.length;
  if (length > MAX_LENGTH) problems.push(`Caption is ${length} characters; Instagram allows 2,200.`);

  const hashtags = text.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  if (hashtags > MAX_HASHTAGS) problems.push(`Caption has ${hashtags} hashtags; Instagram allows ${MAX_HASHTAGS}.`);

  if (/\p{Extended_Pictographic}/u.test(text)) problems.push("Caption has emoji; Floc uses none.");

  for (const word of text.match(/\p{L}+/gu) ?? []) {
    const british = AMERICAN_SPELLINGS[word.toLowerCase()];
    if (british) problems.push(`“${word}” is American; write “${british}”.`);
  }

  const allowed: readonly string[] = QUOTED_PRICES;
  for (const price of text.match(/£\d+(?:\.\d{2})?/g) ?? []) {
    if (!allowed.includes(price)) {
      problems.push(`“${price}” is not a price Floc charges (${QUOTED_PRICES.join(", ")}). If Stripe changed, update facts.ts.`);
    }
  }
  return problems;
}
