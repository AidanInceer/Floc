export const TOUR_PACE = {
  lead: 200,
  typing: 600,
  gap: 400,
  beforeAnswer: 300,
  hold: 4800,
} as const;

export type TourBeat = {
  at: number;
  kind: "typing" | "message" | "answer" | "next";
  shown: number;
};

export function tourBeats(messages: number): TourBeat[] {
  const beats: TourBeat[] = [];
  let at = TOUR_PACE.lead;
  for (let shown = 0; shown < messages; shown++) {
    beats.push({ at, kind: "typing", shown });
    at += TOUR_PACE.typing;
    beats.push({ at, kind: "message", shown: shown + 1 });
    at += TOUR_PACE.gap;
  }
  beats.push({ at: at + TOUR_PACE.beforeAnswer, kind: "answer", shown: messages });
  beats.push({ at: at + TOUR_PACE.hold, kind: "next", shown: messages });
  return beats;
}

export function tourAnswerAt(messages: number): number {
  return tourBeats(messages).find((b) => b.kind === "answer")!.at;
}

export function tourLength(messages: number): number {
  return tourBeats(messages).at(-1)!.at;
}

export function stepTo(current: number, delta: number, length: number): number {
  return (((current + delta) % length) + length) % length;
}
