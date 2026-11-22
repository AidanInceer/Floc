export type RefusalKind = "invalid" | "missing" | "forbidden";

export class Refusal extends Error {
  readonly kind: RefusalKind;

  constructor(message: string, kind: RefusalKind = "invalid") {
    super(message);
    this.name = "Refusal";
    this.kind = kind;
  }
}

export function isRefusal(error: unknown): error is Refusal {
  return error instanceof Error && error.name === "Refusal" && "kind" in error;
}

export async function orRefusal<T>(work: () => Promise<T>): Promise<NonNullable<T> | { error?: string }> {
  try {
    return (await work()) ?? {};
  } catch (error) {
    if (isRefusal(error)) return { error: error.message };
    throw error;
  }
}
