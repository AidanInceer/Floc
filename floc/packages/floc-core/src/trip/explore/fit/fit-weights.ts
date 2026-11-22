export const FIT_WEIGHTS = {
  parts: { style: 50, length: 25, money: 25 },
  wantToGoLift: 0.25,
} as const;

export type FitPart = keyof typeof FIT_WEIGHTS.parts;
