/** What an ask becomes: 1 dates, 2 route, 3 stays, 4 packing, 5 food, 6 money. */
export type MarkId = 1 | 2 | 3 | 4 | 5 | 6;
type Part = readonly [text: string, mark?: MarkId];

// One line per ask, so each marked phrase sits on its own line of the prompt.
const PROMPT: readonly (readonly Part[])[] = [
  [["Plan Sicily for "], ["six of us, 12–19 September", 1], ["."]],
  [["Flying into "], ["Palermo, home from Catania", 2], ["."]],
  [["Old towns and a couple of beach days", 3], ["."]],
  [["One day up "], ["Etna", 4], ["."]],
  [["Good local food", 5], [", nothing touristy."]],
  [["About "], ["£900 each before flights", 6], ["."]],
];

export const PROMPT_TEXT = PROMPT.map((line) => line.map(([text]) => text).join("")).join(" ");

const KEY_MS = 15;
const FULL_STOP_MS = 170;
const COMMA_MS = 60;
const CARET_HOLD_MS = 120;

type TypedChar = { ch: string; at: number };
type TypedPart = { mark?: MarkId; chars: TypedChar[] };
export type TypedPrompt = { lines: TypedPart[][]; endMs: number };

/** When each key of the prompt lands, from `startMs`: a steady rate, with a beat after each comma and a longer one after each full stop. */
export function typePrompt(startMs: number): TypedPrompt {
  let at = startMs;
  const key = (ch: string): TypedChar => {
    const typed = { ch, at };
    at += KEY_MS + (ch === "." ? FULL_STOP_MS : ch === "," ? COMMA_MS : 0);
    return typed;
  };
  const lines = PROMPT.map((line) => line.map(([text, mark]) => ({ mark, chars: [...text].map(key) })));
  return { lines, endMs: at + CARET_HOLD_MS };
}
