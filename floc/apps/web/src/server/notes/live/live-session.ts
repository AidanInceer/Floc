const CLIENT_IP_HEADER = "x-real-ip";

export function sessionResolver(origin: string, fetchFn: typeof fetch = fetch) {
  return async (headers: Headers): Promise<string | null> => {
    const cookie = headers.get("cookie");
    if (!cookie) return null;
    const ip = headers.get(CLIENT_IP_HEADER);
    const res = await fetchFn(`${origin}/api/auth/get-session?disableCookieCache=true`, {
      headers: ip ? { cookie, [CLIENT_IP_HEADER]: ip } : { cookie },
    });
    if (!res.ok) return null;
    const session = (await res.json()) as { user?: { id?: string } } | null;
    return session?.user?.id ?? null;
  };
}
