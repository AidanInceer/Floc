import type { Instrumentation } from "next";

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
