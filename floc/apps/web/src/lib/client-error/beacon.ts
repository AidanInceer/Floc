const MAX_PER_PAGE = 5;
const MAX_MESSAGE = 300;

/**
 * Why (#613): a crash in the browser leaves no trace on the server. This sends type, message and path only — the
 * server scrubs and masks them again — and at most five a page load, so a render loop cannot flood the logs.
 */
export function clientErrorBeacon(send: (body: string) => void, path: () => string) {
  const seen = new Set<string>();
  return {
    report(error: unknown): void {
      const errorType = error instanceof Error ? error.name : typeof error;
      const message = (error instanceof Error ? error.message : String(error)).slice(0, MAX_MESSAGE);
      const key = `${errorType}:${message}`;
      if (seen.has(key) || seen.size >= MAX_PER_PAGE) return;
      seen.add(key);
      send(JSON.stringify({ errorType, message, route: path() }));
    },
  };
}
