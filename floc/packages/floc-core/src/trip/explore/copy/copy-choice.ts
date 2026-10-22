import { asText } from "../../../text/text";

/** What the person picked when copying a listing (ADR-025). `month` null is *Decide later*: an undated copy. */
export type CopyChoice = { presetId: string; month: number | null; ideas: boolean; events: boolean };

export function readMonth(value: unknown): number | null {
  const n = Number(value);
  return typeof value === "string" && Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/** The copy form, read at the door. Anything that is not a month is *Decide later*; a switch is on only when ticked. */
export function readCopyForm(form: { get(name: string): unknown }): CopyChoice {
  return {
    presetId: asText(form.get("presetId")),
    month: readMonth(form.get("month")),
    ideas: form.get("ideas") === "on",
    events: form.get("events") === "on",
  };
}
