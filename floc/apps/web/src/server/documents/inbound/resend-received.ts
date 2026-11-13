/**
 * What Resend knows about a received mail (#328, #559): whether the From is proven, the HTML to read a
 * booking from, and whether the mail is one Floc must not answer.
 *
 * Why proof is a DMARC or DKIM pass: the From is the whole claim of whose files a booking lands in, and anyone
 * can type one. Resend reports a DKIM pass only when the signing domain is the From domain. SPF alone is not
 * enough: it checks the envelope sender, which need not match the From (ADR-039).
 */
import "server-only";

type Check = "pass" | "fail" | "gray" | "processing_failed" | "unknown";
type Header = { name?: string; value?: string };
type Received = {
  authentication?: { spf?: Check; dkim?: Check; dmarc?: Check } | null;
  html?: string | null;
  headers?: Record<string, unknown> | Header[] | null;
};

export type ReceivedMail = {
  proven: boolean;
  /** Hostile input: only ever handed to `readSchemaOrg`, never stored, shown or logged. */
  html: string | null;
  /** An auto-reply, a list or bulk mail: answering one can start a mail loop. */
  automated: boolean;
  /** Why: a mail with two From addresses has passed the checks of large providers with a forged one (CERT VU#517845). */
  severalFrom: boolean;
};

const MAX_HTML = 2_000_000;
const ADDRESS = /[^\s<>,;"']+@[^\s<>,;"']+/g;

function headerMap(raw: Received["headers"]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (name: unknown, value: unknown) => {
    if (typeof name !== "string") return;
    const values = Array.isArray(value) ? value : [value];
    const kept = values.filter((v): v is string => typeof v === "string");
    map.set(name.toLowerCase(), [...(map.get(name.toLowerCase()) ?? []), ...kept]);
  };
  if (Array.isArray(raw)) raw.forEach((header) => add(header?.name, header?.value));
  else if (raw && typeof raw === "object") Object.entries(raw).forEach(([name, value]) => add(name, value));
  return map;
}

export function readReceived(received: Received): ReceivedMail {
  const headers = headerMap(received.headers);
  const from = headers.get("from") ?? [];
  const checks = received.authentication;
  const html = typeof received.html === "string" && received.html.length <= MAX_HTML ? received.html : null;
  const autoSubmitted = (headers.get("auto-submitted") ?? []).some((value) => value.trim().toLowerCase() !== "no");
  const bulk = (headers.get("precedence") ?? []).some((value) => /bulk|junk|list/i.test(value));
  const list = [...headers.keys()].some((name) => name.startsWith("list-"));
  return {
    proven: checks?.dmarc === "pass" || checks?.dkim === "pass",
    html,
    automated: autoSubmitted || bulk || list,
    severalFrom: from.length > 1 || from.some((line) => (line.match(ADDRESS) ?? []).length > 1),
  };
}

export async function resendReceived(
  emailId: string,
  apiKey: string,
  fetcher: (url: string, init?: RequestInit) => Promise<Response> = fetch,
): Promise<ReceivedMail> {
  const res = await fetcher(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Resend read the received email with ${res.status}`);
  return readReceived((await res.json()) as Received);
}
