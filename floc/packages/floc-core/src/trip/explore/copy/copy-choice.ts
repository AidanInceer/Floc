import { readIsoDate, type IsoDate } from "../../../dates/dates";
import { asText } from "../../../text/text";

export type CopyChoice = { presetId: string; month: number | null; startDate: IsoDate | null; ideas: boolean; events: boolean };

export function readMonth(value: unknown): number | null {
  const n = Number(value);
  return typeof value === "string" && Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

export function readCopyForm(form: { get(name: string): unknown }): CopyChoice {
  return {
    presetId: asText(form.get("presetId")),
    month: readMonth(form.get("month")),
    startDate: readIsoDate(form.get("start")),
    ideas: form.get("ideas") === "on",
    events: form.get("events") === "on",
  };
}
