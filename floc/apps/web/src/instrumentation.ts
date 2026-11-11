import type { Instrumentation } from "next";

// Why: the import sits inside the runtime test so the edge build drops it; an early return keeps Node-only code in.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startTracing } = await import("./server/observability/tracing");
    startTracing(process.env);
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportRequestError } = await import("./server/observability/request-error");
    reportRequestError(err, request, context);
  }
};
