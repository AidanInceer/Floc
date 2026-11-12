import { log } from "./log";
import { routePattern } from "./route-pattern";

export const MAX_CLIENT_ERROR_BYTES = 2048;

export type ClientError = { errorType: string; message: string; route: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A browser error beacon, or null. Only the three known strings are kept; anything else the page sends is dropped. */
export function readClientError(text: string): ClientError | null {
  if (text.length > MAX_CLIENT_ERROR_BYTES) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  const { errorType, message, route } = parsed;
  if (typeof errorType !== "string" || typeof message !== "string" || typeof route !== "string") return null;
  return { errorType, message, route };
}

export function reportClientError(report: ClientError): void {
  log.warn("client.error", {
    errorType: report.errorType.slice(0, 60),
    errorMessage: report.message.slice(0, 300),
    route: routePattern(report.route),
  });
}
