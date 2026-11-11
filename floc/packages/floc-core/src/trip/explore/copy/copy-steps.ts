/** The pages of "Start this trip" (ADR-025): ask about dates, then pick them and what else comes across, or go undated. */
export type CopyStep = "ask" | "when" | "extras" | "undated";

/** The answer to "Do you have dates yet?": null until it is given. */
export type HasDates = boolean | null;

export function copySteps(has: HasDates): CopyStep[] {
  return has === false ? ["ask", "undated"] : ["ask", "when", "extras"];
}

export function stepOn(step: CopyStep, has: HasDates): CopyStep {
  const steps = copySteps(has);
  return steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)];
}

export function stepBack(step: CopyStep, has: HasDates): CopyStep {
  const steps = copySteps(has);
  return steps[Math.max(steps.indexOf(step) - 1, 0)];
}
