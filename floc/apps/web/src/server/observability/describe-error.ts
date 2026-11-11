import { scrubText, type LogFields } from "./redact";

const MAX_MESSAGE = 300;
const STACK_FRAMES = 6;

// Why: a Drizzle query error ends with "params: <values>", and those values are what the user typed.
function withoutParams(message: string): string {
  return scrubText(message.split(/\s*params:/)[0] ?? "").slice(0, MAX_MESSAGE);
}

function firstFrames(stack: string | undefined): string | undefined {
  const frames = (stack ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("at "))
    .slice(0, STACK_FRAMES);
  return frames.length ? scrubText(frames.join(" | ")) : undefined;
}

function stringProp(err: Error, key: "digest" | "code"): string | undefined {
  const value = (err as unknown as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

/** The parts of a thrown value safe to log: type, a cut and scrubbed message, the top of the stack. */
export function describeError(err: unknown): LogFields {
  if (!(err instanceof Error)) return { errorType: typeof err };
  return {
    errorType: err.name,
    errorMessage: withoutParams(err.message),
    errorStack: firstFrames(err.stack),
    errorCause: err.cause instanceof Error ? withoutParams(err.cause.message) : undefined,
    errorCode: stringProp(err, "code"),
    digest: stringProp(err, "digest"),
  };
}
