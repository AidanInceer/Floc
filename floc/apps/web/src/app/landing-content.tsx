/**
 * Landing-page content and glyphs (ticket 192 reskin). Split out of `page.tsx`
 * only to keep that file under its line ceiling — pure data plus the marketing
 * icon set, no I/O.
 */
import type { ReactNode } from "react";

// ── icons ────────────────────────────────────────────────────────────────
// Line-art in the app's own hand (CLAUDE.md: no emoji, no icon fonts). 14×14
// viewBox, fill none, currentColor, hairline stroke.
export type GlyphName =
  | "dates"
  | "days"
  | "money"
  | "people"
  | "book"
  | "star"
  | "check"
  | "app"
  | "packing"
  | "notes"
  | "files"
  | "flight"
  | "offline"
  | "inbox"
  | "pin"
  | "nav"
  | "compass"
  | "alert"
  | "weather";

const PATHS: Record<GlyphName, ReactNode> = {
  dates: (
    <>
      <rect x="1.8" y="2.8" width="10.4" height="9.4" rx="1.6" />
      <path d="M1.8 5.4h10.4M4.4 1.6v2.4M9.6 1.6v2.4" />
    </>
  ),
  days: (
    <>
      <path d="M7 12.6S2.4 8.8 2.4 5.6a4.6 4.6 0 0 1 9.2 0C11.6 8.8 7 12.6 7 12.6Z" />
      <circle cx="7" cy="5.5" r="1.5" />
    </>
  ),
  money: (
    <>
      <circle cx="7" cy="7" r="5.2" />
      <path d="M8.6 5.2c-.4-.6-1-.9-1.7-.9-1 0-1.7.5-1.7 1.3 0 1.9 3.6.9 3.6 2.9 0 .8-.8 1.4-1.9 1.4-.8 0-1.5-.3-1.9-1M7 3.4v7.2" />
    </>
  ),
  people: (
    <>
      <circle cx="5.2" cy="5" r="2" />
      <path d="M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3" />
      <path d="M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8" />
    </>
  ),
  book: (
    <>
      <path d="M7 3.4C6 2.6 4.6 2.3 2.6 2.4c-.5 0-.8.3-.8.8v6.9c0 .5.4.8.9.7 1.7-.1 3 .2 4.3 1 1.3-.8 2.6-1.1 4.3-1 .5 0 .9-.2.9-.7V3.2c0-.5-.3-.8-.8-.8-2-.1-3.4.2-4.4 1Z" />
      <path d="M7 3.4v7.4" />
    </>
  ),
  star: (
    <path d="M7 1.8l1.5 3.4 3.7.3-2.8 2.4.9 3.6L7 9.9 3.7 11.5l.9-3.6L1.8 5.5l3.7-.3Z" />
  ),
  check: (
    <path d="M2.6 7.4 5.6 10.4 11.4 4" />
  ),
  app: (
    <>
      <rect x="3.4" y="1.6" width="7.2" height="10.8" rx="1.6" />
      <path d="M5.8 10.6h2.4" />
    </>
  ),
  packing: (
    <>
      <rect x="1.8" y="4.4" width="10.4" height="7.8" rx="1.4" />
      <path d="M5 4.4V3.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2M7 6.8v3" />
    </>
  ),
  notes: (
    <>
      <path d="M3.2 1.8h5l2.6 2.6v7.8H3.2Z" />
      <path d="M8 1.8v2.8h2.8M5 7.4h4M5 9.4h2.6" />
    </>
  ),
  files: (
    <>
      <path d="M1.8 4.2v6.4a1.2 1.2 0 0 0 1.2 1.2h8a1.2 1.2 0 0 0 1.2-1.2V5.4a1.2 1.2 0 0 0-1.2-1.2H6.9L5.7 2.6H3a1.2 1.2 0 0 0-1.2 1.2Z" />
    </>
  ),
  flight: (
    <>
      <path d="M12.4 2.4 6.2 8.6M12.4 2.4l-4 9.8-2.2-3.6-3.6-2.2Z" />
    </>
  ),
  offline: (
    <>
      <path d="M7 2.2v6M4.6 6l2.4 2.4L9.4 6" />
      <path d="M2.2 9.6v1.4a1 1 0 0 0 1 1h7.6a1 1 0 0 0 1-1V9.6" />
    </>
  ),
  inbox: (
    <>
      <path d="M1.8 8.2 3.4 3a1 1 0 0 1 1-.7h5.2a1 1 0 0 1 1 .7l1.6 5.2" />
      <path d="M1.8 8.2h3l.7 1.4h3l.7-1.4h3v2.4a1.2 1.2 0 0 1-1.2 1.2H3a1.2 1.2 0 0 1-1.2-1.2Z" />
    </>
  ),
  nav: (
    <>
      <circle cx="7" cy="7" r="5.2" />
      <path d="M7 4.1 9.3 9.9 7 8.7 4.7 9.9Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="7" cy="7" r="5.2" />
      <path d="M9.3 4.7 8.1 8.1 4.7 9.3 5.9 5.9Z" />
    </>
  ),
  alert: (
    <>
      <path d="M7 2.1 12.5 11.6H1.5Z" />
      <path d="M7 5.9v2.4M7 10.1v.1" />
    </>
  ),
  pin: (
    <>
      <path d="M7 12.4S2.8 8.6 2.8 5.8a4.2 4.2 0 0 1 8.4 0c0 2.8-4.2 6.6-4.2 6.6Z" />
      <circle cx="7" cy="5.7" r="1.4" />
    </>
  ),
  weather: (
    <>
      <circle cx="5.1" cy="4.7" r="2" />
      <path d="M5.1 1.2v.8M5.1 7.4v.8M1.6 4.7h.8M7.8 4.7h.8M2.6 2.2l.6.6M7 6.6l.6.6M7.6 2.2l-.6.6M3.2 6.6l-.6.6" />
      <path d="M6.2 11.9a2.4 2.4 0 0 1 .3-4.8 3.1 3.1 0 0 1 5.8 1.2 1.9 1.9 0 0 1-.5 3.6Z" />
    </>
  ),
};

