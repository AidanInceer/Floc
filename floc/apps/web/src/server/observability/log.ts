/**
 * Why (#613, ADR-046): one JSON line per event on stdout is what Railway indexes — `message`, `level`, and each
 * other key as an attribute to search by (`@requestId:…`). Callers pass flat fields; redaction runs on every line.
 */
import { isSpanContextValid, trace } from "@opentelemetry/api";

import pkg from "../../../package.json" with { type: "json" };

import { redactFields, scrubText, type LogFields } from "./redact";
import { currentRequestId } from "./request-context";

type Level = "info" | "warn" | "error";

function traceFields(): LogFields {
  const span = trace.getActiveSpan()?.spanContext();
  return span && isSpanContextValid(span) ? { traceId: span.traceId, spanId: span.spanId } : {};
}

function write(level: Level, message: string, fields: LogFields = {}): void {
  const line = {
    ...redactFields(fields),
    message: scrubText(message),
    level,
    release: pkg.version,
    requestId: currentRequestId(),
    ...traceFields(),
  };
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

export const log = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
