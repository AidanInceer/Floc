/** Short forms Good to know allows. A reader may not know any other, so a tip spells it out or avoids it. */
const ALLOWED = new Set(["UK", "US", "USA", "EU", "UNESCO"]);

/** Genuine proper names and brands. Not train names or terms a reader must decode. */
export const PROPER_NAMES = new Set<string>(["AEON", "EasyCard", "RegioJet", "SafeTravel", "TP"]);

/** A short form passes only when its words are in the same tip. */
const EXPANSIONS: Record<string, RegExp> = {
  ETA: /electronic travel authori[sz]ation/i,
  eTA: /electronic travel authori[sz]ation/i,
  ESTA: /electronic system for travel authori[sz]ation/i,
  NZeTA: /new zealand electronic travel authori(?:[sz]ation|ty)/i,
  ETIAS: /european travel information and authori[sz]ation system/i,
  EES: /entry[/ ]*(?:and )?exit system/i,
  "K-ETA": /korea electronic travel authori[sz]ation/i,
  eSIM: /digital SIM/i,
  "4x4": /four-wheel drive/i,
};

/** A short form that is always wrong, with what to write instead. */
const BANNED: Record<string, string> = {
  ATM: "cash machine",
  ID: "photo identity",
  UV: "sun strength",
  FCDO: "UK government",
  QR: "QR code",
};

/** Phrases whose short form is fine when written whole. */
const PHRASES = /\b(?:QR codes?|SIM cards?|digital SIMs?)\b/g;

const TOKEN = /[A-Za-z0-9][A-Za-z0-9-]*/g;
const ROMAN = /^(?:X{0,3})(?:IX|IV|V?I{0,3})$/;

function isShort(token: string): boolean {
  return (token.match(/[A-Z]/g)?.length ?? 0) >= 2 || /^\d+x\d+$/i.test(token);
}

function singular(token: string): string {
  return /[A-Z]s$/.test(token) ? token.slice(0, -1) : token;
}

function tokenProblem(token: string, all: string): string | null {
  const key = /^\d+x\d+$/i.test(token) ? token.toLowerCase() : singular(token);
  const banned = BANNED[key];
  if (banned) return `uses ${token}, write "${banned}"`;
  const words = EXPANSIONS[key];
  if (words) return words.test(all) ? null : `uses ${token} without its words`;
  if (ALLOWED.has(key) || PROPER_NAMES.has(key) || (token.length >= 2 && ROMAN.test(key))) return null;
  if (token.includes("-")) {
    for (const part of token.split("-")) {
      const found = tokenProblem(part, all);
      if (found) return found;
    }
    return null;
  }
  return isShort(token) ? `uses ${token}, spell it out` : null;
}

/** What is wrong with the short forms in a tip's words, each as "uses X ...". */
export function shortFormProblems(all: string): string[] {
  const bare = all.replace(PHRASES, " ");
  const problems: string[] = [];
  for (const token of new Set((bare.match(TOKEN) ?? []).map((t) => t.replace(/-+$/, "")))) {
    const found = tokenProblem(token, all);
    if (found) problems.push(found);
  }
  return problems;
}
