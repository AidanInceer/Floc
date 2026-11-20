const CLIENT_IP_HEADER = "x-real-ip";

export const SHARED_CHECK_MS = 5_000;

type Check = { at: number; userId: Promise<string | null> };

export function sessionResolver(origin: string, fetchFn: typeof fetch = fetch, now: () => number = Date.now) {
  const recent = new Map<string, Check>();

  const ask = async (cookie: string, ip: string | null): Promise<string | null> => {
    try {
      const res = await fetchFn(`${origin}/api/auth/get-session?disableCookieCache=true`, {
        headers: ip ? { cookie, [CLIENT_IP_HEADER]: ip } : { cookie },
      });
      if (!res.ok) return null;
      const session = (await res.json()) as { user?: { id?: string } } | null;
      return session?.user?.id ?? null;
    } catch {
      return null;
    }
  };

  return async (headers: Headers): Promise<string | null> => {
    const cookie = headers.get("cookie");
    if (!cookie) return null;
    const ip = headers.get(CLIENT_IP_HEADER);
    const at = now();
    for (const [key, check] of recent) if (at - check.at >= SHARED_CHECK_MS) recent.delete(key);
    const key = `${ip ?? ""}\n${cookie}`;
    const held = recent.get(key);
    if (held) return held.userId;
    const userId = ask(cookie, ip);
    recent.set(key, { at, userId });
    return userId;
  };
}
