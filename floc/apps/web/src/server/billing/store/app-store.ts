/**
 * Apple's side. A signed transaction is only believed once Apple's certificate
 * chain vouches for it. Rule 11: with no keys set, nothing sells and nothing crashes.
 */
import "server-only";

import { Environment, SignedDataVerifier } from "@apple/app-store-server-library";

import { appleFacts, type StoreFacts } from "./store-facts";

function verifiers(): SignedDataVerifier[] | null {
  const bundleId = process.env.APPLE_BUNDLE_ID;
  const appId = Number(process.env.APPLE_APP_ID);
  const certs = process.env.APPLE_ROOT_CERTS;
  if (!bundleId || !appId || !certs) return null;

  const roots = certs.split(",").map((cert) => Buffer.from(cert.trim(), "base64"));
  // Why: App Review and TestFlight buy in the sandbox, against the production server.
  return [Environment.PRODUCTION, Environment.SANDBOX].map(
    (environment) => new SignedDataVerifier(roots, true, environment, bundleId, appId),
  );
}

async function firstVerified<T>(
  all: SignedDataVerifier[],
  read: (verifier: SignedDataVerifier) => Promise<T>,
): Promise<{ value: T; verifier: SignedDataVerifier } | null> {
  for (const verifier of all) {
    try {
      return { value: await read(verifier), verifier };
    } catch {
      continue;
    }
  }
  return null;
}

export async function verifyAppStoreTransaction(
  jws: string,
): Promise<StoreFacts | "refused" | "unavailable"> {
  const all = verifiers();
  if (!all) return "unavailable";

  const found = await firstVerified(all, (verifier) => verifier.verifyAndDecodeTransaction(jws));
  return (found && appleFacts(found.value)) || "refused";
}

export async function readAppStoreNotification(
  signedPayload: string,
): Promise<StoreFacts | "ignored" | "refused" | "unavailable"> {
  const all = verifiers();
  if (!all) return "unavailable";

  const found = await firstVerified(all, (verifier) =>
    verifier.verifyAndDecodeNotification(signedPayload),
  );
  if (!found) return "refused";

  const data = found.value.data;
  if (!data?.signedTransactionInfo) return "ignored";

  const { verifier } = found;
  const tx = await verifier.verifyAndDecodeTransaction(data.signedTransactionInfo);
  const renewal = data.signedRenewalInfo
    ? await verifier.verifyAndDecodeRenewalInfo(data.signedRenewalInfo)
    : null;

  return appleFacts(tx, renewal, data.status ?? null) ?? "ignored";
}
