export type FriendQuery =
  | { kind: "code"; code: string }
  | { kind: "name"; name: string };

/** No I, L, O, 0 or 1 — a code is read aloud and typed from a screenshot. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE = /^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;
const HAS_DIGIT = /[2-9]/;

/** Why a digit: without one, "Anne-Mary" is a well-formed code. */
function isFriendCode(value: string): boolean {
  return CODE.test(value) && HAS_DIGIT.test(value);
}

export function readFriendQuery(input: string): FriendQuery | null {
  const trimmed = input.trim();
  // Why: no lookup by address, ever (#360) — it would test which ones are accounts.
  if (trimmed.includes("@")) return null;
  const upper = trimmed.replace(/\s+/g, "").toUpperCase();
  if (isFriendCode(upper)) return { kind: "code", code: upper };
  return trimmed.length >= 2 ? { kind: "name", name: trimmed } : null;
}

/** 248 = 8 × 31: a byte at or above it is dropped, so no letter is likelier than another. */
export function generateFriendCode(randomBytes: (size: number) => Uint8Array): string {
  for (;;) {
    const chars: string[] = [];
    while (chars.length < 8) {
      for (const byte of randomBytes(8 - chars.length)) {
        if (byte < 248) chars.push(ALPHABET[byte % 31]);
      }
    }
    const code = `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
    if (isFriendCode(code)) return code;
  }
}
