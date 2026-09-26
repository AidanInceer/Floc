/**
 * A request refused for a reason the person can act on. Both doors show the
 * message as it is: the web as a form error, the API as a 4xx, never a 500.
 */
export type RefusalKind = "invalid" | "missing" | "forbidden";

export class Refusal extends Error {
  readonly kind: RefusalKind;

  constructor(message: string, kind: RefusalKind = "invalid") {
    super(message);
    this.name = "Refusal";
    this.kind = kind;
  }
}

/** By name, not `instanceof`: a bundler may load this module twice. */
export function isRefusal(error: unknown): error is Refusal {
  return error instanceof Error && error.name === "Refusal" && "kind" in error;
}
