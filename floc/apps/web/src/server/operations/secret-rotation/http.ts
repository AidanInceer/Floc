export async function requestJson<T>(fetcher: typeof fetch, url: string, init: RequestInit = {}): Promise<T> {
  try {
    const response = await fetcher(url, { ...init, redirect: "error", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error("Provider request failed.");
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  } catch {
    throw new Error("Provider request failed. No response details are logged; check the token you pasted has access.");
  }
}
