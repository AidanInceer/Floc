import type { GlyphName } from "../landing-glyph";

export type SlideTone = "yellow" | "blue" | "red" | "green";

export type TourSlide = {
  key: string;
  tab: string;
  icon: GlyphName;
  tone: SlideTone;
  title: string;
  line: string;
  /** The group-chat line this slide replaces. */
  before: string;
  proExtra?: string;
};

// In trip order: picking a place, then the week, the days, the bills, the bags and the passes.
export const TOUR_SLIDES: TourSlide[] = [
  {
    key: "where",
    tab: "Where",
    icon: "notes",
    tone: "yellow",
    title: "Decide where, together",
    line: "One page for the shortlist, the links and the vote.",
    before: "i sent a link last week somewhere",
  },
  {
    key: "when",
    tab: "When",
    icon: "dates",
    tone: "blue",
    title: "Find the week everyone can make",
    line: "Everyone shades their free days once. The weeks that work for all six show up.",
    before: "september? not the second week",
  },
  {
    key: "plan",
    tab: "The plan",
    icon: "pin",
    tone: "red",
    title: "A plan, not a schedule",
    line: "Where you sleep each night, and the one thing each day. Or every hour, if that’s you.",
    before: "what are we doing tuesday",
  },
  {
    key: "money",
    tab: "Money",
    icon: "money",
    tone: "green",
    title: "Split the bill, not the group",
    line: "Log what you paid. Everyone gets one number.",
    before: "flat was 960, send me your bit",
  },
  {
    key: "packing",
    tab: "Packing",
    icon: "packing",
    tone: "yellow",
    title: "Pack once, pack right",
    line: "Claim the shared things. Nothing doubles up, nothing gets left.",
    before: "who’s bringing the speaker",
    proExtra: "Pro: a list built from the forecast and the plan",
  },
  {
    key: "tickets",
    tab: "Tickets",
    icon: "files",
    tone: "red",
    title: "Tickets, filed",
    line: "Passes and bookings live on the trip. Nobody forwards anything.",
    before: "can someone forward the boarding pass",
    proExtra: "Pro: extra trip storage, for every pass and scan",
  },
];

/** With every feature free there is no Pro to point at, so the asides go. */
export function tourSlides(sellingPro: boolean): TourSlide[] {
  return sellingPro ? TOUR_SLIDES : TOUR_SLIDES.map((s) => ({ ...s, proExtra: undefined }));
}
