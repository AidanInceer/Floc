import { describeError } from "./describe-error";
import { log } from "./log";
import { routePattern } from "./route-pattern";

type ErrorRequest = { path: string; method: string };
type ErrorContext = { routePath: string; routeType: string };

const STALE_ACTION = /Failed to find Server Action/;

export function reportRequestError(err: unknown, request: ErrorRequest, context: ErrorContext): void {
  const fields = {
    route: context.routePath || routePattern(request.path),
    routeType: context.routeType,
    method: request.method,
    ...describeError(err),
  };
  if (err instanceof Error && STALE_ACTION.test(err.message)) log.warn("action.stale", fields);
  else log.error("request.error", fields);
}

export function reportTrpcError({ error, path }: { error: Error & { code: string }; path: string | undefined }): void {
  if (error.code !== "INTERNAL_SERVER_ERROR") return;
  log.error("trpc.error", { procedure: path ?? "<no path>", code: error.code, ...describeError(error.cause ?? error) });
}