export function Glyph({
  name,
  className,
}: {
  name: GlyphName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

// ── the feature tour (sc2) ────────────────────────────────────────────────
// In trip order: the tour walks a trip from picking a place to looking back.
export type TourMessage = { from: string; text: string; when?: string; reply?: boolean };

export type TourStop = {
  icon: GlyphName;
  tone: string;
  title: string;
  line: string;
  chat: TourMessage[];
  answer: string;
  detail: string;
  pro?: "yes" | "soon";
  proExtra?: string;
};

const tourStops: TourStop[] = [
  {
    icon: "notes",
    tone: "bg-pastel-yellow text-pastel-yellow-ink",
    title: "Decide where, together",
    line: "One page the whole group writes on",
    chat: [
      { from: "Jo", text: "where are we even going" },
      { from: "Sam", text: "sicily? sardinia?", reply: true },
      { from: "Priya", text: "i sent a link last week somewhere" },
    ],
    answer: "Sicily — 5 of 6 voted",
    detail: "The shortlist, the links and the thing someone read, on one page.",
  },
  {
    icon: "dates",
    tone: "bg-pastel-blue text-pastel-blue-ink",
    title: "Group availability, sorted",
    line: "Shade your free days once",
    chat: [
      { from: "Sam", text: "september?" },
      { from: "Jo", text: "not the second week", reply: true },
      { from: "Alex", text: "i can only do weekends" },
    ],
    answer: "12–19 Sep works for all six",
    detail: "Everyone shades their free days once. The calendar shows the weeks the whole group can make.",
  },
  {
    icon: "weather",
    tone: "bg-pro text-pro-gold border border-pro-edge",
    pro: "yes",
    title: "The weather, in advance",
    line: "For each day you might go",
    chat: [
      { from: "Alex", text: "do i need a coat" },
      { from: "Sam", text: "it's sicily", reply: true },
      { from: "Alex", when: "Friday", text: "it is raining" },
    ],
    answer: "Friday: rain, 22°",
    detail: "Sun, rain and degrees for each day you might go — before you pick the dates.",
  },
  {
    icon: "days",
    tone: "bg-pastel-blue text-pastel-blue-ink",
    title: "A plan, not a schedule",
    line: "Flexible or down to the minute",
    chat: [
      { from: "Priya", text: "what are we doing tuesday" },
      { from: "Alex", text: "vibes", reply: true },
      { from: "Sam", text: "i booked a 9am train??" },
    ],
    answer: "Tuesday: Taormina, 09:40 train",
    detail: "Plan every hour, or just the one thing that matters each day.",
  },
  {
    icon: "files",
    tone: "bg-pastel-red text-pastel-red-ink",
    title: "Tickets, filed",
    line: "Passes attached to the trip",
    proExtra: "Pro: extra trip storage, for every pass and scan",
    chat: [
      { from: "Jo", text: "can someone forward the boarding pass" },
      { from: "Sam", text: "check your email", reply: true },
      { from: "Jo", text: "which email" },
    ],
    answer: "Flights · 6 passes, filed",
    detail: "Confirmations and passes live on the trip. Nobody forwards anything.",
  },
  {
    icon: "packing",
    tone: "bg-pastel-yellow text-pastel-yellow-ink",
    title: "Pack once, pack right",
    line: "What the group brings, what's on you",
    proExtra: "Pro: a list built from the forecast and the plan",
    chat: [
      { from: "Sam", text: "who's bringing the speaker" },
      { from: "Jo", text: "me", reply: true },
      { from: "Priya", text: "me too", reply: true },
    ],
    answer: "Speaker: Sam. Sun cream: you.",
    detail: "Split the list. Nothing doubles up, nothing gets forgotten.",
  },
  {
    icon: "money",
    tone: "bg-pastel-green text-pastel-green-ink",
    title: "Split the bill, not the group",
    line: "One number each",
    chat: [
      { from: "Priya", text: "flat was 960, send me your bit" },
      { from: "Jo", text: "minus the taxi i paid?", reply: true },
      { from: "Sam", text: "and thursday dinner" },
    ],
    answer: "You owe Priya £42.50",
    detail: "Log what you paid and how it splits. One number each.",
  },
  {
    icon: "book",
    tone: "bg-pastel-blue text-pastel-blue-ink",
    title: "Memories you won't forget",
    line: "Still there in ten years",
    chat: [
      { from: "Sam", when: "2037", text: "where was that flat in palermo" },
      { from: "Jo", when: "2037", text: "no idea, new phone", reply: true },
    ],
    answer: "Sicily, Sept 2027 — all of it",
    detail: "Come back in ten years and the whole trip is where you left it.",
  },
  {
    icon: "flight",
    tone: "bg-pro text-pro-gold border border-pro-edge",
    pro: "soon",
    title: "A travel agent in your pocket",
    line: "A day that fixes itself",
    chat: [
      { from: "Alex", text: "train's cancelled" },
      { from: "Priya", text: "ok so what now", reply: true },
      { from: "Sam", text: "googling" },
    ],
    answer: "Next train 10:25 — day moved back an hour",
    detail: "Ideas worth doing, and a day that quietly reshuffles when something slips.",
  },
];

/** With every feature free there is no Pro to point at, so its stops and asides go. */
export function tourFor(sellingPro: boolean): TourStop[] {
  if (sellingPro) return tourStops;
  return tourStops.filter((s) => !s.pro).map((s) => ({ ...s, proExtra: undefined }));
}

// ── the sample map (sc3) ─────────────────────────────────────────────────
// Illustrative sample, not a live query — a settled Sicily route so the map
// shows the thing the page is selling. Drag and zoom are live (RouteMap).
export const sampleStops = [
  { no: 1, name: "Palermo", days: 2, lat: 38.1157, lng: 13.3615 },
  { no: 2, name: "Cefalù", days: 1, lat: 38.0392, lng: 14.023 },
  { no: 3, name: "Taormina", days: 2, lat: 37.8516, lng: 15.2853 },
  { no: 4, name: "Syracuse", days: 2, lat: 37.0755, lng: 15.2866 },
];
