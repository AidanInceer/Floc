// Why: local dev shares the Google client and the Stripe sandbox; the webhook secret stays, as `stripe listen` signs locally.
const SHARED_WITH_DEV = ["GOOGLE_CLIENT_SECRET", "STRIPE_SECRET_KEY"] as const;

export function updateEnvText(text: string, values: Record<string, string | undefined>) {
  const changed: string[] = [];
  const lines = text.split(/\r?\n/).map((line) => {
    const name = /^\s*([A-Z0-9_]+)\s*=/.exec(line)?.[1];
    const value = name && SHARED_WITH_DEV.some((shared) => shared === name) ? values[name] : undefined;
    if (!name || !value) return line;
    const current = line.slice(line.indexOf("=") + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    if (current === value) return line;
    changed.push(name);
    return `${name}=${value}`;
  });
  return { text: lines.join(text.includes("\r\n") ? "\r\n" : "\n"), changed };
}
