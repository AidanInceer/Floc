export type FriendQuery =
  | { kind: "code"; code: string }
  | { kind: "name"; name: string };

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SUFFIX = /^[A-HJKMNP-Z2-9]{4}$/i;

export function friendTagNameKey(name: string): string {
  return name.trim().normalize("NFC").toLowerCase();
}

export function readFriendQuery(input: string): FriendQuery | null {
  const trimmed = input.trim();
  if (trimmed.length > 254) return null;
  const hash = trimmed.lastIndexOf("#");
  if (hash !== -1) {
    const name = trimmed.slice(0, hash).trim();
    const suffix = trimmed.slice(hash + 1);
    return name && SUFFIX.test(suffix)
      ? { kind: "code", code: `${name}#${suffix.toUpperCase()}` }
      : null;
  }
  // Why: no lookup by address, ever (#360) — it would test which ones are accounts.
  if (trimmed.includes("@")) return null;
  return trimmed.length >= 2 ? { kind: "name", name: trimmed } : null;
}

/** 248 = 8 × 31: a byte at or above it is dropped, so no letter is likelier than another. */
export function generateFriendTagSuffix(randomBytes: (size: number) => Uint8Array): string {
  const chars: string[] = [];
  while (chars.length < 4) {
    for (const byte of randomBytes(4 - chars.length)) {
      if (byte < 248) chars.push(ALPHABET[byte % 31]);
    }
  }
  return chars.join("");
}
