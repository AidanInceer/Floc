import { heroVotes } from "@/lib/landing/hero/hero-votes";

const VOTE_START = 700;
const VOTE_GAP = 480;

// One beat per vote, then each card left to right, each waiting for the one before to finish. Everything after the vote runs a quarter slower than the vote itself.
export const BEATS = [
  ...heroVotes.map((_, i) => VOTE_START + i * VOTE_GAP),
  3800, // dates agree
  5300, // route draws
  7100, 7575, 8050, // three expenses land
  8850, // money settles up
  10100, // packing reels spin
  13300, // every reel has landed
] as const;

export const VOTED = heroVotes.length;
export const DATED = VOTED + 1;
export const ROUTED = VOTED + 2;
export const SPENT = VOTED + 3;
export const SETTLED = VOTED + 6;
export const SPUN = VOTED + 7;
export const CLAIMED = VOTED + 8;

// The plane crosses the whole scene: from the first vote until the last reel locks.
export const FLIGHT_MS = 13900 - VOTE_START;

export const kicker = "font-mono text-[10px] uppercase tracking-[0.1em] opacity-80";
