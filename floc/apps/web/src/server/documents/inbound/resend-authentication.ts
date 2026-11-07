/**
 * Whether the receiving server proved a received email's From (#328). The From is the whole claim of whose
 * files a booking lands in, and anyone can type one, so Floc believes it only on a DMARC pass, or a DKIM pass,
 * which Resend reports only when the signing domain is the From domain. SPF alone is not enough: it checks the
 * envelope sender, which need not match the From.
 */
import "server-only";

type Check = "pass" | "fail" | "gray" | "processing_failed" | "unknown";
type Received = { authentication?: { spf?: Check; dkim?: Check; dmarc?: Check } | null };

export async function resendFromProven(
  emailId: string,
  apiKey: string,
  fetcher: (url: string, init?: RequestInit) => Promise<Response> = fetch,
): Promise<boolean> {
  const res = await fetcher(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Resend read the received email with ${res.status}`);
  const checks = ((await res.json()) as Received).authentication;
  return checks?.dmarc === "pass" || checks?.dkim === "pass";
}
