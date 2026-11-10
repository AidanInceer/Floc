import { readIsoDate, type IsoDate } from "../../../dates/dates";
import { asText } from "../../../text/text";

/**
 * What the person picked when copying a listing (ADR-025): a start day, or *Not yet* (both null), an undated copy.
 * Why `month` stays: phone builds already out there send a best month and no start day.
 */
export type CopyChoice = { presetId: string; month: number | null; startDate: IsoDate | null; ideas: boolean; events: boolean };

export function readMonth(value: unknown): number | null {
  const n = Number(value);
  return typeof value === "string" && Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

/** The copy form, read at the door. Anything that is not a date or a month is *Not yet*; a switch is on only when ticked. */
export function readCopyForm(form: { get(name: string): unknown }): CopyChoice {
  return {
    presetId: asText(form.get("presetId")),
    month: readMonth(form.get("month")),
    startDate: readIsoDate(form.get("start")),
    ideas: form.get("ideas") === "on",
    events: form.get("events") === "on",
  };
}
