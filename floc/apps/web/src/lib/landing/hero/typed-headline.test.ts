import { describe, expect, it } from "vitest";

import { HEADLINE_WORDS, START_DELAY_MS, frameAt, typingScript } from "./typed-headline";

const END_MS = 13_500;
const script = typingScript(HEADLINE_WORDS, START_DELAY_MS, END_MS);
const textsBetween = (from: number, to: number) => {
  const seen: string[] = [];
  for (let t = from; t <= to; t += 5) seen.push(frameAt(script, t).text);
  return seen;
};

describe("typed headline", () => {
  it("rests on the first word, caret showing, until the start delay ends", () => {
    expect(frameAt(script, 0)).toMatchObject({ text: "started", caret: true, sweep: 0 });
    expect(new Set(textsBetween(0, START_DELAY_MS - 1))).toEqual(new Set(["started"]));
  });

  it("blinks the caret while it waits", () => {
    const carets = new Set<boolean>();
    for (let t = 0; t < START_DELAY_MS; t += 50) carets.add(frameAt(script, t).caret);
    expect(carets).toEqual(new Set([true, false]));
  });

  it("types every word in order and ends on sorted", () => {
    const whole = textsBetween(0, script.doneAt);
    const finished = HEADLINE_WORDS.map((word) => whole.indexOf(word));
    expect(finished.every((at) => at >= 0)).toBe(true);
    expect(finished).toEqual([...finished].sort((a, b) => a - b));
    expect(frameAt(script, script.doneAt).text).toBe("sorted.");
  });

  it("deletes each word to an empty line before typing the next", () => {
    const whole = textsBetween(START_DELAY_MS, script.doneAt);
    const empties = whole.filter((text, i) => text === "" && whole[i - 1] !== "").length;
    expect(empties).toBe(HEADLINE_WORDS.length - 1);
  });

  it("drops the caret and marks sorted once the last word is typed", () => {
    expect(frameAt(script, script.markAt - 1)).toMatchObject({ text: "sorted.", sweep: 0 });
    expect(frameAt(script, script.markAt).caret).toBe(false);
    expect(frameAt(script, script.doneAt)).toMatchObject({ caret: false, sweep: 1 });
  });

  it("sweeps the mark left to right without going back", () => {
    const sweeps = [];
    for (let t = script.markAt; t <= script.doneAt; t += 16) sweeps.push(frameAt(script, t).sweep);
    expect(sweeps).toEqual([...sweeps].sort((a, b) => a - b));
  });

  it("waits two seconds before it types", () => {
    expect(START_DELAY_MS).toBe(2000);
  });

  it("stretches evenly so the mark finishes when the scene below does", () => {
    expect(script.doneAt).toBe(END_MS);
    const later = typingScript(HEADLINE_WORDS, START_DELAY_MS, END_MS * 2);
    const firstKey = (s: typeof script) => s.strokes[1]!.at - START_DELAY_MS;
    expect(firstKey(later) / firstKey(script)).toBeCloseTo((END_MS * 2 - START_DELAY_MS) / (END_MS - START_DELAY_MS));
  });
});
