import { heroVotes } from "@/lib/landing/hero/hero-votes";

const VOTE_START = 300;
const VOTE_GAP = 480;

// One beat per vote, then each card left to right, each waiting for the one before to finish. Everything after the vote runs a quarter slower than the vote itself.
export const BEATS = [
  ...heroVotes.map((_, i) => VOTE_START + i * VOTE_GAP),
  3400, // dates agree
  4900, // route draws
  6700, 7175, 7650, // three expenses land
  8450, // money settles up
  9700, // packing reels spin
  12900, // every reel has landed
] as const;

export const VOTED = heroVotes.length;
export const DATED = VOTED + 1;
export const ROUTED = VOTED + 2;
export const SPENT = VOTED + 3;
export const SETTLED = VOTED + 6;
export const SPUN = VOTED + 7;
export const CLAIMED = VOTED + 8;

// The plane crosses the whole scene: from the first vote until the last reel locks. The headline's mark ends with it.
export const SCENE_END_MS = 13500;
export const FLIGHT_MS = SCENE_END_MS - VOTE_START;

export const kicker = "deck-kicker font-mono text-[10px] uppercase tracking-[0.1em] opacity-80";

export type DeckCard = "votes" | "dates" | "ticket" | "money" | "pack";

/** The card the scene is playing at `step`: none before the first beat or once the last reel locks. */
export function playingCard(step: number): DeckCard | null {
  if (step <= 0 || step >= CLAIMED) return null;
  if (step <= VOTED) return "votes";
  if (step === DATED) return "dates";
  if (step === ROUTED) return "ticket";
  return step < SPUN ? "money" : "pack";
}
