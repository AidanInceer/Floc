export const HEADLINE_WORDS = ["started", "shared", "taking shape", "sorted."] as const;
export const START_DELAY_MS = 2000;

// The chosen wireframe study (C3). typingScript stretches these evenly to end with the scene below.
const DELETE_MS = 44;
const THINK_MS = 280;
const TYPE_MS = 84;
const LAST_TYPE_MS = 104;
const FULL_STOP_MS = 340;
const HOLD_MS = 1000;
const MARK_AFTER_MS = 1060;
const SWEEP_MS = 640;
const CARET_SOLID_MS = 420;
const CARET_BLINK_MS = 500;
// Why: an even key rhythm reads as a machine; these nudges read as someone typing.
const JITTER_MS = [0, 34, -18, 52, -8, 22, -26, 64, 6, -14, 40];

type Keystroke = { at: number; text: string };
export type TypingScript = { strokes: Keystroke[]; markAt: number; doneAt: number };
export type HeadlineFrame = { text: string; caret: boolean; sweep: number };

function keystrokes(words: readonly string[]): { strokes: Keystroke[]; markAt: number } {
  const strokes: Keystroke[] = [];
  let at = 0;
  words.slice(1).forEach((word, i) => {
    const before = words[i] ?? "";
    const last = i + 2 === words.length;
    for (let n = before.length - 1; n >= 0; n--) {
      at += DELETE_MS;
      strokes.push({ at, text: before.slice(0, n) });
    }
    at += THINK_MS;
    [...word].forEach((character, n) => {
      at += (last ? LAST_TYPE_MS : TYPE_MS) + JITTER_MS[(n + i * 3) % JITTER_MS.length]! + (character === "." ? FULL_STOP_MS : 0);
      strokes.push({ at, text: word.slice(0, n + 1) });
    });
    if (!last) at += HOLD_MS;
  });
  return { strokes, markAt: at + MARK_AFTER_MS };
}

/** Rests on the first word until `startDelayMs`, then types the rest so the mark finishes at `endMs`. */
export function typingScript(words: readonly string[], startDelayMs: number, endMs: number): TypingScript {
  const study = keystrokes(words);
  const stretch = (endMs - startDelayMs) / (study.markAt + SWEEP_MS);
  const at = (ms: number) => startDelayMs + ms * stretch;
  return {
    strokes: [{ at: 0, text: words[0] ?? "" }, ...study.strokes.map((s) => ({ at: at(s.at), text: s.text }))],
    markAt: at(study.markAt),
    doneAt: endMs,
  };
}

// A hand on a highlighter: a slow first touch, then a quick stroke that eases out.
function penStroke(p: number): number {
  if (p < 0.12) return 0.5 * (p / 0.12) ** 2 * 0.12;
  return 0.06 + 0.94 * (1 - (1 - (p - 0.12) / 0.88) ** 3);
}

export function frameAt(script: TypingScript, time: number): HeadlineFrame {
  let stroke = script.strokes[0]!;
  for (const s of script.strokes) if (s.at <= time) stroke = s;
  const idle = time - stroke.at;
  const blinkOn = idle < CARET_SOLID_MS || Math.floor((idle - CARET_SOLID_MS) / CARET_BLINK_MS) % 2 === 1;
  const p = Math.min(1, Math.max(0, (time - script.markAt) / (script.doneAt - script.markAt)));
  return { text: stroke.text, caret: time < script.markAt && blinkOn, sweep: p === 0 ? 0 : penStroke(p) };
}
