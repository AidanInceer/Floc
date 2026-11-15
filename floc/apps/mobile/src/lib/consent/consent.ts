/**
 * The consent choice on the phone (#368): the same two choices as the web, both off until a yes, asked again
 * after a year. The phone stores nothing "functional" today, so only analytics has a switch.
 */
import { NO_CONSENT, encodeConsent, readConsent, type ConsentChoice } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";
import * as SecureStore from "expo-secure-store";

const KEY = "floc.consent";

type Store = Pick<typeof SecureStore, "getItemAsync" | "setItemAsync">;

let held: ConsentChoice = NO_CONSENT;
const listeners = new Set<() => void>();

const tell = () => {
  for (const listener of listeners) listener();
};

/** Reads the stored choice once at start. A refused or empty store is a no. */
export async function loadConsent(store: Store = SecureStore): Promise<ConsentChoice> {
  try {
    held = readConsent(await store.getItemAsync(KEY), today()) ?? NO_CONSENT;
  } catch {
    held = NO_CONSENT;
  }
  tell();
  return held;
}

export async function saveConsent(choice: ConsentChoice, store: Store = SecureStore): Promise<void> {
  held = choice;
  tell();
  await store.setItemAsync(KEY, encodeConsent(choice, today())).catch(() => {});
}

export const currentConsent = (): ConsentChoice => held;

export function onConsentChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
