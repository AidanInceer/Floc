/**
 * Why (#613, ADR-046): logs leave the app for Railway, so they hold no personal data, secrets or trip content.
 * Keys that can carry them are dropped whole; every kept string loses emails, ids and long tokens.
 */

type LogValue = string | number | boolean | null | undefined;
export type LogFields = Record<string, LogValue>;

const PERSONAL_KEY = /email|name|token|cookie|authori[sz]|password|secret|body|content|note|title|phone|address|query/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const LONG_TOKEN = /[A-Za-z0-9_-]{24,}/g;
const MAX_STRING = 1000;

export function scrubText(text: string): string {
  return text.slice(0, MAX_STRING).replace(EMAIL, "[email]").replace(UUID, "[id]").replace(LONG_TOKEN, "[token]");
}

export function redactFields(fields: LogFields): LogFields {
  const kept: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || PERSONAL_KEY.test(key)) continue;
    kept[key] = typeof value === "string" ? scrubText(value) : value;
  }
  return kept;
}
